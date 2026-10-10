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
        triggerCards: {},
        listen(endpoint, callback) {
            listeners.set(endpoint, callback);
        },
        async persist() {},
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

test('persists turn-start processing before opening its trigger windows', async () => {
    const player = {name: 'Hulka'};
    const listeners = new Map();
    const match = {
        name: 'match',
        triggerCards: {},
        turnStartProcessed: false,
        listen(endpoint, callback) {
            listeners.set(endpoint, callback);
        },
        async persist() {
            assert.equal(this.turnStartProcessed, true);
        },
        async refresh() {},
    };
    const effect = new PlayTurnEffect({match});
    const priorities = [];
    effect.trigger = async priority => {
        priorities.push(priority);
        assert.equal(match.turnStartProcessed, true);
    };

    const turn = effect.execute({player});
    await new Promise(resolve => setImmediate(resolve));
    listeners.get(EVENTS.TURN.END)({});
    await turn;

    assert.equal(priorities.length, 5);
});

test('does not replay turn-start triggers for a restored turn', async () => {
    const player = {name: 'Hulka'};
    const listeners = new Map();
    const match = {
        name: 'match',
        triggerCards: {},
        turnStartProcessed: true,
        listen(endpoint, callback) {
            listeners.set(endpoint, callback);
        },
        async persist() {
            assert.fail('A resumed turn must not re-persist its start marker');
        },
        async refresh() {},
    };
    const effect = new PlayTurnEffect({match});
    let triggerCalls = 0;
    effect.trigger = async () => {
        triggerCalls++;
    };

    const turn = effect.execute({player});
    await new Promise(resolve => setImmediate(resolve));
    listeners.get(EVENTS.TURN.END)({});
    await turn;

    assert.equal(triggerCalls, 0);
    assert.equal(match.turnStartProcessed, true);
});
