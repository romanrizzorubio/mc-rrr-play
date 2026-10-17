import assert from 'node:assert/strict';
import {test} from 'node:test';

import {PlaceDamageEffect} from '../../src/effects/place-damage-effect.js';

test('PlaceDamageEffect calculates its amount from the active effect context', async () => {
    const target = {
        attachedTo: null,
        damage: 1,
        placeDamage(amount) {
            this.damage += amount;
        },
        async refresh() {},
    };
    const effect = new PlaceDamageEffect({
        match: {},
        selectedTarget: target,
        damage: 0,
        paramsCalc: {
            target: 'triggeredTargetDamage',
        },
    });

    await effect.execute({triggeredTargetDamage: 2});

    assert.equal(target.damage, 3);
});
