import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
} from 'mc-shared';
import {
    getCardCategoryClass,
    getCardOriginName,
    getDeckComposition,
    getDeckAspectClass,
    getDeckAspectGradient,
    getDeckAspectName,
    matchesDeckAspectFilter,
} from '../src/utils/deck-presentation.js';

describe('multi-aspect deck presentation', () => {
    test('shows every selected aspect while retaining the primary aspect color', () => {
        const deck = {aspect: ['aggression', 'justice']};

        assert.equal(getDeckAspectName(deck), 'Agresividad, Justicia');
        assert.equal(getDeckAspectClass(deck), 'aspect-aggression');
        assert.equal(
            getDeckAspectGradient(deck),
            'linear-gradient(90deg, var(--deck-aspect-aggression-color), var(--deck-aspect-justice-color))',
        );
        assert.equal(getDeckAspectGradient({aspect: 'justice'}), '');
        assert.equal(
            getDeckAspectGradient({aspect: ['aggression', 'justice', 'protection']}),
            'linear-gradient(90deg, var(--deck-aspect-aggression-color), var(--deck-aspect-justice-color), var(--deck-aspect-protection-color))',
        );
        assert.equal(
            getCardOriginName({classification: CLASSIFICATION_BASIC}),
            'Básica',
        );
        assert.equal(
            getCardCategoryClass({classification: CLASSIFICATION_BASIC}),
            'card-basic',
        );
    });

    test('supports a single aspect and filters cards by either selected aspect', () => {
        assert.equal(getDeckAspectName({aspect: 'justice'}), 'Justicia');
        assert.equal(
            matchesDeckAspectFilter(
                {aspect: 'justice'},
                'deck',
                ['aggression', 'justice'],
            ),
            true,
        );
        assert.equal(
            matchesDeckAspectFilter(
                {aspect: 'justice'},
                'justice',
                ['aggression', 'justice'],
            ),
            true,
        );
        assert.equal(
            matchesDeckAspectFilter(
                {aspect: 'aggression'},
                'justice',
                ['aggression', 'justice'],
            ),
            false,
        );
        assert.equal(
            matchesDeckAspectFilter(
                {aspect: 'leadership'},
                'deck',
                ['aggression', 'justice'],
            ),
            false,
        );
        assert.equal(matchesDeckAspectFilter(
            {classification: CLASSIFICATION_BASIC},
            'basic',
            [],
        ), true);
        assert.equal(matchesDeckAspectFilter({
            classification: [CLASSIFICATION_HERO, CLASSIFICATION_AGGRESSION],
            aspect: 'aggression',
        }, 'deck', ['aggression']), true);
        assert.equal(matchesDeckAspectFilter({aspect: 'justice'}, 'basic', []), false);
    });

    test('shows both classifications on a fixed hero card', () => {
        const card = {
            fixed: true,
            classification: [CLASSIFICATION_HERO, CLASSIFICATION_AGGRESSION],
        };

        assert.equal(getCardOriginName(card), 'Héroe, Agresividad');
        assert.equal(getCardCategoryClass(card), 'aspect-aggression');
    });

    test('counts deck origins and lists permanent cards separately', () => {
        assert.deepEqual(getDeckComposition([
            {fixed: true, count: 15},
            {fixed: true, permanent: true, count: 1},
            {classification: CLASSIFICATION_BASIC, count: 3},
            {classification: CLASSIFICATION_BASIC, permanent: true, count: 1},
            {aspect: 'aggression', count: 2},
            {aspect: 'justice', count: 4},
            {aspect: 'justice', permanent: true, count: 1},
        ], ['aggression', 'justice', 'protection']), [
            {label: 'Héroe', count: 15},
            {label: 'Básicas', count: 3},
            {label: 'Agresividad', count: 2},
            {label: 'Justicia', count: 4},
            {label: 'Permanentes', count: 3},
        ]);
    });

    test('omits empty groups from the deck composition', () => {
        assert.deepEqual(getDeckComposition([], ['aggression', 'justice']), []);
    });
});
