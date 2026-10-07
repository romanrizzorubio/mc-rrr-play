import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DefeatEffect} from '../../src/effects/defeat-effect.js';

test('defeating a same-title villain stage updates the defeat and attack targets', async () => {
    const stageTwo = {
        isVillain: true,
        name: 'Rino',
        stage: 2,
        refresh() {},
    };
    let currentVillain;
    const stageOne = {
        abilities: [],
        isVillain: true,
        name: 'Rino',
        stage: 1,
        async defeat() {
            currentVillain = stageTwo;
        },
    };
    const attackEffect = {
        selectedTarget: stageOne,
    };
    const activation = {
        get selectedTarget() {
            return attackEffect.selectedTarget;
        },
        set selectedTarget(target) {
            attackEffect.selectedTarget = target;
        },
    };
    const effect = new DefeatEffect({
        activation,
        match: {
            triggerCards: {},
            get villain() {
                return currentVillain;
            },
        },
        selectedTarget: stageOne,
    });

    await effect.execute({player: {}});

    assert.equal(effect.selectedTarget, stageTwo);
    assert.equal(attackEffect.selectedTarget, stageTwo);
});
