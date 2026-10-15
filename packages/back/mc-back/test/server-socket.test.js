import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Mc} from '../src/server/mc.js';
import {DialogSocket} from '../src/server/socket/dialog-socket.js';
import {McSocket} from '../src/server/socket/mc-socket.js';

test('clearing a deleted match rejects its dialogs and prevents replay', async () => {
    const sent = [];
    const matches = new Map([
        ['same-name', {name: 'same-name'}],
        ['other-match', {name: 'other-match'}],
    ]);
    const socket = new DialogSocket({
        isMatchAvailable: match => matches.get(match.name) === match,
        send: (...args) => sent.push(args),
    });
    const staleMatch = matches.get('same-name');
    const activeMatch = matches.get('other-match');
    const staleResponse = socket.openDialog(
        staleMatch,
        {dialogType: 'discard-hand'},
    );
    const activeResponse = socket.openDialog(
        activeMatch,
        {dialogType: 'discard-hand'},
    );
    const staleRejection = assert.rejects(staleResponse, error => {
        assert.equal(error.statusCode, 409);

        return /se ha eliminado mientras esperaba una respuesta/.test(error.message);
    });

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

test('deleting a match during initialization cancels pending and future dialogs', async () => {
    const match = {
        name: 'initializing-match',
        initializing: true,
        playing: false,
    };
    const calls = [];
    const sent = [];
    let finishSnapshotDeletion;
    const snapshotDeletion = new Promise(resolve => {
        finishSnapshotDeletion = resolve;
    });
    const mc = Object.assign(Object.create(Mc.prototype), {
        matches: {[match.name]: match},
        deletingMatches: new Set(),
        persistenceQueues: new Map(),
        data: {
            deleteMatchSnapshot: async () => {
                calls.push('snapshot');
                await snapshotDeletion;
            },
        },
    });
    const mcSocket = new McSocket(mc);
    mc.mcSocket = mcSocket;
    mcSocket.io = {
        to: room => ({
            emit: (endpoint, dialog) => sent.push({room, endpoint, dialog}),
        }),
    };

    const pendingDialog = mcSocket.dialogSocket.openDialog(
        match,
        {dialogType: 'encounters-reveal'},
    );
    const pendingRejection = assert.rejects(pendingDialog, error => {
        assert.equal(error.statusCode, 409);

        return /se ha eliminado mientras esperaba una respuesta/.test(error.message);
    });
    const deletion = mc.deleteMatch(match.name);
    const newDialogRejection = assert.rejects(
        mcSocket.dialogSocket.openDialog(match, {dialogType: 'discard-hand'}),
        error => error.statusCode === 409,
    );

    finishSnapshotDeletion();
    await deletion;
    await Promise.all([pendingRejection, newDialogRejection]);

    assert.deepEqual(calls, ['snapshot']);
    assert.equal(mc.getMatch(match.name), undefined);
    assert.equal(mcSocket.dialogSocket.pending.size, 0);
    assert.equal(sent.length, 1);
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

test('deleting a listed match removes its snapshot even when it is not loaded', async () => {
    const calls = [];
    const mc = Object.assign(Object.create(Mc.prototype), {
        matches: {},
        deletingMatches: new Set(),
        persistenceQueues: new Map(),
        data: {
            deleteMatchSnapshot: async name => calls.push(`snapshot:${name}`),
        },
        mcSocket: {
            dialogSocket: {
                clearPending: name => calls.push(`dialogs:${name}`),
            },
        },
    });

    await mc.deleteMatch('RRR');

    assert.deepEqual(calls, ['snapshot:RRR', 'dialogs:RRR']);
    assert.equal(mc.getMatch('RRR'), undefined);
    assert.equal(mc.deletingMatches.has('RRR'), false);
    assert.equal(mc.persistenceQueues.has('RRR'), false);
});
