import assert from 'node:assert/strict';
import test from 'node:test';

import {
    CALC_COUNT,
    CALC_STAGE,
    CALC_TRAITS_COUNT,
    TARGET_MAIN_SCHEME,
    TARGET_VILLAIN,
    TRAIT_GOBLIN,
} from 'mc-shared';
import {Calc} from '../../src/engine/calc.js';

test('CALC_COUNT reports the runtime path when it does not resolve to a list', () => {
    const calc = new Calc({
        formula: CALC_COUNT,
        target: 'effect.missing',
    });

    assert.throws(() => calc.calculate({effect: {}}), {
        message: 'CALC_COUNT requiere que "effect.missing" resuelva a una lista.',
    });
});

test('CALC_TRAITS_COUNT reports the runtime path when it does not resolve to a list', () => {
    const calc = new Calc({
        formula: CALC_TRAITS_COUNT,
        target: 'match.minions',
        trait: TRAIT_GOBLIN,
    });

    assert.throws(() => calc.calculate({match: {}}), {
        message: 'CALC_TRAITS_COUNT requiere que "match.minions" resuelva a una lista.',
    });
});

test('CALC_STAGE reads the stage from a villain or main scheme', () => {
    const villainStage = new Calc({
        formula: CALC_STAGE,
        target: TARGET_VILLAIN,
    });
    const mainSchemeStage = new Calc({
        formula: CALC_STAGE,
        target: TARGET_MAIN_SCHEME,
    });
    const params = {
        match: {
            villain: {stage: 3},
            mainScheme: {stage: 2},
        },
    };

    assert.equal(villainStage.calculate(params), 3);
    assert.equal(mainSchemeStage.calculate(params), 2);
});

test('CALC_STAGE reports when its target has no numeric stage', () => {
    const calc = new Calc({
        formula: CALC_STAGE,
        target: TARGET_MAIN_SCHEME,
    });

    assert.throws(() => calc.calculate({match: {mainScheme: {}}}), {
        message: `CALC_STAGE requiere una etapa numérica en "${TARGET_MAIN_SCHEME}".`,
    });
});

test('CALC_STAGE only accepts villain and main scheme targets', () => {
    const calc = new Calc({
        formula: CALC_STAGE,
        target: 'enemy',
    });

    assert.throws(() => calc.calculate({match: {}}), {
        message: 'CALC_STAGE requiere TARGET_VILLAIN o TARGET_MAIN_SCHEME; se recibió "enemy".',
    });
});
