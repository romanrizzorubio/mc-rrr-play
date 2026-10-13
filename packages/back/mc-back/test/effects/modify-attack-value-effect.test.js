import assert from 'node:assert/strict';
import test from 'node:test';

import {CALC_STAGE, TARGET_VILLAIN} from 'mc-shared';
import {ModifyAttackValueEffect} from '../../src/effects/modify-attack-value-effect.js';

test('ModifyAttackValueEffect resolves CALC_STAGE from its match when runtime params omit match', async () => {
    const villain = {stage: 1, modifyAttack: 0};
    const effect = new ModifyAttackValueEffect({
        match: {villain},
        paramsCalc: {
            formula: CALC_STAGE,
            target: TARGET_VILLAIN,
        },
        selectedTarget: villain,
    });

    await effect.execute({});

    assert.equal(villain.modifyAttack, 1);
});
