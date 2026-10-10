import assert from 'node:assert/strict';
import {test} from 'node:test';

import {PRIORITY_FORCED_INTERRUPT} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';

function createTrigger(runTrigger) {
    return {
        ability: {
            hideDialog: true,
            isOptionAbility: false,
        },
        keepTriggering: false,
        paymentCancelled: false,
        async canTrigger() {
            return true;
        },
        async runTrigger(params) {
            await runTrigger(params);
        },
    };
}

async function assertRemainingTriggersStopWhenEffectIsCanceled(effectOnEngine) {
    const engine = new Engine();
    engine.match = {triggerCards: {}};

    let canceled = false;
    const effect = {
        cancel() {
            canceled = true;
        },
        checkTrigger() {
            return !canceled;
        },
    };
    if (effectOnEngine) {
        engine.cancel = effect.cancel;
        engine.checkTrigger = effect.checkTrigger;
    }

    const operations = [];
    const cancelEffectTrigger = createTrigger(() => {
        operations.push('replace');
        (effectOnEngine ? engine : effect).cancel();
    });
    const laterTrigger = createTrigger(() => {
        operations.push('later-trigger');
    });

    const canContinue = await engine.trigger(
        PRIORITY_FORCED_INTERRUPT,
        [],
        {
            effect: effectOnEngine ? engine : effect,
            player: {},
        },
        [cancelEffectTrigger, laterTrigger]
    );

    assert.equal(canContinue, false);
    assert.deepEqual(operations, ['replace']);
}

test('stops remaining triggers when the dispatched effect is canceled', async () => {
    await assertRemainingTriggersStopWhenEffectIsCanceled(true);
});

test('stops remaining triggers when a separate context dispatches the effect event', async () => {
    await assertRemainingTriggersStopWhenEffectIsCanceled(false);
});
