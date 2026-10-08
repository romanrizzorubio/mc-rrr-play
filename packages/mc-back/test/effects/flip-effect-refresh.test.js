import assert from 'node:assert/strict';
import {test} from 'node:test';

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
