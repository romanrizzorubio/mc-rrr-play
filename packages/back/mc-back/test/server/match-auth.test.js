import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {ENDPOINTS, EVENTS} from 'mc-endpoints';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';
import {PlayerRest} from '../../src/server/rest/player-rest.js';
import {DialogSocket} from '../../src/server/socket/dialog-socket.js';
import {McSocket} from '../../src/server/socket/mc-socket.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';
import {restoreSnapshotTypes} from '../../src/utils/match-snapshot-types.js';
import {MatchRest} from '../../src/server/rest/match-rest.js';
import spiderman from '../../../mc-data/seed/catalog/heroes/spiderman.js';
import ironman from '../../../mc-data/seed/catalog/heroes/ironman.js';
import riskyBusiness from '../../../mc-data/seed/catalog/scenarios/risky-business.js';

const withAuthFetch = async (callback, responseUser = {
    id: 'account-1',
    email: 'private@example.test',
    name: 'Account Name',
}) => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async (_url, options) => {
        assert.equal(options.headers.cookie, 'session=verified');

        return {
            ok: true,
            status: 200,
            json: async () => ({user: responseUser}),
        };
    };
    try {
        return await callback();
    } finally {
        globalThis.fetch = previousFetch;
    }
};
const authIdentity = player => ({
    id: player.userId,
    name: player.name,
});

describe('authenticated match actions', () => {
    test('each owned seat has exact action, request and refreshed-state authorization', async () => {
        const first = {id: 'seat-1', userId: 'account-1', name: 'Name (1)'};
        const second = {id: 'seat-2', userId: 'account-1', name: 'Name (2)'};
        const foreign = {id: 'seat-3', userId: 'account-2', name: 'Guest'};
        const refreshed = [first, second, foreign].map(player => ({...player}));
        const match = Object.assign(new Match({name: 'seats'}), {
            players: [first, second, foreign],
            currentTurnPlayer: first,
            initialized: true,
            phase: 'players',
            refresh: async () => ({players: refreshed}),
        });
        const rest = new PlayerRest({});
        const params = {match, cookie: 'session=verified'};
        await withAuthFetch(async () => {
            assert.equal(await rest.getAuthenticatedPlayer({...params, player: first.id}), first);
            for (const player of [undefined, first.userId, second.id, foreign.id]) {
                await assert.rejects(rest.getAuthenticatedPlayer({...params, player}),
                    error => error.statusCode === 403);
            }
            assert.equal(await rest.refreshPlayer(match, second), refreshed[1]);
            await rest.requestAction({...params, player: first.id, targetPlayer: second.id});
            assert.equal(match.actionRequest.targetId, second.id);
            assert.equal(match.actionRequest.requesterId, first.id);
            await assert.rejects(
                rest.respondAction({...params, player: first.id, accept: true}),
                error => error.statusCode === 403);
            await rest.respondAction({...params, player: second.id, accept: true});
            assert.equal(await rest.getAuthenticatedPlayer({...params, player: second.id}), second);
            await assert.rejects(
                rest.getAuthenticatedPlayer({...params, player: first.id}),
                error => error.statusCode === 403);
            await assert.rejects(rest.completeAction({...params, player: first.id}),
                error => error.statusCode === 403);
            await rest.completeAction({...params, player: second.id});
            assert.equal(match.actionRequest, null);
        });
    });

    test('lobby-created seats keep ids, numbered names and independent heroes through snapshots and reset', async () => {
        const lobby = {
            id: 'multi-seat-lobby',
            status: 'starting',
            creatorId: 'account-1',
            players: [
                {id: 'seat-spider', userId: 'account-1', name: 'Name', hero: 'spiderman'},
                {id: 'seat-iron', userId: 'account-1', name: 'Name', hero: 'ironman'},
            ],
        };
        const data = {
            getMatchLobby: async () => lobby,
            getHeroConfig: async hero => structuredClone(
                hero === 'spiderman' ? spiderman.config : ironman.config),
            getSetConfig: async name => ({name, cards: []}),
        };
        const mc = {data};
        const match = new Match({
            mc, name: 'multi-seat-match', lobbyId: lobby.id, creatorUserId: 'account-1',
        });
        const rest = new PlayerRest({mc});
        await withAuthFetch(async () => {
            await rest.createPlayer({match, cookie: 'session=verified', id: 'spoofed'});
            await rest.createPlayer({match, cookie: 'session=verified', id: 'spoofed'});
            await assert.rejects(rest.createPlayer({match, cookie: 'session=verified'}),
                error => error.statusCode === 409);
        });
        assert.deepEqual(match.players.map(player => [player.id, player.userId, player.name]), [
            ['seat-spider', 'account-1', 'Name (1)'],
            ['seat-iron', 'account-1', 'Name (2)'],
        ]);
        assert.notEqual(match.players[0].superhero, match.players[1].superhero);
        assert.notEqual(match.players[0].hand, match.players[1].hand);
        assert.equal(match.getPlayer('account-1'), undefined);
        match.currentTurnPlayer = match.players[1];
        const restored = restoreMatch(serializeMatch(match), mc);
        assert.equal(restored.currentTurnPlayer, restored.players[1]);
        assert.deepEqual(restored.players.map(player => player.id), ['seat-spider', 'seat-iron']);
        assert.deepEqual(restored.creationConfig.players.map(player => player.id),
            ['seat-spider', 'seat-iron']);
        const reset = await new MatchRest({mc}).createMatchFromCreationConfig(restored, {
            ...restored.creationConfig,
            scenario: structuredClone(riskyBusiness.config),
        });
        assert.deepEqual(reset.players.map(player => [player.id, player.name]), [
            ['seat-spider', 'Name (1)'], ['seat-iron', 'Name (2)'],
        ]);
        const restarted = restoreMatch(serializeMatch(reset), mc);
        assert.deepEqual(restarted.players.map(player => player.id), ['seat-spider', 'seat-iron']);
        let initialDialog;
        match.openDialog = async params => {
            initialDialog = params;
            return {selected: {playerId: 'seat-iron'}};
        };
        assert.equal(await match.selectInitialPlayer(), match.players[1]);
        assert.equal(initialDialog.targetPlayer, match.players[0]);
    });

    test('end-turn requires the exact active owned seat while legacy single seats still work', () => {
        const first = {id: 'seat-1', userId: 'account-1'};
        const second = {id: 'seat-2', userId: 'account-1'};
        const other = {id: 'seat-3', userId: 'account-2'};
        const match = {name: 'game', players: [first, second, other], currentTurnPlayer: second};
        const mcSocket = new McSocket({getMatch: () => match});
        let dispatched = 0;
        mcSocket.dispatch = () => {
            dispatched++;
            return true;
        };
        const socket = {
            data: {user: {id: 'account-1'}},
            rooms: new Set(['mc-match:game']),
        };
        for (const player of [undefined, 'account-1', first.id, other.id, second.id]) {
            let acknowledgement;
            mcSocket.handleClientEvent(socket, EVENTS.TURN.END, {match: 'game', player},
                response => { acknowledgement = response; });
            assert.equal(acknowledgement.ok, player === second.id);
        }
        assert.equal(dispatched, 1);
        match.players = [second];
        let acknowledgement;
        mcSocket.handleClientEvent(socket, EVENTS.TURN.END, {match: 'game'},
            response => { acknowledgement = response; });
        assert.equal(acknowledgement.ok, true);
    });

    test('only the current player can request an action and the target controls the request', async () => {
        const requester = {name: 'Jugador', userId: 'account-1'};
        const target = {name: 'Jugador', userId: 'account-2'};
        const match = {
            initialized: true,
            phase: 'players',
            playing: true,
            currentTurnPlayer: requester,
            players: [requester, target],
            actionRequest: null,
            async refresh() {
                return {
                    ...(this.actionRequest ? {
                        actionRequest: {
                            requester: this.actionRequest.requester,
                            requesterId: this.actionRequest.requesterUserId,
                            target: this.actionRequest.target,
                            targetId: this.actionRequest.targetUserId,
                            status: this.actionRequest.status,
                        },
                    } : {}),
                };
            },
        };
        const rest = new PlayerRest({});

        assert.equal(ENDPOINTS.MATCH.REQUEST_ACTION, '/request-action');
        assert.equal(ENDPOINTS.MATCH.RESPOND_ACTION, '/respond-action');
        assert.equal(ENDPOINTS.MATCH.COMPLETE_ACTION, '/complete-action');

        await withAuthFetch(async () => {
            const result = await rest.requestAction({
                match,
                cookie: 'session=verified',
                player: requester.userId,
                targetPlayer: target.userId,
                userId: target.userId,
            });

            assert.deepEqual(result.actionRequest, {
                requester: 'Jugador',
                requesterId: 'account-1',
                target: 'Jugador',
                targetId: 'account-2',
                status: 'pending',
            });
            assert.deepEqual(match.actionRequest, {
                requester: 'Jugador',
                requesterId: 'account-1',
                requesterUserId: 'account-1',
                target: 'Jugador',
                targetId: 'account-2',
                targetUserId: 'account-2',
                status: 'pending',
            });
            await assert.rejects(
                rest.getAuthenticatedPlayer({
                    match,
                    cookie: 'session=verified',
                    player: requester.userId,
                }),
                error => error.statusCode === 409,
            );
        });

        await withAuthFetch(async () => {
            await assert.rejects(
                rest.respondAction({
                    match,
                    cookie: 'session=verified',
                    player: target.userId,
                    accept: true,
                }),
                error => error.statusCode === 403,
            );
        }, authIdentity(requester));

        await withAuthFetch(async () => {
            await rest.respondAction({
                match,
                cookie: 'session=verified',
                player: target.userId,
                accept: true,
            });
            await assert.rejects(
                rest.getAuthenticatedPlayer({
                    match,
                    cookie: 'session=verified',
                    player: requester.userId,
                }),
                error => error.statusCode === 403,
            );
            assert.equal(
                (await rest.getAuthenticatedPlayer({
                    match,
                    cookie: 'session=verified',
                    player: target.userId,
                })).userId,
                target.userId,
            );
            await rest.completeAction({
                match,
                cookie: 'session=verified',
                player: target.userId,
            });
            assert.equal(match.actionRequest, null);
        }, authIdentity(target));

        await withAuthFetch(async () => {
            await rest.requestAction({
                match,
                cookie: 'session=verified',
                player: requester.userId,
                targetPlayer: target.userId,
            });
        });
        await withAuthFetch(async () => {
            await rest.respondAction({
                match,
                cookie: 'session=verified',
                player: target.userId,
                accept: false,
            });
            assert.equal(match.actionRequest, null);
        }, authIdentity(target));
        await withAuthFetch(async () => {
            await assert.rejects(
                rest.getAuthenticatedPlayer({
                    match,
                    cookie: 'session=verified',
                    player: target.userId,
                }),
                error => error.statusCode === 403,
            );
        }, authIdentity(target));
    });

    test('REST actions resolve the acting player from /me, not JSON identity fields', async () => {
        let playedBy;
        const ownedPlayer = {
            name: 'Account Name',
            userId: 'account-1',
            playCard: async () => {
                playedBy = ownedPlayer.userId;
            },
        };
        const otherPlayer = {
            name: 'Other Player',
            userId: 'account-2',
            playCard: async () => {
                playedBy = otherPlayer.userId;
            },
        };
        const match = {
            players: [ownedPlayer, otherPlayer],
            getPlayer: name => match.players.find(player => player.name === name),
            refresh: async () => ({
                players: [
                    {name: ownedPlayer.name, userId: ownedPlayer.userId},
                    {name: otherPlayer.name, userId: otherPlayer.userId},
                ],
            }),
        };
        const rest = new PlayerRest({});

        await withAuthFetch(async () => {
            const result = await rest.playCard({
                match,
                cookie: 'session=verified',
                player: ownedPlayer.name,
                userId: 'account-2',
                cardId: 'card-1',
            });
            assert.deepEqual(result, {
                name: ownedPlayer.name,
                userId: ownedPlayer.userId,
            });
            assert.equal(playedBy, 'account-1');
            await assert.rejects(rest.playCard({
                match,
                cookie: 'session=verified',
                player: otherPlayer.name,
                userId: 'account-2',
                cardId: 'card-2',
            }), error => error.statusCode === 403);
        });
    });

    test('Player serialization includes account id but no email', () => {
        const player = Object.create(Player.prototype);
        Object.assign(player, {
            id: 'player-1',
            name: 'Account Name',
            userId: 'account-1',
            defeated: false,
            scenarioZone: undefined,
            deck: undefined,
            extraDecks: {},
            hand: {toObj: () => []},
            superhero: {
                currentSide: {handSize: 5},
                toObj: () => ({name: 'Hero'}),
            },
            gameZone: undefined,
        });

        assert.deepEqual(player.toObj(), {
            id: 'player-1',
            isPlayer: true,
            name: 'Account Name',
            userId: 'account-1',
            defeated: false,
            scenarioZoneId: undefined,
            handSize: 5,
            deck: undefined,
            extraDecks: {},
            hand: [],
            superhero: {name: 'Hero'},
            gameZone: undefined,
        });
        assert.equal(Object.hasOwn(player.toObj(), 'email'), false);
    });

    test('match snapshots preserve the authenticated player account id', () => {
        const match = new Match({name: 'authenticated-snapshot'});
        match.createPlayer({
            name: 'Account Name',
            userId: 'account-1',
            superhero: {},
        });

        const snapshot = serializeMatch(match);
        const playerNode = snapshot.nodes.find(({type}) => type === 'Player');
        const userId = playerNode.properties.find(([name]) => name === 'userId')?.[1];

        assert.equal(userId, 'account-1');

        match.players = [];
        match.actionRequest = {
            requester: 'Account Name',
            requesterUserId: 'account-1',
            target: 'Other Player',
            targetUserId: 'account-2',
            status: 'pending',
        };
        assert.deepEqual(match.toObj().actionRequest, {
            requester: 'Account Name',
            requesterId: 'account-1',
            target: 'Other Player',
            targetId: 'account-2',
            status: 'pending',
        });
    });

    test('same display names remain distinct by account id', () => {
        const players = [
            new Player({
                name: 'Jugador',
                userId: 'account-1',
                superhero: {toObj: () => ({})},
            }),
            new Player({
                name: 'Jugador',
                userId: 'account-2',
                superhero: {toObj: () => ({})},
            }),
        ];
        const match = Object.assign(Object.create(Match.prototype), {players});

        assert.deepEqual(players.map(player => player.toTargetObj().id),
            players.map(player => player.id));
        assert.notEqual(players[0].id, players[0].userId);
        assert.notEqual(players[0].id, players[1].id);
        assert.equal(match.getPlayer('account-1'), players[0]);
        assert.equal(match.getPlayer('account-2'), players[1]);
        assert.equal(match.getPlayer('Jugador'), undefined);

        const restoredPlayer = Object.assign(
            Object.create(Player.prototype),
            {id: 'Jugador', name: 'Jugador', userId: 'account-1'},
        );
        restoreSnapshotTypes([restoredPlayer], {});
        assert.equal(restoredPlayer.id, 'Jugador');
        delete restoredPlayer.id;
        restoreSnapshotTypes([restoredPlayer], {});
        assert.equal(restoredPlayer.id, 'account-1');

        const serializedMatch = new Match({name: 'account-turn'});
        serializedMatch.currentTurnPlayer = players[1];
        assert.equal(serializedMatch.toObj().currentTurnPlayer, players[1].id);
    });

    test('lobby player creation reads identity and configuration from persistence', async () => {
        const lobby = {
            id: 'lobby-1',
            creatorId: 'account-1',
            status: 'starting',
            players: [{
                userId: 'account-1',
                name: 'Account Name',
                hero: 'spiderman',
                deckId: 'deck-spider',
                aspect: 'justice',
            }],
        };
        const calls = [];
        const data = {
            getMatchLobby: async () => lobby,
            getHeroConfig: async hero => {
                calls.push(['hero', hero]);

                return {
                    aspect: 'aggression',
                    sides: [],
                    cards: [],
                    precon: [],
                };
            },
            getDeckConfig: async (deckId, hero) => {
                calls.push(['deck', deckId, hero]);

                return {aspect: 'justice', cards: []};
            },
        };
        const createdPlayers = [];
        const match = {
            lobbyId: 'lobby-1',
            creatorUserId: 'account-1',
            players: [],
            creationConfig: {players: [], scenario: null, expert: false},
            createPlayer(config) {
                createdPlayers.push(config);
                match.players.push({userId: config.userId});

                return {id: config.id, toObj: () => config};
            },
        };
        const originalCreateSuperhero = MatchFactory.prototype.createSuperhero;
        MatchFactory.prototype.createSuperhero = () => ({id: 'hero-card'});

        try {
            await withAuthFetch(async () => {
                await new PlayerRest({mc: {data}}).createPlayer({
                    match,
                    cookie: 'session=verified',
                    name: 'Spoofed Name',
                    userId: 'forged-id',
                    hero: 'hulk',
                    deckId: 'forged-deck',
                });
            });
        } finally {
            MatchFactory.prototype.createSuperhero = originalCreateSuperhero;
        }

        assert.deepEqual(calls, [
            ['hero', 'spiderman'],
            ['deck', 'deck-spider', 'spiderman'],
        ]);
        assert.equal(createdPlayers[0].name, 'Account Name');
        assert.equal(createdPlayers[0].userId, 'account-1');
        assert.equal(createdPlayers[0].initial, true);
        assert.equal(match.creationConfig.players[0].userId, 'account-1');
    });

    test('Socket handshake forwards Cookie and stores only verified identity', async () => {
        await withAuthFetch(async () => {
            const match = new Match({name: 'game'});
            match.players = [{userId: 'account-1'}];
            const io = {
                middleware: null,
                connectionHandler: null,
                use(middleware) {
                    this.middleware = middleware;
                },
                on(_event, handler) {
                    this.connectionHandler = handler;
                },
            };
            const mcSocket = new McSocket({
                deletingMatches: new Set(),
                getMatch: name => name === 'game' ? match : undefined,
            });
            mcSocket.init(io);

            const socket = {
                handshake: {headers: {cookie: 'session=verified'}},
                data: {},
                rooms: new Set(),
                join: async room => socket.rooms.add(room),
                leave: async room => socket.rooms.delete(room),
                emit() {},
            };
            await new Promise((resolve, reject) =>
                io.middleware(socket, error => error ? reject(error) : resolve()));

            assert.deepEqual(socket.data.user, {
                id: 'account-1',
                name: 'Account Name',
            });
            assert.equal(Object.hasOwn(socket.data.user, 'email'), false);
            assert.deepEqual(await mcSocket.joinMatch(socket, {match: 'game'}), {
                ok: true,
            });
            assert.equal(socket.rooms.has('mc-match:game'), true);

            await assert.rejects(mcSocket.joinMatch({
                ...socket,
                data: {user: {id: 'account-2'}},
                rooms: new Set(),
            }, {match: 'game'}), error => error.statusCode === 403);
        });
    });

    test('only the current account may end its turn; JSON userId is ignored', () => {
        const currentPlayer = {name: 'Account Name', userId: 'account-1'};
        const otherPlayer = {name: 'Other Player', userId: 'account-2'};
        const match = {
            name: 'game',
            currentTurnPlayer: currentPlayer,
            players: [currentPlayer, otherPlayer],
        };
        const calls = [];
        const mcSocket = new McSocket({
            getMatch: name => name === 'game' ? match : undefined,
        });
        mcSocket.dispatch = (...args) => {
            calls.push(args);

            return true;
        };
        const socket = {
            data: {user: {id: 'account-1'}},
            rooms: new Set(['mc-match:game']),
        };
        let acknowledgement;

        mcSocket.handleClientEvent(
            socket,
            EVENTS.TURN.END,
            {match: 'game', userId: 'account-2'},
            response => {
                acknowledgement = response;
            },
        );
        assert.deepEqual(acknowledgement, {ok: true});
        assert.equal(calls.length, 1);

        match.currentTurnPlayer = otherPlayer;
        mcSocket.handleClientEvent(
            socket,
            EVENTS.TURN.END,
            {match: 'game', userId: 'account-2'},
            response => {
                acknowledgement = response;
            },
        );
        assert.equal(acknowledgement.ok, false);
        assert.match(acknowledgement.error, /Solo el jugador del turno/);
        assert.equal(calls.length, 1);

        match.currentTurnPlayer = currentPlayer;
        match.actionRequest = {status: 'pending'};
        mcSocket.handleClientEvent(
            socket,
            EVENTS.TURN.END,
            {match: 'game'},
            response => {
                acknowledgement = response;
            },
        );
        assert.equal(acknowledgement.ok, false);
        assert.match(acknowledgement.error, /solicitud de acción activa/);
        assert.equal(calls.length, 1);
    });

    test('dialog response must come from its targeted account when a target is known', async () => {
        const players = [
            {id: 'account-1', name: 'Same Name', userId: 'account-1'},
            {id: 'account-2', name: 'Same Name', userId: 'account-2'},
        ];
        const match = {
            name: 'game',
            players,
            getPlayer: id => players.find(player => player.id === id),
        };
        const sent = [];
        const dialogSocket = new DialogSocket({
            isMatchAvailable: () => true,
            send: (...params) => sent.push(params),
        });
        const pending = dialogSocket.openDialog(match, {
            dialogType: 'select-target',
            targetPlayer: 'account-1',
            targetPlayerName: 'Same Name',
        });
        const requestId = [...dialogSocket.pending.keys()][0];

        assert.equal(dialogSocket.respond('game', {
            requestId,
            response: {selected: 'target'},
            userId: 'account-1',
        }, 'account-2'), false);
        assert.equal(dialogSocket.pending.has(requestId), true);
        assert.equal(dialogSocket.respond('game', {
            requestId,
            response: {selected: 'target'},
            userId: 'account-2',
        }, 'account-1'), true);
        assert.deepEqual(await pending, {selected: 'target'});
        assert.equal(sent[0][1], EVENTS.DIALOG.OPEN);
        assert.equal(sent[0][2].targetPlayer, 'account-1');
        assert.equal(sent[0][2].targetPlayerName, 'Same Name');
        assert.equal(sent[1][1], EVENTS.DIALOG.COMPLETE);
        assert.deepEqual(sent[1][2], {requestId});
    });
});
