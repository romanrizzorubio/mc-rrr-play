import assert from 'node:assert/strict';
import test from 'node:test';

import {CALC_COUNT} from 'mc-shared';
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
