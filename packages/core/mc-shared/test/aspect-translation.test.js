import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ASPECT_IDS,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_HERO,
    CLASSIFICATION_JUSTICE,
    CLASSIFICATION_LEADERSHIP,
    CLASSIFICATION_POOL,
    CLASSIFICATION_PROTECTION,
    translateAspect,
    translateClassification,
} from '../index.js';

describe('aspect translations', () => {
    test('translates supported aspects to Spanish labels', () => {
        const translations = new Map([
            [CLASSIFICATION_AGGRESSION, 'Agresividad'],
            [CLASSIFICATION_JUSTICE, 'Justicia'],
            [CLASSIFICATION_LEADERSHIP, 'Liderazgo'],
            [CLASSIFICATION_PROTECTION, 'Protección'],
            [CLASSIFICATION_POOL, 'Masacrismo'],
        ]);

        translations.forEach((label, aspect) => {
            assert.equal(translateAspect(aspect), label);
        });
        assert.deepEqual(ASPECT_IDS, [...translations.keys()]);
    });

    test('translates basic cards as a classification, not as an aspect', () => {
        assert.equal(translateClassification(CLASSIFICATION_BASIC), 'Básica');
        assert.equal(translateAspect(CLASSIFICATION_BASIC), CLASSIFICATION_BASIC);
    });

    test('translates every value in a multi-classification', () => {
        assert.equal(
            translateClassification([
                CLASSIFICATION_HERO,
                CLASSIFICATION_AGGRESSION,
            ]),
            'Héroe, Agresividad',
        );
    });

    test('preserves labels for unknown aspects', () => {
        assert.equal(translateAspect('custom aspect'), 'custom aspect');
    });
});
