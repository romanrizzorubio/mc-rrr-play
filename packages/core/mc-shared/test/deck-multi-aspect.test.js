import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ASPECT_IDS,
    CLASSIFICATION_BASIC,
    translateAspect,
} from '../index.js';
import {
    getPlayerDeckCardCopyLimit,
    getSelectedDeckAspects,
    validatePlayerDeck,
} from '../utils/deck-rules.js';

const createCatalog = () => {
    const aspectCards = ['aggression', 'justice'].flatMap(aspect =>
        Array.from({length: 5}, (_value, index) => ({
            id: `${aspect}-${index + 1}`,
            name: `${aspect} card ${index + 1}`,
            aspect,
            unique: false,
        })));

    return {
        hero: {
            name: 'Spiderwoman',
            baseCardCount: 15,
            deckBuildingRules: {
                aspectCount: 2,
                equalAspectCardCounts: true,
            },
            identities: [],
            fixedCards: [],
        },
        aspects: [
            {id: 'aggression'},
            {id: 'justice'},
            {id: 'leadership'},
        ],
        cards: [
            ...aspectCards,
            {
                id: 'basic-1',
                name: 'Basic card 1',
                classification: CLASSIFICATION_BASIC,
                unique: false,
            },
            {
                id: 'basic-2',
                name: 'Basic card 2',
                classification: CLASSIFICATION_BASIC,
                unique: false,
            },
            {id: 'leadership-1', name: 'Leadership card', aspect: 'leadership', unique: false},
        ],
    };
};

const createBalancedDeck = () => ({
    aspect: ['aggression', 'justice'],
    cards: [
        ...Array.from({length: 5}, (_value, index) => ({
            id: `aggression-${index + 1}`,
            count: 2,
        })),
        ...Array.from({length: 5}, (_value, index) => ({
            id: `justice-${index + 1}`,
            count: 2,
        })),
        {id: 'basic-1', count: 3},
        {id: 'basic-2', count: 2},
    ],
});

describe('multi-aspect deck rules', () => {
    test('supports single or array aspect values and central aspect identifiers', () => {
        assert.deepEqual(getSelectedDeckAspects({aspect: 'justice'}), ['justice']);
        assert.deepEqual(
            getSelectedDeckAspects({aspect: ['aggression', 'justice']}),
            ['aggression', 'justice'],
        );
        assert.deepEqual(getSelectedDeckAspects({aspect: []}), []);
        assert.deepEqual(ASPECT_IDS, [
            'aggression',
            'justice',
            'leadership',
            'protection',
            'pool',
        ]);
        assert.equal(
            translateAspect(['aggression', 'justice']),
            'Agresividad, Justicia',
        );
    });

    test('allows cards from either selected aspect and rejects unselected aspects', () => {
        const catalog = createCatalog();
        const deck = createBalancedDeck();

        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'aggression-1'), 3);
        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'justice-1'), 3);
        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'leadership-1'), 0);
        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'basic-1'), 3);
    });

    test('requires the configured aspect count and equal aspect-card totals', () => {
        const catalog = createCatalog();
        const balanced = validatePlayerDeck(createBalancedDeck(), catalog);

        assert.equal(balanced.legal, true);
        assert.equal(balanced.size, 40);

        const unbalancedDeck = createBalancedDeck();
        unbalancedDeck.cards = unbalancedDeck.cards.map(entry => {
            if (entry.id === 'justice-1') {
                return {...entry, count: 1};
            }
            if (entry.id === 'basic-2') {
                return {...entry, count: 3};
            }

            return entry;
        });
        const unbalanced = validatePlayerDeck(unbalancedDeck, catalog);
        assert.equal(unbalanced.legal, false);
        assert.ok(unbalanced.errors.some(error =>
            error.includes('misma cantidad de cartas de cada aspecto')));
        assert.ok(unbalanced.errors.some(error =>
            error.includes('Agresividad: 10, Justicia: 9')));

        const singleAspect = validatePlayerDeck({
            ...createBalancedDeck(),
            aspect: ['aggression'],
        }, catalog);
        assert.ok(singleAspect.errors.includes(
            'Elige exactamente 2 aspectos para el mazo.',
        ));
    });

    test('rejects duplicate aspect selections', () => {
        const deck = {
            ...createBalancedDeck(),
            aspect: ['aggression', 'aggression'],
        };
        const result = validatePlayerDeck(deck, createCatalog());

        assert.ok(result.errors.includes(
            'No puedes seleccionar el mismo aspecto más de una vez.',
        ));
    });
});
