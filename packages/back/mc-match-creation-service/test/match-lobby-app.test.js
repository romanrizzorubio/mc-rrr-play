import assert from 'node:assert/strict';
import express from 'express';
import {describe, test} from 'node:test';

import {ENDPOINTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {createMatchCreationApp} from '../src/match-creation-app.js';

const listen = async app => {
    const server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });

    return {
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
            server.closeAllConnections();
        }),
    };
};

const createData = () => {
    let lobbySequence = 0;
    const lobbies = new Map();

    return {
        lobbies,
        async getHeroesList() {
            return [
                {id: 'spiderman', name: 'Spider-Man', folder: 'spiderman'},
                {id: 'ironman', name: 'Iron Man', folder: 'ironman'},
                {id: 'hulk', name: 'Hulk', folder: 'hulk'},
            ];
        },
        async getModularSetsList() {
            return [{id: 'bomb-scare', name: 'Bomb Scare'}];
        },
        async getHeroConfig(id) {
            if (!['spiderman', 'ironman', 'hulk'].includes(id)) {
                throw new Error('Hero not found');
            }

            return {aspect: 'aggression'};
        },
        async getDeckConfig(id, heroId) {
            if (!id.startsWith('deck-')) {
                throw new Error('Deck not found');
            }

            return {aspect: heroId === 'ironman' ? 'leadership' : 'justice'};
        },
        async getScenariosList() {
            return [{
                folder: 'rhino',
                name: 'Rino',
                defaultModularSets: [],
            }];
        },
        async getScenarioConfig(id) {
            assert.equal(id, 'rhino');

            return {name: 'rhino', sets: [], defaultSets: []};
        },
        async getSetConfig(id) {
            if (id !== 'bomb-scare') {
                throw new Error('Set not found');
            }

            return {name: 'Bomb Scare', standard: false};
        },
        async createMatchLobby(params) {
            const lobby = {
                id: `lobby-${++lobbySequence}`,
                ...params,
                status: 'waiting',
                difficulty: params.expert ? 'Experto' : 'Normal',
                players: [],
            };
            lobbies.set(lobby.id, lobby);

            return lobby;
        },
        async getMatchLobby(id) {
            return lobbies.get(id) || null;
        },
        async getWaitingMatchLobbies() {
            return [...lobbies.values()].filter(lobby =>
                lobby.status === 'waiting');
        },
        async joinMatchLobby(id, player) {
            const lobby = lobbies.get(id);
            if (!lobby || lobby.status !== 'waiting' ||
                lobby.players.length >= lobby.maxPlayers ||
                lobby.players.some(existing => existing.hero === player.hero)) {
                return null;
            }
            lobby.players.push(player);

            return lobby;
        },
        async leaveMatchLobby(id, userId) {
            const lobby = lobbies.get(id);
            if (!lobby || lobby.status !== 'waiting' || lobby.creatorId === userId) {
                return null;
            }
            lobby.players = lobby.players.filter(player => player.userId !== userId);

            return lobby;
        },
        async removeMatchLobbyPlayer(id, userId, hero) {
            const lobby = lobbies.get(id);
            if (!lobby || lobby.status !== 'waiting' ||
                !lobby.players.some(player =>
                    player.userId === userId && player.hero === hero)) {
                return null;
            }
            lobby.players = lobby.players.filter(player =>
                player.userId !== userId || player.hero !== hero);

            return lobby;
        },
        async claimMatchLobbyStart(id, creatorId, startingMatch) {
            const lobby = lobbies.get(id);
            if (!lobby || lobby.creatorId !== creatorId || lobby.status !== 'waiting') {
                return null;
            }
            if (!lobby.players.length) {
                return null;
            }
            lobby.status = 'starting';
            lobby.startingMatch = startingMatch;

            return lobby;
        },
        async markMatchLobbyReady(id) {
            const lobby = lobbies.get(id);
            if (!lobby || lobby.status !== 'starting') {
                return null;
            }
            lobby.startingMatch.configured = true;

            return lobby;
        },
        async markMatchLobbyStarted(id, startedMatch) {
            const lobby = lobbies.get(id);
            if (!lobby || lobby.status !== 'starting') {
                return null;
            }
            lobby.status = 'started';
            lobby.startedMatch = startedMatch;

            return lobby;
        },
        async deleteMatchLobby(id, creatorId) {
            const lobby = lobbies.get(id);
            if (!lobby || lobby.creatorId !== creatorId ||
                lobby.status !== 'waiting') {
                return false;
            }
            lobbies.delete(id);

            return true;
        },
    };
};

const createTestServices = async data => {
    const auth = express();
    auth.get('/me', (req, res) => {
        const cookie = req.headers.cookie;
        const users = {
            'session=creator': {
                id: 'user-creator',
                email: 'creator@example.test',
                name: 'Creator Name',
            },
            'session=guest': {
                id: 'user-guest',
                email: 'guest@example.test',
                name: 'Guest Name',
            },
            'session=third': {
                id: 'user-third',
                email: 'third@example.test',
                name: 'Third Name',
            },
        };
        const user = users[cookie];
        if (!user) {
            res.status(401).json({error: 'Unauthorized'});
            return;
        }
        res.json({user});
    });
    const authService = await listen(auth);

    const upstream = express();
    upstream.use(express.json());
    const forwarded = [];
    const matches = new Map();
    upstream.post(INTERNAL_ENDPOINTS.MATCH.CREATE, (req, res) => {
        forwarded.push({
            endpoint: INTERNAL_ENDPOINTS.MATCH.CREATE,
            cookie: req.headers.cookie,
            match: req.headers.match,
            body: req.body,
        });
        const match = matches.get(req.body.name) || {
            id: req.body.lobbyId,
            name: req.body.name,
            players: [],
            scenario: null,
        };
        matches.set(match.name, match);
        res.status(201).json(match);
    });
    upstream.post(INTERNAL_ENDPOINTS.PLAYER.CREATE, (req, res) => {
        forwarded.push({
            endpoint: INTERNAL_ENDPOINTS.PLAYER.CREATE,
            cookie: req.headers.cookie,
            match: req.headers.match,
            body: req.body,
        });
        matches.get(req.headers.match)?.players.push({});
        res.json({ok: true});
    });
    upstream.post(INTERNAL_ENDPOINTS.SCENARIO.CREATE, (req, res) => {
        forwarded.push({
            endpoint: INTERNAL_ENDPOINTS.SCENARIO.CREATE,
            cookie: req.headers.cookie,
            match: req.headers.match,
            body: req.body,
        });
        const match = matches.get(req.headers.match);
        if (match) {
            match.scenario = {id: 'rhino'};
        }
        res.json({ok: true});
    });
    upstream.post(INTERNAL_ENDPOINTS.MATCH.INIT, (req, res) => {
        forwarded.push({
            endpoint: INTERNAL_ENDPOINTS.MATCH.INIT,
            cookie: req.headers.cookie,
            match: req.headers.match,
            body: req.body,
        });
        res.json({
            id: 'match-1',
            name: 'Test Room',
            initialized: true,
            players: [{userId: 'user-creator'}, {userId: 'user-guest'}],
        });
    });
    upstream.delete(INTERNAL_ENDPOINTS.MATCH.DELETE, (req, res) => {
        forwarded.push({
            endpoint: INTERNAL_ENDPOINTS.MATCH.DELETE,
            cookie: req.headers.cookie,
            match: req.headers.match,
            body: req.body,
        });
        res.json({name: req.body.name});
    });
    const matchService = await listen(upstream);

    const service = await listen(createMatchCreationApp({
        data,
        authServiceUrl: authService.url,
        matchServiceUrl: matchService.url,
    }));

    return {
        authService,
        data,
        forwarded,
        matches,
        matchService,
        service,
        close: async () => {
            await service.close();
            await matchService.close();
            await authService.close();
        },
    };
};

describe('match-lobby REST API', () => {
    test('empty lobbies cannot start and an organizer can start a guest-only room', async () => {
        const context = await createTestServices(createData());
        const post = (endpoint, body, cookie = 'session=creator') => fetch(
            `${context.service.url}${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Cookie: cookie},
                body: JSON.stringify(body),
            });
        try {
            const created = await post(ENDPOINTS.MATCH.LOBBIES, {
                name: 'Invitados', maxPlayers: 1, expert: true,
                scenario: {scenario: 'rhino', modularSets: ['bomb-scare']},
            });
            assert.equal(created.status, 201);
            const lobby = await created.json();
            assert.deepEqual(lobby.players, []);
            assert.equal(lobby.ownerId, 'user-creator');
            const start = ENDPOINTS.MATCH_LOBBY.START.replace(':id', lobby.id);
            assert.equal((await post(start, {})).status, 409);
            assert.equal(context.forwarded.length, 0);
            assert.equal(context.data.lobbies.get(lobby.id).status, 'waiting');
            const joined = await post(
                ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', lobby.id),
                {hero: 'ironman', deckId: 'deck-iron'}, 'session=guest');
            assert.equal(joined.status, 200);
            assert.equal((await post(start, {}, 'session=guest')).status, 403);
            const started = await post(start, {});
            assert.equal(started.status, 200);
            const response = await started.json();
            assert.equal(response.lobby.players.length, 1);
            assert.equal(response.lobby.players[0].userId, 'user-guest');
            assert.equal(response.expert, true);
            assert.equal(context.matches.get('Invitados').players.length, 1);
            assert.equal(context.forwarded[1].body.initial, true);
            assert.equal(context.forwarded.every(call => call.cookie === 'session=creator'), true);
        } finally {
            await context.close();
        }
    });
    test('one account can add distinct heroes up to total capacity and start all seats', async () => {
        const context = await createTestServices(createData());
        const post = async (endpoint, body, cookie = 'session=creator') => fetch(
            `${context.service.url}${endpoint}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Cookie: cookie},
                body: JSON.stringify(body),
            });
        try {
            const created = await post(ENDPOINTS.MATCH.LOBBIES, {
                name: 'Solo Team', maxPlayers: 3,
                player: {hero: 'spiderman'}, scenario: {scenario: 'rhino'},
            });
            const emptyLobby = await created.json();
            assert.deepEqual(emptyLobby.players, []);
            const join = ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', emptyLobby.id);
            const first = await post(join, {hero: 'spiderman'});
            assert.equal(first.status, 200);
            const lobby = await first.json();
            assert.equal((await post(join, {hero: 'spiderman'})).status, 409);
            const added = await post(join, {
                hero: 'ironman', userId: 'forged', name: 'Spoofed', id: 'forged-seat',
            });
            assert.equal(added.status, 200);
            const two = await added.json();
            assert.deepEqual(two.players.map(player => [player.userId, player.name]), [
                ['user-creator', 'Creator Name (1)'],
                ['user-creator', 'Creator Name (2)'],
            ]);
            assert.equal(two.players[0].id, lobby.players[0].id);
            assert.notEqual(two.players[0].id, two.players[1].id);
            assert.notEqual(two.players[1].id, 'forged-seat');
            const guest = await post(join, {hero: 'hulk'}, 'session=guest');
            assert.equal(guest.status, 200);
            const full = await guest.json();
            assert.equal(full.players[2].name, 'Guest Name');
            assert.equal(full.players.length, 3);
            assert.equal((await post(join, {hero: 'hulk'})).status, 409);
            const started = await post(
                ENDPOINTS.MATCH_LOBBY.START.replace(':id', lobby.id), {});
            assert.equal(started.status, 200);
            const response = await started.json();
            assert.deepEqual(response.lobby.players, full.players);
            assert.equal(context.matches.get('Solo Team').players.length, 3);
            const retried = await post(
                ENDPOINTS.MATCH_LOBBY.START.replace(':id', lobby.id), {});
            assert.deepEqual(await retried.json(), response);
            assert.equal(context.matches.get('Solo Team').players.length, 3);
        } finally {
            await context.close();
        }
    });

    test('leaving removes every guest-owned seat without renumbering or changing other seat ids', async () => {
        const data = createData();
        data.lobbies.set('existing', {
            id: 'existing', name: 'Room', status: 'waiting',
            maxPlayers: 4, creatorId: 'user-creator', expert: false,
            scenario: {name: 'Rino', modularSets: []},
            players: [
                {userId: 'user-creator', name: 'Creator Name', hero: 'spiderman'},
                {userId: 'user-guest', name: 'Guest Name', hero: 'ironman'},
                {userId: 'user-guest', name: 'Guest Name', hero: 'hulk'},
            ],
        });
        const context = await createTestServices(data);
        try {
            const detail = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.GET.replace(':id', 'existing')}`,
                {headers: {Cookie: 'session=guest'}});
            const before = await detail.json();
            assert.deepEqual(before.players.map(player => player.name),
                ['Creator Name', 'Guest Name (1)', 'Guest Name (2)']);
            const left = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.LEAVE.replace(':id', 'existing')}`, {
                    method: 'POST', headers: {Cookie: 'session=guest'},
                });
            assert.equal(left.status, 200);
            const after = await left.json();
            assert.deepEqual(after.players, [before.players[0]]);
        } finally {
            await context.close();
        }
    });

    test('removing a lobby player requires its owner or the creator and removes only that seat', async () => {
        const data = createData();
        data.lobbies.set('existing', {
            id: 'existing', name: 'Room', status: 'waiting',
            maxPlayers: 4, creatorId: 'user-creator', expert: false,
            scenario: {name: 'Rino', modularSets: []},
            players: [
                {id: 'creator-seat', userId: 'user-creator', name: 'Creator', hero: 'spiderman'},
                {id: 'guest-ironman-seat', userId: 'user-guest', name: 'Guest', hero: 'ironman'},
                {id: 'guest-hulk-seat', userId: 'user-guest', name: 'Guest', hero: 'hulk'},
            ],
        });
        const context = await createTestServices(data);
        const removeUrl = playerId =>
            `${context.service.url}${ENDPOINTS.MATCH_LOBBY.REMOVE_PLAYER
                .replace(':id', 'existing')
                .replace(':playerId', playerId)}`;

        try {
            const unauthenticated = await fetch(removeUrl('guest-ironman-seat'), {
                method: 'DELETE',
            });
            assert.equal(unauthenticated.status, 401);

            const guestRemovedOwnSeat = await fetch(removeUrl('guest-ironman-seat'), {
                method: 'DELETE',
                headers: {Cookie: 'session=guest'},
            });
            assert.equal(guestRemovedOwnSeat.status, 200);
            const afterGuestRemoval = await guestRemovedOwnSeat.json();
            assert.deepEqual(afterGuestRemoval.players.map(player => player.id), [
                'creator-seat',
                'guest-hulk-seat',
            ]);

            const guestCannotRemoveAnotherAccount = await fetch(removeUrl('creator-seat'), {
                method: 'DELETE',
                headers: {Cookie: 'session=guest'},
            });
            assert.equal(guestCannotRemoveAnotherAccount.status, 403);

            const creatorRemovedGuestSeat = await fetch(removeUrl('guest-hulk-seat'), {
                method: 'DELETE',
                headers: {Cookie: 'session=creator'},
            });
            assert.equal(creatorRemovedGuestSeat.status, 200);
            const afterCreatorRemoval = await creatorRemovedGuestSeat.json();
            assert.deepEqual(afterCreatorRemoval.players.map(player => player.id), [
                'creator-seat',
            ]);

            const missingSeat = await fetch(removeUrl('missing-seat'), {
                method: 'DELETE',
                headers: {Cookie: 'session=creator'},
            });
            assert.equal(missingSeat.status, 404);

            data.lobbies.get('existing').status = 'started';
            const startedLobby = await fetch(removeUrl('creator-seat'), {
                method: 'DELETE',
                headers: {Cookie: 'session=creator'},
            });
            assert.equal(startedLobby.status, 409);
        } finally {
            await context.close();
        }
    });

    test('legacy creation proxy forwards the session Cookie', async () => {
        const context = await createTestServices(createData());

        try {
            const response = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH.CREATE}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=creator',
                    },
                    body: JSON.stringify({name: 'Proxy Match'}),
                },
            );

            assert.equal(response.status, 201);
            assert.equal(context.forwarded[0].cookie, 'session=creator');
            assert.equal(context.forwarded[0].match, '');
        } finally {
            await context.close();
        }
    });

    test('creates and joins rooms using authenticated account identities', async () => {
        const context = await createTestServices(createData());

        try {
            const unauthenticated = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH.LOBBIES}`,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({}),
                },
            );
            assert.equal(unauthenticated.status, 401);

            const response = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH.LOBBIES}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=creator',
                    },
                    body: JSON.stringify({
                        name: 'Test Room',
                        maxPlayers: 2,
                        player: {
                            userId: 'attacker-chosen-id',
                            name: 'Attacker Chosen Name',
                            hero: 'spiderman',
                            deckId: 'deck-spider',
                        },
                        scenario: {
                            scenario: 'rhino',
                            modularSets: ['bomb-scare'],
                        },
                        expert: false,
                    }),
                },
            );
            assert.equal(response.status, 201);
            const emptyLobby = await response.json();
            assert.deepEqual(emptyLobby.players, []);
            assert.equal(emptyLobby.ownerId, 'user-creator');
            const creatorJoined = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', emptyLobby.id)}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', Cookie: 'session=creator'},
                    body: JSON.stringify({
                        hero: 'spiderman', deckId: 'deck-spider',
                        userId: 'attacker-chosen-id', name: 'Attacker Chosen Name',
                    }),
                });
            assert.equal(creatorJoined.status, 200);
            const lobby = await creatorJoined.json();

            assert.deepEqual(lobby, {
                id: lobby.id,
                name: 'Test Room',
                status: 'waiting',
                maxPlayers: 2,
                ownerId: 'user-creator',
                players: [{
                    id: `${lobby.id}:seat:user-creator:spiderman`,
                    userId: 'user-creator',
                    name: 'Creator Name',
                    hero: 'spiderman',
                    heroName: 'Spider-Man',
                    aspect: 'justice',
                    deckId: 'deck-spider',
                }],
                scenarioName: 'Rino',
                expert: false,
                autoSave: true,
                modularSetNames: ['Bomb Scare'],
                matchId: null,
            });
            assert.equal(Object.hasOwn(lobby.players[0], 'email'), false);
            const listedLobbies = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH.LOBBIES}`,
            );
            assert.deepEqual(await listedLobbies.json(), [lobby]);

            const duplicateHero = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=guest',
                    },
                    body: JSON.stringify({hero: 'spiderman'}),
                },
            );
            assert.equal(duplicateHero.status, 409);

            const joined = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=guest',
                    },
                    body: JSON.stringify({
                        userId: 'forged-user-id',
                        hero: 'ironman',
                        deckId: 'deck-iron',
                    }),
                },
            );
            assert.equal(joined.status, 200);
            const updated = await joined.json();
            assert.deepEqual(updated.players, [
                {
                    id: `${lobby.id}:seat:user-creator:spiderman`,
                    userId: 'user-creator',
                    name: 'Creator Name',
                    hero: 'spiderman',
                    heroName: 'Spider-Man',
                    aspect: 'justice',
                    deckId: 'deck-spider',
                },
                {
                    id: `${lobby.id}:seat:user-guest:ironman`,
                    userId: 'user-guest',
                    name: 'Guest Name',
                    hero: 'ironman',
                    heroName: 'Iron Man',
                    aspect: 'leadership',
                    deckId: 'deck-iron',
                },
            ]);
            const fullLobbyList = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH.LOBBIES}`,
            );
            assert.deepEqual(await fullLobbyList.json(), [updated]);

            const fullRoomJoin = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=third',
                    },
                    body: JSON.stringify({hero: 'hulk'}),
                },
            );
            assert.equal(fullRoomJoin.status, 409);
            const roomDetails = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.GET.replace(':id', lobby.id)}`,
                {headers: {Cookie: 'session=guest'}},
            );
            assert.equal(roomDetails.status, 200);
            assert.deepEqual(await roomDetails.json(), updated);
        } finally {
            await context.close();
        }
    });

    test('starts the saved lobby through internal match creation routes and forwards Cookie', async () => {
        const data = createData();
        const context = await createTestServices(data);

        try {
            const created = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH.LOBBIES}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=creator',
                    },
                    body: JSON.stringify({
                        name: 'Test Room',
                        maxPlayers: 2,
                        player: {hero: 'spiderman', deckId: 'deck-spider'},
                        scenario: {scenario: 'rhino', modularSets: []},
                        expert: true,
                        autoSave: false,
                    }),
                },
            );
            const lobby = await created.json();
            await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', lobby.id)}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', Cookie: 'session=creator'},
                    body: JSON.stringify({hero: 'spiderman', deckId: 'deck-spider'}),
                });
            const joined = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=guest',
                    },
                    body: JSON.stringify({hero: 'ironman', deckId: 'deck-iron'}),
                },
            );
            const joinedLobby = await joined.json();

            const started = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.START.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {Cookie: 'session=creator'},
                },
            );
            const startedBody = await started.text();
            assert.equal(
                started.status,
                200,
                `${startedBody}; forwarded=${JSON.stringify(context.forwarded)}`,
            );
            const result = JSON.parse(startedBody);

            assert.deepEqual(result, {
                lobby: {
                    ...joinedLobby,
                    status: 'starting',
                    matchId: lobby.id,
                },
                matchId: lobby.id,
                matchName: 'Test Room',
                expert: true,
                autoSave: false,
            });
            assert.deepEqual(context.forwarded.map(({endpoint}) => endpoint), [
                INTERNAL_ENDPOINTS.MATCH.CREATE,
                INTERNAL_ENDPOINTS.PLAYER.CREATE,
                INTERNAL_ENDPOINTS.PLAYER.CREATE,
                INTERNAL_ENDPOINTS.SCENARIO.CREATE,
            ]);
            assert.ok(context.forwarded.every(({cookie}) =>
                cookie === 'session=creator'));
            assert.ok(context.forwarded.slice(1).every(({match}) =>
                match === 'Test Room'));
            assert.deepEqual(
                context.forwarded
                    .filter(({endpoint}) => endpoint === INTERNAL_ENDPOINTS.PLAYER.CREATE)
                    .map(({body}) => body),
                [{initial: true}, {initial: false}],
            );
            assert.equal(context.forwarded.some(({endpoint}) =>
                endpoint === INTERNAL_ENDPOINTS.MATCH.INIT), false);
            const previousCallCount = context.forwarded.length;
            const retried = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.START.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {Cookie: 'session=creator'},
                },
            );
            assert.equal(retried.status, 200);
            assert.deepEqual(await retried.json(), result);
            assert.equal(context.forwarded.length, previousCallCount + 1);
            assert.equal(
                context.forwarded.at(-1).endpoint,
                INTERNAL_ENDPOINTS.MATCH.CREATE,
            );

            context.matches.delete(lobby.name);
            const recovered = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.START.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {Cookie: 'session=creator'},
                },
            );
            assert.equal(recovered.status, 200);
            assert.deepEqual(await recovered.json(), result);
            assert.deepEqual(
                context.forwarded.slice(previousCallCount + 1).map(({endpoint}) =>
                    endpoint),
                [
                    INTERNAL_ENDPOINTS.MATCH.CREATE,
                    INTERNAL_ENDPOINTS.PLAYER.CREATE,
                    INTERNAL_ENDPOINTS.PLAYER.CREATE,
                    INTERNAL_ENDPOINTS.SCENARIO.CREATE,
                ],
            );
            assert.equal(context.matches.get(lobby.name).players.length, 2);
            assert.deepEqual(context.matches.get(lobby.name).scenario, {id: 'rhino'});
        } finally {
            await context.close();
        }
    });

    test('only the creator may delete a waiting room; non-creators can leave', async () => {
        const context = await createTestServices(createData());

        try {
            const created = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH.LOBBIES}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=creator',
                    },
                    body: JSON.stringify({
                        name: 'Waiting Room',
                        maxPlayers: 3,
                        player: {hero: 'spiderman'},
                        scenario: {scenario: 'rhino', modularSets: []},
                    }),
                },
            );
            const lobby = await created.json();
            await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.JOIN.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'session=guest',
                    },
                    body: JSON.stringify({hero: 'ironman'}),
                },
            );

            const creatorLeave = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.LEAVE.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {Cookie: 'session=creator'},
                },
            );
            assert.equal(creatorLeave.status, 403);
            const guestLeave = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.LEAVE.replace(':id', lobby.id)}`,
                {
                    method: 'POST',
                    headers: {Cookie: 'session=guest'},
                },
            );
            assert.equal(guestLeave.status, 200);
            const unauthorizedDelete = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.DELETE.replace(':id', lobby.id)}`,
                {
                    method: 'DELETE',
                    headers: {Cookie: 'session=guest'},
                },
            );
            assert.equal(unauthorizedDelete.status, 403);
            const deleteResponse = await fetch(
                `${context.service.url}${ENDPOINTS.MATCH_LOBBY.DELETE.replace(':id', lobby.id)}`,
                {
                    method: 'DELETE',
                    headers: {Cookie: 'session=creator'},
                },
            );
            assert.equal(deleteResponse.status, 200);
            assert.equal(context.data.lobbies.has(lobby.id), false);
        } finally {
            await context.close();
        }
    });
});
