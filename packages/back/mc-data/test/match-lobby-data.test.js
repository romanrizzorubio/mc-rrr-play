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
        assert.deepEqual(lobby.players, []);
        assert.deepEqual(inserted.players, []);
        assert.deepEqual(lobby.scenario, {
            id: 'rhino',
            name: 'Rino',
            modularSets: ['bomb-scare'],
        });
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
