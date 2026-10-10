import assert from 'node:assert/strict';
import test from 'node:test';

import {ConditionGetTraitsTrigger} from '../../src/triggers/condition-get-traits-trigger.js';

const createTrigger = params => new ConditionGetTraitsTrigger({
    ability: {
        async canTrigger() {
            return true;
        },
    },
    card: {},
    trigger: 'CONDITION_GET_TRAITS',
    ...params,
});

test('ConditionGetTraitsTrigger runs when no condition is configured', async () => {
    const trigger = createTrigger();

    assert.equal(await trigger.canTrigger({
        effect: {
            selectedTarget: {
                name: 'Capitana Marvel',
            },
        },
    }), true);
});

test('ConditionGetTraitsTrigger applies configured conditions', async () => {
    const trigger = createTrigger({
        conditionSource: 'effect.selectedTarget',
        conditionTrigger: {
            name: 'Capitana Marvel',
        },
    });

    assert.equal(await trigger.canTrigger({
        effect: {
            selectedTarget: {
                name: 'Capitana Marvel',
            },
        },
    }), true);
    assert.equal(await trigger.canTrigger({
        effect: {
            selectedTarget: {
                name: 'Rhino',
            },
        },
    }), undefined);
});

test('ConditionGetTraitsTrigger rejects a partially configured condition', () => {
    assert.throws(() => createTrigger({
        conditionSource: 'effect.selectedTarget',
    }), /conditionSource and conditionTrigger must be configured together/);
});
