import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ATTACKED} from 'mc-shared';

import {Attack} from '../../src/activations/attack.js';
import {encounterTargets} from '../../src/targets/encounter.js';

test('attack responses target the active stage of the same villain', () => {
    const stageOne = {
        isVillain: true,
        isInPlay: false,
        name: 'Rino',
        stage: 1,
    };
    const stageTwo = {
        isVillain: true,
        isInPlay: true,
        name: 'Rino',
        stage: 2,
    };
    const attackEffect = {
        character: {},
        match: {
            villain: stageTwo,
        },
        selectedTarget: stageOne,
    };
    const responseEffect = {
        selectedTarget: stageOne,
    };
    const attack = new Attack({effect: attackEffect});

    attack.getTriggersEnds({effect: responseEffect});

    assert.equal(attackEffect.selectedTarget, stageTwo);
    assert.equal(responseEffect.selectedTarget, stageTwo);
    assert.deepEqual(encounterTargets[TARGET_ATTACKED]({attack}), [stageTwo]);
});

test('attack responses do not retarget a villain with a different title', () => {
    const stageOne = {
        isVillain: true,
        isInPlay: false,
        name: 'Rino',
        stage: 1,
    };
    const nextVillain = {
        isVillain: true,
        isInPlay: true,
        name: 'Klaw',
        stage: 1,
    };
    const attackEffect = {
        character: {},
        match: {
            villain: nextVillain,
        },
        selectedTarget: stageOne,
    };
    const responseEffect = {
        selectedTarget: stageOne,
    };
    const attack = new Attack({effect: attackEffect});

    attack.getTriggersEnds({effect: responseEffect});

    assert.equal(attackEffect.selectedTarget, stageOne);
    assert.equal(responseEffect.selectedTarget, stageOne);
});
