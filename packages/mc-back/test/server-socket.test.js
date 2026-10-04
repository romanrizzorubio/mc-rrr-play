import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Mc} from '../src/server/mc.js';
import {DialogSocket} from '../src/server/socket/dialog-socket.js';

test('clearing a deleted match rejects its dialogs and prevents replay', async () => {
    const sent = [];
    const socket = new DialogSocket({
        send: (...args) => sent.push(args),
    });
    const staleResponse = socket.openDialog(
        {name: 'same-name'},
        {dialogType: 'discard-hand'},
    );
    const activeResponse = socket.openDialog(
        {name: 'other-match'},
        {dialogType: 'discard-hand'},
    );
    const staleRejection = assert.rejects(
        staleResponse,
        /se ha eliminado mientras esperaba una respuesta/,
    );

    assert.equal(socket.clearPending('same-name'), 1);
    await staleRejection;

    const replayed = [];
    socket.resendPending('same-name', {
        emit: (...args) => replayed.push(args),
    });
    assert.deepEqual(replayed, []);

    socket.resendPending('other-match', {
        emit: (...args) => replayed.push(args),
    });
    assert.equal(replayed.length, 1);
    assert.equal(socket.respond('other-match', {
        requestId: sent[1][2].requestId,
        response: {selected: []},
    }), true);
    assert.deepEqual(await activeResponse, {selected: []});
});

test('deleting a match clears its pending dialogs after deleting the snapshot', async () => {
    const match = {
        name: 'same-name',
        initializing: false,
        playing: true,
    };
    const calls = [];
    const mc = Object.assign(Object.create(Mc.prototype), {
        matches: {'same-name': match},
        deletingMatches: new Set(),
        persistenceQueues: new Map(),
        data: {
            deleteMatchSnapshot: async () => calls.push('snapshot'),
        },
        mcSocket: {
            dialogSocket: {
                clearPending: name => calls.push(`dialogs:${name}`),
            },
        },
    });

    await mc.deleteMatch('same-name');

    assert.deepEqual(calls, ['snapshot', 'dialogs:same-name']);
    assert.equal(match.playing, false);
    assert.equal(mc.getMatch('same-name'), undefined);
});
