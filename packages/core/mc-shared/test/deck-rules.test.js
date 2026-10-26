import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
} from '../index.js';
import {
    getPlayerDeckCardCopyLimit,
    validatePlayerDeck,
} from '../utils/deck-rules.js';
import {TARGET_DECK, TARGET_PLAYER} from '../constants/targets.js';

const createCatalog = () => ({
    hero: {
        name: 'Spider-Man',
        baseCardCount: 15,
        identities: [{
            name: 'Peter Parker',
            relatedNames: ['Spider-Man'],
            unique: true,
        }],
        fixedCards: [],
    },
    aspects: [{id: 'justice'}],
    cards: [
        {id: 'event-1', name: 'Evento', aspect: 'justice', unique: false},
        {id: 'event-2', name: 'Evento', aspect: 'justice', unique: false},
        {id: 'ally', name: 'Aliado único', aspect: 'justice', unique: true},
        {id: 'hero-identity', name: 'Spider-Man', aspect: 'justice', unique: true},
        {
            id: 'basic',
            name: 'Básica',
            classification: CLASSIFICATION_BASIC,
            unique: false,
        },
        {
            id: 'basic-resource',
            name: 'Energía',
            classification: CLASSIFICATION_BASIC,
            type: 'resource',
            unique: false,
            maximum: {count: 1, target: TARGET_DECK},
        },
        {
            id: 'basic-resource-reprint',
            name: 'Energía',
            classification: CLASSIFICATION_BASIC,
            type: 'resource',
            unique: false,
            maximum: {count: 1, target: TARGET_DECK},
        },
        {
            id: 'deck-limited-event',
            name: 'Evento limitado',
            aspect: 'justice',
            unique: false,
            maximum: {count: 1, target: TARGET_DECK},
        },
        {
            id: 'deck-limited-event-reprint',
            name: 'Evento limitado',
            aspect: 'justice',
            unique: false,
            maximum: {count: 1, target: TARGET_DECK},
        },
        {
            id: 'player-limited-event',
            name: 'Evento limitado en juego',
            aspect: 'justice',
            unique: false,
            maximum: {count: 1, target: TARGET_PLAYER},
        },
        {id: 'aggression', name: 'Agresividad', aspect: 'aggression', unique: false},
    ],
});

describe('deck rules', () => {
    test('copy limit combines different cards with the same title', () => {
        const catalog = createCatalog();
        const deck = {
            aspect: 'justice',
            cards: [{id: 'event-2', count: 2}],
        };

        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'event-1'), 1);
        assert.equal(
            validatePlayerDeck({...deck, cards: [...deck.cards, {id: 'event-1', count: 2}]}, catalog)
                .errors.some(error => error.includes('más de 3 copias')),
            true,
        );
    });

    test('copy limits follow each card deck maximum, deck size, uniqueness, and aspect', () => {
        const catalog = createCatalog();
        const fillerCards = Array.from({length: 12}, (_value, index) => ({
            id: `filler-${index + 1}`,
            name: `Básica ${index + 1}`,
            classification: CLASSIFICATION_BASIC,
            unique: false,
        }));
        catalog.cards.push(...fillerCards);
        const deckAt49Cards = {
            aspect: 'justice',
            cards: [
                ...fillerCards.slice(0, 11).map(({id}) => ({id, count: 3})),
                {id: fillerCards[11].id, count: 1},
            ],
        };

        assert.equal(getPlayerDeckCardCopyLimit(deckAt49Cards, catalog, 'event-2'), 1);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'event-1',
        ), 3);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'ally',
        ), 1);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'hero-identity',
        ), 0);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'aggression',
        ), 0);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'basic-resource',
        ), 1);
        assert.equal(getPlayerDeckCardCopyLimit(
            {
                aspect: 'justice',
                cards: [{id: 'basic-resource', count: 1}],
            },
            catalog,
            'basic-resource-reprint',
        ), 0);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'deck-limited-event',
        ), 1);
        assert.equal(getPlayerDeckCardCopyLimit(
            {
                aspect: 'justice',
                cards: [{id: 'deck-limited-event', count: 1}],
            },
            catalog,
            'deck-limited-event-reprint',
        ), 0);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'player-limited-event',
        ), 3);
        assert.equal(getPlayerDeckCardCopyLimit(
            {aspect: 'justice', cards: []},
            catalog,
            'basic',
        ), 3);
        assert.equal(
            validatePlayerDeck({
                aspect: 'justice',
                cards: [
                    {id: 'deck-limited-event', count: 1},
                    {id: 'deck-limited-event-reprint', count: 1},
                ],
            }, catalog).errors.some(error => error.includes('más de 1 copia')),
            true,
        );
        assert.equal(
            validatePlayerDeck({
                aspect: 'justice',
                cards: [{id: 'basic', count: 3}],
            }, catalog).errors.some(error => error.includes('copias de "Básica"')),
            false,
        );
    });

    test('allows copy limits for all aspects while a new deck has no aspect selected', () => {
        const catalog = createCatalog();
        catalog.aspects.push({id: 'aggression'});
        const deck = {aspect: '', cards: []};

        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'event-1'), 3);
        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'aggression'), 3);
        assert.equal(getPlayerDeckCardCopyLimit(deck, catalog, 'basic'), 3);
        assert.equal(validatePlayerDeck({
            ...deck,
            cards: [{id: 'event-1', count: 1}],
        }, catalog).errors.includes('Elige exactamente un aspecto para el mazo.'), true);
    });

    test('recognizes aspect cards that also have a hero classification', () => {
        const catalog = createCatalog();
        catalog.aspects.push({id: 'aggression'});
        catalog.cards.push({
            id: 'hero-aggression',
            name: 'Rayo venenoso',
            classification: [CLASSIFICATION_HERO, CLASSIFICATION_AGGRESSION],
            aspect: 'aggression',
            unique: false,
        });

        assert.equal(getPlayerDeckCardCopyLimit({
            aspect: ['aggression', 'justice'],
            cards: [],
        }, catalog, 'hero-aggression'), 3);
    });
});
