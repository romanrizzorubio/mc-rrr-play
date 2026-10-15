import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CALC_COUNT} from 'mc-shared';
import {ModifyCostEffect} from '../../src/effects/modify-cost-effect.js';

test('applies a dynamic cost modifier from the runtime calculation', async () => {
    const selectedTarget = {modifyCost: 0};
    const effect = new ModifyCostEffect({
        count: 0,
        match: {},
        paramsCalc: {
            target: 'player.minions',
            formula: CALC_COUNT,
            multiply: -1,
        },
        selectedTarget,
    });

    await effect.execute({
        player: {
            minions: [{}, {}, {}],
        },
    });

    assert.equal(selectedTarget.modifyCost, -3);
});
