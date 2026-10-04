import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {PlayTurnEffect} from '../../src/effects/play-turn-effect.js';

test('ending a turn clears the active player and refreshes the match state', async () => {
    const player = {name: 'Hulka'};
    const snapshots = [];
    const listeners = new Map();
    const match = {
        currentTurnPlayer: player,
        name: 'match',
        listen(endpoint, callback) {
            listeners.set(endpoint, callback);
        },
        async refresh() {
            snapshots.push(this.currentTurnPlayer?.name ?? null);
        },
    };
    const effect = new PlayTurnEffect({match});
    const turn = effect.execute({player});

    await Promise.resolve();
    listeners.get(EVENTS.TURN.END)({player: player.name});
    await turn;

    assert.deepEqual(snapshots, ['Hulka', null]);
    assert.equal(match.currentTurnPlayer, undefined);
});
