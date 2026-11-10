import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {getLobbyPlayerSeats, MongoDataStore} from '../index.js';

describe('MongoDataStore match lobbies', () => {
    test('creates empty waiting lobbies with creator and difficulty metadata', async () => {
        let inserted;
        const collection = {
            insertOne: async document => {
                inserted = document;
            },
        };
        const store = new MongoDataStore();
        store.database = {collection: () => collection};

        const lobby = await store.createMatchLobby({
            name: 'Sala de prueba',
            maxPlayers: 3,
            creatorId: 'account-1',
            scenario: {
                id: 'rhino',
                name: 'Rino',
                modularSets: ['bomb-scare'],
            },
            expert: true,
        });

        assert.equal(lobby.id, inserted._id);
        assert.equal(lobby.status, 'waiting');
        assert.equal(lobby.difficulty, 'Experto');
        assert.equal(lobby.creatorId, 'account-1');
        assert.equal(lobby.autoSave, true);
        assert.deepEqual(lobby.players, []);
        assert.deepEqual(inserted.players, []);
        assert.equal(inserted.autoSave, true);
        assert.deepEqual(lobby.scenario, {
            id: 'rhino',
            name: 'Rino',
            modularSets: ['bomb-scare'],
        });

    });

    test('persists manual-save selection on the lobby', async () => {
        let inserted;
        const store = new MongoDataStore();
        store.database = {
            collection: () => ({
                insertOne: async document => { inserted = document; },
            }),
        };

        const lobby = await store.createMatchLobby({
            name: 'Manual',
            maxPlayers: 1,
            creatorId: 'account-1',
            scenario: {id: 'rhino', name: 'Rino', modularSets: []},
            autoSave: false,
        });

        assert.equal(lobby.autoSave, false);
        assert.equal(inserted.autoSave, false);
    });

    test('joins atomically enforce waiting state, total seat capacity and unique hero', async () => {
        const stored = {
            _id: 'lobby-1',
            name: 'Sala',
            creatorId: 'creator',
            maxPlayers: 2,
            status: 'waiting',
            players: [{userId: 'creator', hero: 'spiderman'}],
        };
        let joinFilter;
        const collection = {
            updateOne: async (filter, update) => {
                joinFilter = filter;
                assert.deepEqual(update.$push, {
                    players: {
                        id: update.$push.players.id,
                        userId: 'creator',
                        name: 'Invitado',
                        hero: 'ironman',
                        aspect: 'leadership',
                    },
                });
                const hasCapacity = stored.players.length < stored.maxPlayers;
                const hasUniqueHero = !stored.players.some(player =>
                    player.hero === update.$push.players.hero);
                if (stored.status !== 'waiting' || !hasCapacity ||
                    !hasUniqueHero) {
                    return {modifiedCount: 0};
                }
                stored.players.push(update.$push.players);

                return {modifiedCount: 1};
            },
            findOne: async () => stored,
        };
        const store = new MongoDataStore();
        store.database = {collection: () => collection};
        const joined = await store.joinMatchLobby('lobby-1', {
            userId: 'creator',
            name: 'Invitado',
            hero: 'ironman',
            aspect: 'leadership',
        });

        assert.deepEqual(joined.players.map(({userId}) => userId), ['creator', 'creator']);
        const seatId = joined.players[1].id;
        assert.notEqual(seatId, 'creator');
        assert.equal(typeof seatId, 'string');
        assert.equal(joinFilter._id, 'lobby-1');
        assert.deepEqual(joinFilter.status, 'waiting');
        assert.equal(Object.hasOwn(joinFilter, 'players.userId'), false);
        assert.deepEqual(joinFilter['players.hero'], {$ne: 'ironman'});
        assert.deepEqual(joinFilter.$expr, {
            $lt: [{$size: '$players'}, '$maxPlayers'],
        });
        assert.equal(await store.joinMatchLobby('lobby-1', {
            userId: 'creator',
            name: 'Invitado',
            hero: 'ironman',
            aspect: 'leadership',
        }), null);
        assert.equal(stored.players.length, 2);
        assert.equal(stored.players[1].id, seatId);
    });

    test('removes exactly one waiting seat by its authenticated account and hero', async () => {
        const stored = {
            _id: 'lobby-1',
            name: 'Sala',
            status: 'waiting',
            players: [
                {id: 'creator-seat', userId: 'creator', hero: 'spiderman'},
                {id: 'guest-ironman-seat', userId: 'guest', hero: 'ironman'},
                {id: 'guest-hulk-seat', userId: 'guest', hero: 'hulk'},
            ],
        };
        let removalFilter;
        const collection = {
            updateOne: async (filter, update) => {
                removalFilter = filter;
                assert.deepEqual(update.$pull, {
                    players: {userId: 'guest', hero: 'ironman'},
                });
                assert.equal(typeof update.$set.updatedAt, 'string');
                if (stored.status !== 'waiting' ||
                    !stored.players.some(player =>
                        player.userId === 'guest' && player.hero === 'ironman')) {
                    return {modifiedCount: 0};
                }
                stored.players = stored.players.filter(player =>
                    player.userId !== 'guest' || player.hero !== 'ironman');

                return {modifiedCount: 1};
            },
            findOne: async () => stored,
        };
        const store = new MongoDataStore();
        store.database = {collection: () => collection};

        const updatedLobby = await store.removeMatchLobbyPlayer(
            'lobby-1',
            'guest',
            'ironman',
        );

        assert.deepEqual(removalFilter, {
            _id: 'lobby-1',
            status: 'waiting',
            players: {$elemMatch: {userId: 'guest', hero: 'ironman'}},
        });
        assert.deepEqual(updatedLobby.players.map(player => player.id), [
            'creator-seat',
            'guest-hulk-seat',
        ]);
    });

    test('formats stable legacy seat ids and numbers only accounts with multiple heroes', () => {
        const lobby = {
            id: 'legacy-lobby',
            players: [
                {userId: 'one', name: 'Same Name', hero: 'spiderman'},
                {id: 'persisted-seat', userId: 'two', name: 'Same Name', hero: 'ironman'},
                {userId: 'one', name: 'Same Name', hero: 'hulk'},
            ],
        };
        const players = getLobbyPlayerSeats(lobby);
        assert.deepEqual(players.map(player => player.name), [
            'Same Name (1)', 'Same Name', 'Same Name (2)',
        ]);
        assert.equal(new Set(players.map(player => player.id)).size, 3);
        assert.equal(players[1].id, 'persisted-seat');
        assert.equal(lobby.players[0].name, 'Same Name');
        const remaining = getLobbyPlayerSeats({...lobby, players: lobby.players.slice(1)});
        assert.equal(remaining[1].id, players[2].id);
        assert.equal(remaining[1].name, 'Same Name');
    });

    test('starting is claimed only from waiting and creator-owned state', async () => {
        let stored = {
            _id: 'lobby-1',
            status: 'waiting',
            creatorId: 'creator',
            players: [],
        };
        const collection = {
            updateOne: async (filter, update) => {
                assert.deepEqual(filter, {
                    _id: 'lobby-1',
                    creatorId: 'creator',
                    status: 'waiting',
                    'players.0': {$exists: true},
                });
                if (!stored.players.length) {
                    return {modifiedCount: 0};
                }
                stored = {...stored, ...update.$set};

                return {modifiedCount: 1};
            },
            findOne: async () => stored,
        };
        const store = new MongoDataStore();
        store.database = {collection: () => collection};

        const startingMatch = {
            id: 'lobby-1',
            name: 'Sala',
            configured: false,
        };
        assert.equal(await store.claimMatchLobbyStart(
            'lobby-1', 'creator', startingMatch,
        ), null);
        assert.equal(stored.status, 'waiting');
        stored.players.push({userId: 'guest', hero: 'ironman'});
        const claimed = await store.claimMatchLobbyStart(
            'lobby-1',
            'creator',
            startingMatch,
        );

        assert.equal(claimed.status, 'starting');
        assert.equal(typeof claimed.startingAt, 'string');
        assert.deepEqual(claimed.startingMatch, startingMatch);
    });

    test('configuration remains starting until match initialization completes', async () => {
        let stored = {
            _id: 'lobby-1',
            status: 'starting',
            startingMatch: {
                id: 'lobby-1',
                name: 'Sala',
                configured: false,
            },
        };
        const collection = {
            updateOne: async (filter, update) => {
                assert.deepEqual(filter, {
                    _id: 'lobby-1',
                    status: 'starting',
                });
                if (update.$set['startingMatch.configured']) {
                    stored.startingMatch.configured = true;
                }
                if (update.$set.status) {
                    stored = {...stored, ...update.$set};
                }

                return {modifiedCount: 1};
            },
            findOne: async () => stored,
        };
        const store = new MongoDataStore();
        store.database = {collection: () => collection};

        const ready = await store.markMatchLobbyReady('lobby-1');
        assert.equal(ready.status, 'starting');
        assert.equal(ready.startingMatch.configured, true);

        const started = await store.markMatchLobbyStarted('lobby-1', {
            id: 'lobby-1',
            name: 'Sala',
        });
        assert.equal(started.status, 'started');
        assert.deepEqual(started.startedMatch, {
            id: 'lobby-1',
            name: 'Sala',
        });
    });
});
