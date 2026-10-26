import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_HERO,
    getClassifications,
    hasClassification,
} from '../index.js';

describe('card classifications', () => {
    test('supports a single classification string', () => {
        assert.deepEqual(
            getClassifications(CLASSIFICATION_AGGRESSION),
            [CLASSIFICATION_AGGRESSION],
        );
        assert.equal(
            hasClassification(CLASSIFICATION_AGGRESSION, CLASSIFICATION_AGGRESSION),
            true,
        );
        assert.equal(
            hasClassification(CLASSIFICATION_AGGRESSION, CLASSIFICATION_HERO),
            false,
        );
    });

    test('supports multiple classifications while matching each value', () => {
        const classifications = [CLASSIFICATION_HERO, CLASSIFICATION_AGGRESSION];

        assert.deepEqual(getClassifications(classifications), classifications);
        assert.equal(hasClassification(classifications, CLASSIFICATION_HERO), true);
        assert.equal(
            hasClassification(classifications, CLASSIFICATION_AGGRESSION),
            true,
        );
        assert.equal(hasClassification(classifications, 'justice'), false);
        assert.equal(hasClassification(undefined, CLASSIFICATION_HERO), false);
    });
});
