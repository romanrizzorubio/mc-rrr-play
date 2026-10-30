import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {MatchRest} from '../../src/server/rest/match-rest.js';
import {AuthServiceClient} from '../../src/utils/auth-service-client.js';
import {Mc} from '../../src/server/mc.js';
import {serializeMatch} from '../../src/utils/match-serialization.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {MongoDataStore} from '../../../mc-data/index.js';

describe('MatchRest', () => {
    const withIdentity = async (id, callback) => {
        const authenticate = AuthServiceClient.authenticate;
        AuthServiceClient.authenticate = async () => ({id, name: id});
        try {
            return await callback();
        } finally {
            AuthServiceClient.authenticate = authenticate;
        }
    };

    test('requires an authenticated user to list matches', async () => {
        const matchRest = new MatchRest({mc: {matches: {}}});

        await assert.rejects(
            matchRest.getMatchesList({cookie: undefined}),
            error => error.statusCode === 401,
        );
    });

    test('lists only matches with the authenticated player and includes hero and aspect', async () => {
        const authenticate = AuthServiceClient.authenticate;
        AuthServiceClient.authenticate = async cookie => {
            assert.equal(cookie, 'session=player-1');

            return {id: 'player-1', name: 'Player'};
        };
        const playerMatch = {
            name: 'match-with-player',
            creatorUserId: 'player-1',
            id: 'match-1',
            initialized: true,
            initializing: false,
            playing: true,
            scenario: {name: 'Escenario'},
            players: [
                {
                    userId: 'player-1',
                    name: 'Player',
                    superhero: {mainName: 'Spider-Man'},
                    config: {aspect: 'justice'},
                },
                {
                    userId: 'player-2',
                    name: 'Other Player',
                    superhero: {mainName: 'Iron Man'},
                    config: {aspect: 'leadership'},
                },
            ],
        };
        const otherMatch = {
            ...playerMatch,
            id: 'match-2',
            creatorUserId: 'player-2',
            name: 'match-without-player',
            players: [{
                userId: 'player-2',
                name: 'Other Player',
                superhero: {mainName: 'Iron Man'},
                config: {aspect: 'leadership'},
            }],
        };
        const matchRest = new MatchRest({
            mc: {
                data: {getScenariosList: async () => []},
                matches: {
                    [playerMatch.name]: playerMatch,
                    [otherMatch.name]: otherMatch,
                },
            },
        });

        try {
            assert.deepEqual(await matchRest.getMatchesList({
                cookie: 'session=player-1',
            }), [{
                id: 'match-1',
                name: 'match-with-player',
                creatorUserId: 'player-1',
                initialized: true,
                initializing: false,
                playing: true,
                scenario: 'Escenario',
                scenarioName: 'Escenario',
                players: [
                    {
                        userId: 'player-1',
                        name: 'Player',
                        hero: 'Spider-Man',
                        aspect: 'justice',
                    },
                    {
                        userId: 'player-2',
                        name: 'Other Player',
                        hero: 'Iron Man',
                        aspect: 'leadership',
                    },
                ],
            }]);
        } finally {
            AuthServiceClient.authenticate = authenticate;
        }
    });

    test('a non-playing creator can list the match without granting access to other accounts', async () => {
        const match = {
            id: 'organized', name: 'organized', creatorUserId: 'creator',
            players: [{userId: 'guest', name: 'Invitado', superhero: {mainName: 'Iron Man'}, config: {}}],
        };
        const rest = new MatchRest({mc: {
            data: {getScenariosList: async () => []}, matches: {organized: match},
        }});
        await withIdentity('creator', async () => {
            const summaries = await rest.getMatchesList({});
            assert.equal(summaries.length, 1);
            assert.equal(summaries[0].creatorUserId, 'creator');
        });
        await withIdentity('other', async () => {
            assert.deepEqual(await rest.getMatchesList({}), []);
        });
    });

    test('uses the catalog Spanish scenario name without changing its identifier', async () => {
        assert.equal(rhino.name, 'Rino');
        assert.equal(rhino.config.name, 'rhino');
        const rest = new MatchRest({mc: {
            data: {getScenariosList: async () => [rhino]},
            matches: {
                partida: {
                    name: 'partida',
                    creatorUserId: 'creator',
                    scenario: {name: rhino.config.name},
                    players: [{
                        userId: 'creator',
                        name: 'Creador',
                        superhero: {mainName: 'Capitán América'},
                        config: {},
                    }],
                },
            },
        }});
        await withIdentity('creator', async () => {
            const [match] = await rest.getMatchesList({cookie: 'session=creator'});
            assert.equal(match.scenario, 'rhino');
            assert.equal(match.scenarioName, 'Rino');
            assert.equal(match.creatorUserId, 'creator');
        });
    });

    test('creator deletion removes the active match and its persisted snapshot', async () => {
        const mc = new Mc();
        const deleted = [];
        mc.data = {deleteMatchSnapshot: async name => deleted.push(name)};
        mc.mcSocket.dialogSocket.clearPending = name => deleted.push(`dialogs:${name}`);
        const match = new Match({name: 'partida', creatorUserId: 'creator', mc});
        match.playing = true;
        mc.setMatch(match);
        await withIdentity('creator', async () => {
            assert.deepEqual(await new MatchRest({mc}).deleteMatch({
                name: match.name,
                cookie: 'session=creator',
            }), {name: match.name});
        });
        assert.equal(mc.getMatch(match.name), undefined);
        assert.equal(match.playing, false);
        assert.deepEqual(deleted, ['partida', 'dialogs:partida']);
    });

    test('a guest player cannot delete a match or forge the creator identity', async () => {
        const mc = new Mc();
        let deleted = false;
        mc.data = {deleteMatchSnapshot: async () => { deleted = true; }};
        const match = new Match({name: 'partida', creatorUserId: 'creator', mc});
        mc.setMatch(match);
        await withIdentity('guest', () => assert.rejects(
            new MatchRest({mc}).deleteMatch({
                name: match.name,
                cookie: 'session=guest',
                creatorUserId: 'guest',
                userId: 'creator',
            }),
            error => error.statusCode === 403,
        ));
        assert.equal(deleted, false);
        assert.equal(mc.getMatch(match.name), match);
    });

    test('validates the persisted creator before deleting an unloaded match', async () => {
        const match = new Match({name: 'persistida', creatorUserId: 'creator'});
        const mc = new Mc();
        const deleted = [];
        mc.data = {
            getMatchSnapshot: async name => {
                assert.equal(name, match.name);
                return serializeMatch(match);
            },
            deleteMatchSnapshot: async name => deleted.push(name),
        };
        mc.mcSocket.dialogSocket.clearPending = () => {};
        const rest = new MatchRest({mc});
        await withIdentity('guest', () => assert.rejects(
            rest.deleteMatch({name: match.name, cookie: 'session=guest'}),
            error => error.statusCode === 403,
        ));
        assert.deepEqual(deleted, []);
        await withIdentity('creator', () => rest.deleteMatch({
            name: match.name,
            cookie: 'session=creator',
        }));
        assert.deepEqual(deleted, [match.name]);
    });

    test('requires authentication for deletion and keeps missing matches idempotent', async () => {
        const mc = new Mc();
        mc.data = {getMatchSnapshot: async () => null};
        const rest = new MatchRest({mc});
        await assert.rejects(rest.deleteMatch({name: 'missing'}),
            error => error.statusCode === 401);
        await assert.rejects(rest.deleteMatch({name: {}}),
            error => error.statusCode === 400);
        await withIdentity('creator', async () => {
            assert.deepEqual(await rest.deleteMatch({
                name: 'missing', cookie: 'session=creator',
            }), {name: 'missing'});
        });
    });

    test('reads one persisted snapshot by its exact name', async () => {
        const data = new MongoDataStore();
        const snapshot = serializeMatch(new Match({name: 'persistida', creatorUserId: 'creator'}));
        data.database = {
            collection: () => ({
                findOne: async (query, options) => {
                    assert.deepEqual(query, {_id: 'persistida'});
                    assert.deepEqual(options, {projection: {snapshot: 1}});
                    return {snapshot};
                },
            }),
        };
        assert.equal(await data.getMatchSnapshot('persistida'), snapshot);
    });

    test('persists the expert option without creating a nested match snapshot', async () => {
        const match = new Match({name: 'compact-creation-config'});
        match.creationConfig.players.push({
            name: 'Player',
            initial: true,
            config: {sides: [], cards: [], precon: []},
        });
        match.creationConfig.scenario = {
            name: 'Scenario',
            villains: [],
            mainSchemes: [],
            cards: [],
        };
        match.initMatch = async expert => {
            match.initialized = true;
            match.expert = expert;
        };
        match.toObjWithPlayableHands = async () => ({name: match.name});

        const result = await new MatchRest({mc: {}}).initMatch({
            match,
            expert: true,
        });

        assert.deepEqual(result, {name: match.name});
        assert.equal(match.creationConfig.expert, true);
        assert.equal(Object.hasOwn(match, 'creationSnapshot'), false);
    });
});
