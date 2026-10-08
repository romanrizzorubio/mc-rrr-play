import assert from 'node:assert/strict';
import test from 'node:test';

import {ChainedEffect} from '../../src/effects/chained-effect.js';

test('a chained effect skips an unavailable child outside a cost or Then', async () => {
    const resolved = [];
    const effect = new ChainedEffect({
        effects: [
            {
                async canRun() {
                    return false;
                },
                async runEffect() {
                    resolved.push('unavailable');
                },
            },
            {
                async canRun() {
                    return true;
                },
                async runEffect() {
                    resolved.push('available');
                },
            },
        ],
    });

    assert.equal(await effect.canRun({matchAll: true}), true);
    await effect.execute({matchAll: true});

    assert.deepEqual(resolved, ['available']);
});

test('a cost chain requires every child to be available', async () => {
    const resolved = [];
    const effect = new ChainedEffect({
        effects: [
            {
                async canRun() {
                    return false;
                },
                async runEffect() {
                    resolved.push('unavailable');
                },
            },
            {
                async canRun() {
                    return true;
                },
                async runEffect() {
                    resolved.push('available');
                },
            },
        ],
    });

    assert.equal(await effect.canRun({isCost: true}), false);
    await effect.execute({isCost: true});

    assert.deepEqual(resolved, []);
});

test('a chain with a following Then requires every preceding child', async () => {
    const resolved = [];
    const effect = new ChainedEffect({
        effects: [
            {
                async canRun() {
                    return false;
                },
                async runEffect() {
                    resolved.push('unavailable');
                },
            },
            {
                async canRun() {
                    return true;
                },
                async runEffect() {
                    resolved.push('available');
                },
            },
        ],
        thenEffect: {},
    });

    assert.equal(await effect.canRun({}), false);
    await effect.execute({});

    assert.deepEqual(resolved, []);
});
