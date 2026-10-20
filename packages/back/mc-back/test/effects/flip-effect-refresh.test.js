import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_RESPONSE,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_THIS_FLIP,
} from 'mc-shared';
import {FlipEffect} from '../../src/effects/flip-effect.js';

test('waits for the identity refresh before completing a flip', async () => {
    let resolveRefresh;
    let refreshStarted = false;
    let refreshFinished = false;
    let effectFinished = false;
    const refresh = new Promise(resolve => {
        resolveRefresh = resolve;
    });
    const sides = [{}, {}];
    const selectedTarget = {
        sides,
        endTriggers() {},
        async initTriggers() {},
        async refresh() {
            refreshStarted = true;
            await refresh;
            refreshFinished = true;
        },
    };
    const effect = new FlipEffect({
        selectedTarget,
        selectedFormTarget: sides[1],
    });
    effect.trigger = async () => {};

    const execution = effect.execute({own: true}).then(() => {
        effectFinished = true;
    });

    await new Promise(resolve => setImmediate(resolve));
    assert.equal(refreshStarted, true);
    assert.equal(effectFinished, false);

    resolveRefresh();
    await execution;

    assert.equal(refreshFinished, true);
    assert.equal(effectFinished, true);
});

test('emits player-flip triggers with the player who changed identity', async () => {
    const triggerCalls = [];
    const sides = [{isHero: false}, {isHero: true}];
    const player = {
        hand: {
            async refresh() {},
        },
        isPlayer: true,
    };
    const selectedTarget = {
        endTriggers() {},
        async initTriggers() {},
        async refresh() {},
        owner: player,
        selectedSide: 0,
        sides,
        get isHero() {
            return this.sides[this.selectedSide].isHero;
        },
    };
    const effect = new FlipEffect({
        selectedTarget,
        selectedFormTarget: sides[1],
    });
    effect.trigger = async (...args) => triggerCalls.push(args);

    await effect.execute({player});

    assert.deepEqual(triggerCalls.map(([priority, types]) => [priority, types]), [
        [PRIORITY_CONSTANT, [TRIGGER_THIS_FLIP, TRIGGER_SUPERHERO_FLIPS]],
        [PRIORITY_FORCED_RESPONSE, [TRIGGER_THIS_FLIP, TRIGGER_SUPERHERO_FLIPS]],
        [PRIORITY_RESPONSE, [TRIGGER_THIS_FLIP, TRIGGER_SUPERHERO_FLIPS]],
    ]);
    assert.ok(triggerCalls.every(([, , params]) => params.player === player));
    assert.ok(triggerCalls.every(([, , params]) => params.card === selectedTarget));
    assert.ok(triggerCalls.every(([, , params]) => params.triggeredCard === selectedTarget));
});
