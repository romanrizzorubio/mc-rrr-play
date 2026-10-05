import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CALC_ALL,
    EFFECT_DEFEAT,
    EFFECT_PREVENT_DEFEAT,
    TARGET_EFFECT,
} from 'mc-shared';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {HealEffect} from '../../src/effects/heal-effect.js';
import {PreventDefeatEffect} from '../../src/effects/prevent-defeat-effect.js';

test('prevent defeat replaces defeat before the minion is discarded', async () => {
    let defeatCount = 0;
    const minion = {
        abilities: [],
        async defeat() {
            defeatCount++;
        },
    };
    const match = {
        triggerCards: {},
        villain: undefined,
    };
    const defeat = new DefeatEffect({
        effectType: EFFECT_DEFEAT,
        match,
        selectedTarget: minion,
    });
    const preventDefeat = new PreventDefeatEffect({
        effectType: EFFECT_PREVENT_DEFEAT,
        match,
        target: TARGET_EFFECT,
    });

    assert.equal(await preventDefeat.canRun({effect: defeat, player: {}}), true);
    await preventDefeat.runEffect({effect: defeat, player: {}});
    await defeat.execute({player: {}});

    assert.equal(defeat.prevented, true);
    assert.equal(defeatCount, 0);
});

test('heal can resolve all damage, including zero damage', async () => {
    const minion = {
        damage: 5,
        canHeal: true,
        healDamage(amount) {
            this.damage -= amount;
        },
        async refresh() {},
    };
    const heal = new HealEffect({
        allowNoDamage: true,
        damage: 0,
        paramsCalc: {
            formula: CALC_ALL,
            target: 'effect.selectedTarget',
        },
        selectedTarget: minion,
    });

    await heal.execute({});
    assert.equal(minion.damage, 0);

    minion.canHeal = false;
    minion.damage = 0;
    assert.equal(await heal.canRun({player: {}}), true);
    await heal.execute({});
    assert.equal(minion.damage, 0);
});
