import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';
import {DialogSocket} from '../../src/server/socket/dialog-socket.js';

describe('match mulligan', () => {
    test('targets each player and waits for every mulligan to finish', async () => {
        const sent = [];
        const finished = [];
        let finishFirst;
        let finishSecond;
        const finishing = [
            new Promise(resolve => {
                finishFirst = resolve;
            }),
            new Promise(resolve => {
                finishSecond = resolve;
            }),
        ];
        const players = [];
        const match = Object.assign(Object.create(Match.prototype), {
            name: 'game',
            players,
            mc: {
                mcSocket: {
                    send: (...params) => sent.push(params),
                },
            },
            getPlayer: id => players.find(player => player.id === id),
        });
        const dialogSocket = new DialogSocket({
            isMatchAvailable: () => true,
            send: (...params) => sent.push(params),
        });

        players.push(...['account-1', 'account-2'].map((id, index) => {
            const player = Object.assign(Object.create(Player.prototype), {
                id,
                userId: id,
                name: `Player ${index + 1}`,
                hand: {cards: []},
                getHandSize: async () => 6,
                openDialog: params => dialogSocket.openDialog(match, params),
                finishMulligan: async () => {
                    await finishing[index];
                    finished.push(id);
                },
            });

            return player;
        }));

        const mulligan = match.mulligan();
        await new Promise(resolve => setImmediate(resolve));

        const openDialogs = sent.filter(([, endpoint]) =>
            endpoint === EVENTS.DIALOG.OPEN);
        assert.equal(openDialogs.length, 2);
        assert.deepEqual(
            openDialogs.map(([, , dialog]) => dialog.targetPlayer).sort(),
            ['account-1', 'account-2'],
        );
        assert.ok(openDialogs.every(([, , dialog]) => dialog.isMulligan));
        assert.ok(openDialogs.every(([, , dialog]) => dialog.closeOnResponse));

        const requestIdByPlayer = new Map(openDialogs.map(([, , dialog]) => [
            dialog.targetPlayer,
            dialog.requestId,
        ]));

        assert.equal(dialogSocket.respond('game', {
            requestId: requestIdByPlayer.get('account-1'),
            response: {selected: []},
        }, 'account-2'), false);
        assert.equal(dialogSocket.respond('game', {
            requestId: requestIdByPlayer.get('account-1'),
            response: {selected: []},
        }, 'account-1'), true);
        assert.equal(dialogSocket.respond('game', {
            requestId: requestIdByPlayer.get('account-2'),
            response: {selected: []},
        }, 'account-2'), true);

        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(finished, []);
        assert.equal(sent.some(([, endpoint]) =>
            endpoint === EVENTS.MATCH.MULLIGAN_COMPLETE), false);

        finishFirst();
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(finished, ['account-1']);
        assert.equal(sent.some(([, endpoint]) =>
            endpoint === EVENTS.MATCH.MULLIGAN_COMPLETE), false);

        finishSecond();
        await mulligan;

        assert.deepEqual(finished, ['account-1', 'account-2']);
        assert.deepEqual(sent.at(-1), [
            'game',
            EVENTS.MATCH.MULLIGAN_COMPLETE,
            {match: 'game'},
        ]);
    });
});
