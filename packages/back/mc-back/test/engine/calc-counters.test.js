import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CALC_COUNTERS} from 'mc-shared';
import {Calc} from '../../src/engine/calc.js';

describe('CALC_COUNTERS', () => {
    test('returns a card counter count and treats an uninitialized count as zero', () => {
        const calc = new Calc({
            target: 'card',
            formula: CALC_COUNTERS,
        });

        assert.equal(calc.calculate({card: {counters: 3}}), 3);
        assert.equal(calc.calculate({card: {counters: 0}}), 0);
        assert.equal(calc.calculate({card: {}}), 0);
    });

    test('rejects missing cards, non-card targets, and invalid counter counts', () => {
        const calc = new Calc({
            target: 'card',
            formula: CALC_COUNTERS,
        });

        assert.throws(() => calc.calculate({}), TypeError);
        assert.throws(() => calc.calculate({card: []}), TypeError);
        assert.throws(() => calc.calculate({card: {counters: -1}}), TypeError);
        assert.throws(() => calc.calculate({card: {counters: 1.5}}), TypeError);
    });
});
