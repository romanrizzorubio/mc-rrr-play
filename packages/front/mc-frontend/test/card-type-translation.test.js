import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ANY,
    CARD_TYPES,
} from 'mc-shared';
import {
    getCardTypeLabel,
    sortCardTypeOptions,
} from '../src/utils/card-type-translation.js';

describe('card type translations', () => {
    test('provides a Spanish label for every selectable card type', () => {
        assert.ok(CARD_TYPES.length > 0);
        assert.equal(CARD_TYPES.includes(CARD_TYPE_ANY), false);

        for (const cardType of CARD_TYPES) {
            assert.ok(getCardTypeLabel(cardType));
        }
    });

    test('uses the front-end label for ally card types', () => {
        assert.equal(getCardTypeLabel(CARD_TYPE_ALLY), 'Aliado');
    });

    test('sorts type options by Spanish label without changing their IDs', () => {
        const options = CARD_TYPES.map((cardType, id) => ({id, cardType}));
        const sortedOptions = sortCardTypeOptions(options);
        const labels = sortedOptions.map(({cardType}) =>
            getCardTypeLabel(cardType));

        assert.deepEqual(
            labels,
            [...labels].sort((left, right) =>
                left.localeCompare(right, 'es', {sensitivity: 'base'}))
        );
        assert.deepEqual(
            [...sortedOptions].sort((left, right) => left.id - right.id),
            options
        );
        assert.deepEqual(
            options,
            CARD_TYPES.map((cardType, id) => ({id, cardType}))
        );
    });

    test('rejects unknown card type labels', () => {
        assert.throws(
            () => getCardTypeLabel('custom-card-type'),
            RangeError
        );
    });
});
