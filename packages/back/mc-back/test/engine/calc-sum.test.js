import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CALC_SUM} from 'mc-shared';
import {Calc} from '../../src/engine/calc.js';

describe('CALC_SUM', () => {
    test('sums numeric values resolved from a runtime collection path', () => {
        const calc = new Calc({
            formula: CALC_SUM,
            target: 'ability.card.faceDown',
            property: 'card.cost',
        });

        assert.equal(calc.calculate({
            ability: {
                card: {
                    faceDown: [
                        {card: {cost: 2}},
                        {card: {cost: 4}},
                    ],
                },
            },
        }), 6);
    });

    test('returns zero for an empty collection', () => {
        const calc = new Calc({
            formula: CALC_SUM,
            target: 'cards',
        });

        assert.equal(calc.calculate({cards: []}), 0);
    });

    test('rejects a target that does not resolve to a list', () => {
        const calc = new Calc({
            formula: CALC_SUM,
            target: 'cards',
        });

        assert.throws(() => calc.calculate({}), {
            message: 'CALC_SUM requiere que "cards" resuelva a una lista.',
        });
    });

    test('rejects non-numeric values in the collection', () => {
        const calc = new Calc({
            formula: CALC_SUM,
            target: 'cards',
            property: 'cost',
        });

        assert.throws(() => calc.calculate({cards: [{cost: undefined}]}), {
            message: 'CALC_SUM requiere valores numéricos en "cards".',
        });
    });
});
