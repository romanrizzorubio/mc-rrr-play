import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {BSON} from 'mongodb';
import {Match} from '../../src/model/match/match.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Mc} from '../../src/server/mc.js';
import {MatchRest} from '../../src/server/rest/match-rest.js';
import {serializeMatch} from '../../src/utils/match-serialization.js';
import {EVENTS} from 'mc-endpoints';
import riskyBusiness from '../../../mc-data/seed/catalog/scenarios/risky-business.js';
import spiderman from '../../../mc-data/seed/catalog/heroes/spiderman.js';

describe('match reset', () => {
    test('Mc resolves a match by its stable ID', () => {
        const match = {id: 'stable-match-id', name: 'match-name'};
        const mc = Object.assign(Object.create(Mc.prototype), {
            matches: {[match.name]: match},
        });

        assert.equal(mc.getMatchById(match.id), match);
        assert.equal(mc.getMatch(match.id), match);
    });

    test('reset restores the initial match snapshot with the same ID and name', async () => {
        const name = 'match-to-reset';
        const id = 'stable-match-id';
        const initialMatch = new Match({mc: {}, name, id});
        initialMatch.expert = true;
        const currentMatch = new Match({mc: {}, name, id});
        currentMatch.creationSnapshot = serializeMatch(initialMatch);
        currentMatch.initialized = true;
        currentMatch.expert = true;
        currentMatch.playing = true;
        let turnEndDispatched = false;

        const mc = {
            matches: {[name]: currentMatch},
            getMatch: key => mc.matches[key] ||
                Object.values(mc.matches).find(match => match.id === key),
            getMatchById: matchId =>
                Object.values(mc.matches).find(match => match.id === matchId),
            setMatch(match) {
                this.matches[match.name] = match;
            },
            async persistMatch() {},
            mcSocket: {
                dialogSocket: {
                    clearPending(matchName) {
                        assert.equal(matchName, name);
                    },
                },
                dispatch(matchName, endpoint, params) {
                    assert.equal(matchName, name);
                    assert.equal(endpoint, EVENTS.TURN.END);
                    assert.deepEqual(params, {reset: true});
                    turnEndDispatched = true;
                },
            },
        };
        const matchRest = new MatchRest({mc});
        const originalInitMatch = Match.prototype.initMatch;
        const originalToObjWithPlayableHands = Match.prototype.toObjWithPlayableHands;

        Match.prototype.initMatch = async function(expert) {
            assert.equal(this.initializing, true);
            this.initialized = true;
            this.expert = expert;
        };
        Match.prototype.toObjWithPlayableHands = async function() {
            return {id: this.id, name: this.name};
        };

        try {
            const params = {id, match: currentMatch};
            const result = await matchRest.resetMatch(params);
            const resetMatch = mc.matches[name];

            assert.notEqual(resetMatch, currentMatch);
            assert.equal(resetMatch.id, id);
            assert.equal(resetMatch.name, name);
            assert.equal(resetMatch.expert, true);
            assert.equal(params.match, resetMatch);
            assert.deepEqual(result, {id, name});
            assert.equal(resetMatch.initialized, true);
            assert.equal(resetMatch.initializing, false);
            assert.equal(currentMatch.playing, false);
            assert.equal(turnEndDispatched, true);
        } finally {
            Match.prototype.initMatch = originalInitMatch;
            Match.prototype.toObjWithPlayableHands = originalToObjWithPlayableHands;
        }
    });

    test('reset restores the hero to alter-ego and removes previously played upgrades', async () => {
        const name = 'match-with-played-upgrades';
        const id = 'match-with-played-upgrades-id';
        const playerConfig = structuredClone(spiderman.config);
        const scenarioConfig = structuredClone(riskyBusiness.config);
        const mc = {
            data: {
                async getSetConfig(setId) {
                    return {
                        name: setId,
                        standard: setId === 'standard',
                        cards: [],
                    };
                },
            },
        };
        const currentMatch = new Match({mc, name, id});
        const player = currentMatch.createPlayer({
            name: 'Peter',
            superhero: new MatchFactory(currentMatch).createSuperhero(playerConfig),
            initial: true,
            config: playerConfig,
        });
        currentMatch.creationConfig = {
            players: [{
                name: 'Peter',
                initial: true,
                config: structuredClone(spiderman.config),
            }],
            scenario: scenarioConfig,
            expert: false,
        };
        currentMatch.scenario = {
            name: scenarioConfig.name,
            sets: [],
        };
        player.initPlayer();
        const playedUpgrade = player.deck.cards.find(card => card.isUpgrade);
        player.addToGameZone(playedUpgrade);
        player.superhero.selectedSide = 1;
        currentMatch.initialized = true;
        currentMatch.playing = true;

        const gameMc = {
            data: mc.data,
            getMatchById: () => currentMatch,
            setMatch(match) {
                this.currentMatch = match;
            },
            async persistMatch(match) {
                this.persistedSnapshot = serializeMatch(match);
            },
            mcSocket: {
                dialogSocket: {
                    clearPending() {},
                },
                dispatch() {},
            },
        };
        const matchRest = new MatchRest({mc: gameMc});
        const originalInitMatch = Match.prototype.initMatch;
        const originalToObjWithPlayableHands = Match.prototype.toObjWithPlayableHands;

        Match.prototype.initMatch = async function() {
            const [resetPlayer] = this.players;

            assert.equal(resetPlayer.superhero.currentSide.name, 'Peter Parker');
            assert.equal(resetPlayer.gameZone, undefined);
            resetPlayer.initPlayer();
            assert.equal(resetPlayer.gameZone.cards.length, 0);
            assert.ok(resetPlayer.deck.cards.some(card =>
                card.name === playedUpgrade.name));
            assert.equal(this.scenario.scenarioCards.filter(card =>
                card.name === 'Soborno').length, 2);
            assert.equal(this.creationConfig.scenario.cards.find(({card}) =>
                card.params.name === 'Soborno').count, 2);
            this.initialized = true;
            this.playing = true;
        };
        Match.prototype.toObjWithPlayableHands = async function() {
            return {
                id: this.id,
                name: this.name,
                players: this.players.map(({superhero, gameZone}) => ({
                    identity: superhero.currentSide.name,
                    upgrades: gameZone.cards.filter(card => card.isUpgrade).map(card => card.name),
                })),
                sobornoCopies: this.scenario.scenarioCards.filter(card =>
                    card.name === 'Soborno').length,
            };
        };

        try {
            assert.equal(player.superhero.currentSide.name, 'Spiderman');
            assert.deepEqual(
                player.gameZone.cards.filter(card => card.isUpgrade).map(card => card.name),
                [playedUpgrade.name]
            );

            const result = await matchRest.resetMatch({
                id,
                match: currentMatch,
            });

            assert.deepEqual(result.players, [{
                identity: 'Peter Parker',
                upgrades: [],
            }]);
            assert.equal(result.sobornoCopies, 2);
            assert.equal(Object.hasOwn(gameMc.currentMatch, 'creationSnapshot'), false);
            await gameMc.persistMatch(gameMc.currentMatch);
            const bsonSnapshot = BSON.serialize({
                _id: name,
                snapshot: gameMc.persistedSnapshot,
            });
            assert.ok(bsonSnapshot.length < 16 * 1024 * 1024);
        } finally {
            Match.prototype.initMatch = originalInitMatch;
            Match.prototype.toObjWithPlayableHands = originalToObjWithPlayableHands;
        }
    });

    test('reset rebuilds the selected modular sets for an older match without a snapshot', async () => {
        const name = 'legacy-match';
        const id = 'legacy-match-id';
        const playerConfig = {id: 'she-hulk', aspect: 'leadership'};
        const currentMatch = new Match({mc: {}, name, id});
        currentMatch.initialized = true;
        currentMatch.expert = true;
        currentMatch.players = [{
            name: 'Hulka',
            initial: true,
            config: playerConfig,
        }];
        currentMatch.scenario = {
            name: 'risky-business',
            sets: [
                {cards: [{card: {set: 'standard'}}]},
                {cards: [{card: {set: 'goblin-gimmicks'}}]},
                {cards: [{card: {set: 'legions-of-hydra'}}]},
            ],
        };

        let scenarioConfig;
        const originalCreateSuperhero = MatchFactory.prototype.createSuperhero;
        const originalCreateScenario = MatchFactory.prototype.createScenario;
        const originalInitMatch = Match.prototype.initMatch;
        const originalToObjWithPlayableHands = Match.prototype.toObjWithPlayableHands;
        MatchFactory.prototype.createSuperhero = () => ({});
        MatchFactory.prototype.createScenario = async config => {
            scenarioConfig = config;

            return {name: config.name};
        };
        Match.prototype.initMatch = async function(expert) {
            assert.equal(this.initializing, true);
            this.initialized = true;
            this.expert = expert;
        };
        Match.prototype.toObjWithPlayableHands = async function() {
            return {id: this.id, name: this.name};
        };

        const mc = {
            matches: {[name]: currentMatch},
            getMatch: key => mc.matches[key] ||
                Object.values(mc.matches).find(match => match.id === key),
            getMatchById: matchId =>
                Object.values(mc.matches).find(match => match.id === matchId),
            setMatch(match) {
                this.matches[match.name] = match;
            },
            async persistMatch() {},
            data: {
                async getScenarioConfig(scenarioName) {
                    return {
                        name: scenarioName,
                        sets: ['standard', 'experimental-weapons'],
                        defaultSets: ['goblin-gimmicks'],
                    };
                },
                async getSetConfig(setId) {
                    return {
                        name: setId,
                        standard: setId === 'standard',
                        cards: [],
                    };
                },
            },
            mcSocket: {
                dialogSocket: {
                    clearPending() {},
                },
                dispatch() {},
            },
        };
        const matchRest = new MatchRest({mc});

        try {
            await matchRest.resetMatch({id, match: currentMatch});

            const resetMatch = mc.matches[name];
            assert.notEqual(resetMatch, currentMatch);
            assert.equal(resetMatch.id, id);
            assert.equal(resetMatch.name, name);
            assert.equal(resetMatch.players[0].name, 'Hulka');
            assert.equal(resetMatch.players[0].initial, true);
            assert.equal(resetMatch.players[0].config, playerConfig);
            assert.deepEqual(
                scenarioConfig.sets,
                ['standard', 'experimental-weapons']
            );
            assert.deepEqual(scenarioConfig.defaultSets, [
                'goblin-gimmicks',
                'legions-of-hydra',
            ]);
            assert.equal(resetMatch.expert, true);
        } finally {
            MatchFactory.prototype.createSuperhero = originalCreateSuperhero;
            MatchFactory.prototype.createScenario = originalCreateScenario;
            Match.prototype.initMatch = originalInitMatch;
            Match.prototype.toObjWithPlayableHands = originalToObjWithPlayableHands;
        }
    });

    test('reset rejects an ID that does not match the requested match header', async () => {
        const requestedMatch = {id: 'requested-id', name: 'requested'};
        const headerMatch = {id: 'header-id', name: 'header'};
        const mc = {
            getMatchById: id => id === requestedMatch.id ? requestedMatch : undefined,
        };
        const matchRest = new MatchRest({mc});

        await assert.rejects(
            matchRest.resetMatch({id: requestedMatch.id, match: headerMatch}),
            error => error.statusCode === 409
        );
    });

    test('a replaced match does not emit stale refresh events', async () => {
        let sent = false;
        const currentMatch = {id: 'same-match-id', name: 'match-name'};
        const oldMatch = new Match({
            name: currentMatch.name,
            mc: {
                getMatch: () => currentMatch,
                mcSocket: {
                    send() {
                        sent = true;
                    },
                },
            },
        });

        await oldMatch.refresh();

        assert.equal(sent, false);
    });
});
