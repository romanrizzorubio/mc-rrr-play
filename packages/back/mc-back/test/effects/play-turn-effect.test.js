import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_PLAYER_TURN_START,
} from 'mc-shared';
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
    const triggers = [];
    effect.trigger = async (priority, triggerTypes) => {
        triggers.push({priority, type: triggerTypes[0]});
        assert.equal(match.turnStartProcessed, true);
    };

    const turn = effect.execute({player});
    await new Promise(resolve => setImmediate(resolve));
    listeners.get(EVENTS.TURN.END)({});
    await turn;

    assert.deepEqual(triggers, [
        {priority: PRIORITY_CONSTANT, type: TRIGGER_PLAYER_TURN_START},
        {
            priority: PRIORITY_FORCED_INTERRUPT,
            type: TRIGGER_PLAYER_TURN_START,
        },
        {priority: PRIORITY_INTERRUPT, type: TRIGGER_PLAYER_TURN_START},
        {
            priority: PRIORITY_FORCED_RESPONSE,
            type: TRIGGER_PLAYER_TURN_START,
        },
        {priority: PRIORITY_RESPONSE, type: TRIGGER_PLAYER_TURN_START},
        {priority: PRIORITY_CONSTANT, type: TRIGGER_PLAYER_TURN_END},
        {priority: PRIORITY_FORCED_INTERRUPT, type: TRIGGER_PLAYER_TURN_END},
        {priority: PRIORITY_INTERRUPT, type: TRIGGER_PLAYER_TURN_END},
        {priority: PRIORITY_FORCED_RESPONSE, type: TRIGGER_PLAYER_TURN_END},
        {priority: PRIORITY_RESPONSE, type: TRIGGER_PLAYER_TURN_END},
    ]);
});

test('restored turns skip start triggers but open their end triggers', async () => {
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
    const triggers = [];
    effect.trigger = async (_priority, triggerTypes) => {
        triggers.push(triggerTypes[0]);
    };

    const turn = effect.execute({player});
    await new Promise(resolve => setImmediate(resolve));
    listeners.get(EVENTS.TURN.END)({});
    await turn;

    assert.deepEqual(triggers, [
        TRIGGER_PLAYER_TURN_END,
        TRIGGER_PLAYER_TURN_END,
        TRIGGER_PLAYER_TURN_END,
        TRIGGER_PLAYER_TURN_END,
        TRIGGER_PLAYER_TURN_END,
    ]);
    assert.equal(match.turnStartProcessed, true);
});
