import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {DialogSocket} from '../src/server/socket/dialog-socket.js';
import {McSocket} from '../src/server/socket/mc-socket.js';

describe('match socket controls', () => {
    test('individual leave removes only the requested room membership', async () => {
        const mcSocket = new McSocket({});
        const room = mcSocket.roomName('game');
        const calls = [];
        const socket = {
            data: {match: 'game'},
            rooms: new Set([room]),
            leave: async name => {
                calls.push(name);
                socket.rooms.delete(name);
            },
        };

        assert.deepEqual(await mcSocket.leaveMatch(socket, {match: 'game'}), {
            ok: true,
        });
        assert.deepEqual(calls, [room]);
        assert.equal(socket.data.match, undefined);
        assert.equal(socket.rooms.has(room), false);
        await assert.rejects(
            mcSocket.leaveMatch(socket, {match: 'another-game'}),
            error => error.statusCode === 409,
        );
    });

    test('creator exit notifies the room before removing all sockets', async () => {
        const mcSocket = new McSocket({});
        const room = mcSocket.roomName('game');
        const calls = [];
        mcSocket.io = {
            to: name => ({
                emit: (event, payload) => calls.push(['emit', name, event, payload]),
            }),
            in: name => ({
                socketsLeave: async leavingRoom =>
                    calls.push(['leave', name, leavingRoom]),
            }),
        };

        await mcSocket.closeMatch('game');

        assert.deepEqual(calls, [
            ['emit', room, EVENTS.MATCH.EXIT, {match: 'game'}],
            ['leave', room, room],
        ]);
    });

    test('pending decision lookup is scoped to its match', () => {
        const dialogSocket = new DialogSocket({});
        dialogSocket.pending.set('game:1', {matchName: 'game'});
        dialogSocket.pending.set('other:1', {matchName: 'other'});

        assert.equal(dialogSocket.hasPending('game'), true);
        assert.equal(dialogSocket.hasPending('missing'), false);
    });
});
