import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {ENDPOINTS} from 'mc-endpoints';
import {CLASSIFICATION_BASIC} from 'mc-shared';
import {createDeckServiceApp} from '../src/deck-service-app.js';

const createCatalog = () => ({
    hero: {
        id: 'spiderwoman',
        name: 'Spiderwoman',
        baseCardCount: 0,
        deckBuildingRules: {
            aspectCount: 2,
            equalAspectCardCounts: true,
        },
        fixedCards: [],
        identities: [],
    },
    aspects: [{id: 'aggression'}, {id: 'justice'}],
    cards: [
        ...['aggression', 'justice'].flatMap(aspect =>
            Array.from({length: 6}, (_value, index) => ({
                id: `${aspect}-${index + 1}`,
                name: `${aspect} card ${index + 1}`,
                aspect,
                unique: false,
                permanent: false,
            }))),
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
    ],
});

const createBalancedCards = () => [
    ...['aggression', 'justice'].flatMap(aspect =>
        Array.from({length: 6}, (_value, index) => ({
            id: `${aspect}-${index + 1}`,
            count: 3,
        }))),
    {id: 'basic-1', count: 3},
    {id: 'basic-2', count: 1},
];

const createData = catalog => {
    const decks = new Map();
    let deckSequence = 0;

    return {
        decks,
        getDeckEditorCatalog: async heroId =>
            heroId === catalog.hero.id ? catalog : null,
        getDecksList: async heroId => [...decks.values()]
            .filter(deck => heroId === undefined || deck.heroId === heroId),
        getDeck: async id => decks.get(id) || null,
        saveDeck: async deck => {
            const savedDeck = {
                ...deck,
                id: deck.id || `spiderwoman-deck-${++deckSequence}`,
            };
            decks.set(savedDeck.id, savedDeck);

            return savedDeck;
        },
    };
};

const listen = async app => {
    const server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });

    return {
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        }),
    };
};

describe('multi-aspect deck service', () => {
    test('persists selected aspects and excludes unbalanced decks from match selection', async () => {
        const catalog = createCatalog();
        const data = createData(catalog);
        const service = await listen(createDeckServiceApp({data}));

        try {
            const legalResponse = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: 'Mazo de Spiderwoman',
                    heroId: 'spiderwoman',
                    aspect: ['aggression', 'justice'],
                    cards: createBalancedCards(),
                }),
            });
            const legalDeck = await legalResponse.json();

            assert.equal(legalResponse.status, 201);
            assert.equal(legalDeck.validation.legal, true);
            assert.deepEqual(legalDeck.aspect, ['aggression', 'justice']);
            assert.equal(Object.hasOwn(legalDeck, 'aspects'), false);
            assert.deepEqual(
                data.decks.get(legalDeck.id).aspect,
                ['aggression', 'justice'],
            );

            const unbalancedCards = createBalancedCards().map(entry => {
                if (entry.id === 'justice-1') {
                    return {...entry, count: 2};
                }
                if (entry.id === 'basic-2') {
                    return {...entry, count: 2};
                }

                return entry;
            });
            const draftResponse = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: 'Borrador desequilibrado',
                    heroId: 'spiderwoman',
                    aspect: ['aggression', 'justice'],
                    cards: unbalancedCards,
                }),
            });
            const draft = await draftResponse.json();
            const legalDecksResponse = await fetch(
                `${service.url}${ENDPOINTS.DECK.LIST}?hero=spiderwoman&legal=true`,
            );

            assert.equal(draftResponse.status, 201);
            assert.equal(draft.validation.legal, false);
            assert.ok(draft.validation.errors.some(error =>
                error.includes('misma cantidad de cartas de cada aspecto')));
            assert.deepEqual(
                (await legalDecksResponse.json()).map(deck => deck.id),
                [legalDeck.id],
            );
        } finally {
            await service.close();
        }
    });

    test('rejects malformed aspect values in save requests', async () => {
        const data = createData(createCatalog());
        const service = await listen(createDeckServiceApp({data}));

        try {
            const response = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: 'Mazo inválido',
                    heroId: 'spiderwoman',
                    aspect: ['aggression', 2],
                    cards: createBalancedCards(),
                }),
            });
            const result = await response.json();

            assert.equal(response.status, 400);
            assert.equal(
                result.error.message,
                'El aspecto del mazo debe ser un nombre o una lista de nombres.',
            );
        } finally {
            await service.close();
        }
    });

    test('does not accept multiple aspects for a single-aspect hero', async () => {
        const catalog = createCatalog();
        delete catalog.hero.deckBuildingRules;
        const data = createData(catalog);
        const service = await listen(createDeckServiceApp({data}));

        try {
            const response = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: 'Mazo de un aspecto',
                    heroId: 'spiderwoman',
                    aspect: ['aggression', 'justice'],
                    cards: createBalancedCards(),
                }),
            });
            const result = await response.json();

            assert.equal(response.status, 400);
            assert.equal(
                result.error.message,
                'Este superhéroe solo puede seleccionar un aspecto.',
            );
        } finally {
            await service.close();
        }
    });
});
