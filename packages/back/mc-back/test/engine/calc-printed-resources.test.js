import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CALC_PRINTED_RESOURCES,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';
import {Calc} from '../../src/engine/calc.js';

describe('CALC_PRINTED_RESOURCES', () => {
    test('counts each printed icon, including repeated icons', () => {
        const calc = new Calc({
            formula: CALC_PRINTED_RESOURCES,
            target: 'effects.0.cards',
        });

        const result = calc.calculate({
            effects: [{
                cards: [
                    {
                        card: {
                            getPrintedResources: () => [RESOURCE_WILD],
                        },
                    },
                    {
                        card: {
                            getPrintedResources: () => [
                                RESOURCE_PHYSICAL,
                                RESOURCE_PHYSICAL,
                            ],
                        },
                    },
                ],
            }],
        });

        assert.equal(result, 3);
    });

    test('rejects a target that does not resolve to a list', () => {
        const calc = new Calc({
            formula: CALC_PRINTED_RESOURCES,
            target: 'cards',
        });

        assert.throws(() => calc.calculate({}), {
            message: 'CALC_PRINTED_RESOURCES requiere que "cards" resuelva a una lista.',
        });
    });

    test('rejects cards without printed-resource data', () => {
        const calc = new Calc({
            formula: CALC_PRINTED_RESOURCES,
            target: 'cards',
        });

        assert.throws(() => calc.calculate({cards: [{}]}), {
            message: 'CALC_PRINTED_RESOURCES requiere cartas con recursos impresos en "cards".',
        });
    });
});
