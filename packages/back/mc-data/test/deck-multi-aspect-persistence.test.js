import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
} from 'mc-shared';
import {
    MongoDataStore,
    parseRepositoryDeckSnapshot,
    serializeRepositoryDeckSnapshot,
} from '../index.js';
import {normalizeCatalog} from '../seed/normalize.js';

const multiAspectDeck = () => ({
    id: 'spiderwoman-deck',
    name: 'Mazo de Spiderwoman',
    heroId: 'spiderwoman',
    aspect: ['aggression', 'justice'],
    cards: [{id: 'aggression-card', count: 2}],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
});

describe('multi-aspect deck persistence', () => {
    test('normalizes basic precon groups without treating basic as an aspect', () => {
        const catalog = normalizeCatalog({
            aspects: [
                {
                    _id: 'basic-energy',
                    classification: CLASSIFICATION_BASIC,
                    order: 0,
                    card: {type: 'resource', params: {}},
                },
                {
                    _id: 'justice-card',
                    aspect: 'justice',
                    order: 0,
                    card: {type: 'event', params: {}},
                },
            ],
            heroes: [{
                _id: 'hero',
                config: {
                    sides: [],
                    cards: [],
                    precon: [
                        {
                            classification: CLASSIFICATION_BASIC,
                            cardRefs: [{id: 'basic-energy', count: 1}],
                        },
                        {
                            aspect: 'justice',
                            cardRefs: [{id: 'justice-card', count: 1}],
                        },
                        {
                            aspect: CLASSIFICATION_BASIC,
                            cardRefs: [{id: 'basic-energy', count: 1}],
                        },
                    ],
                    nemesis: [],
                },
            }],
            scenarios: [],
            sets: [],
        });

        assert.deepEqual(catalog.heroes[0].config.precon, [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [{id: 'basic-energy', count: 1}],
            },
            {
                aspect: 'justice',
                cardRefs: [{id: 'justice-card', count: 1}],
            },
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [{id: 'basic-energy', count: 1}],
            },
        ]);
    });

    test('exposes hero deckbuilding rules to the deck editor catalog', async () => {
        const hero = {
            _id: 'spiderwoman',
            name: 'Spiderwoman',
            config: {
                deckBuildingRules: {
                    aspectCount: 2,
                    equalAspectCardCounts: true,
                },
                cards: [{
                    count: 2,
                    card: {
                        type: 'event',
                        params: {
                            name: 'Rayo venenoso',
                            classification: [
                                CLASSIFICATION_HERO,
                                CLASSIFICATION_AGGRESSION,
                            ],
                        },
                    },
                }],
                precon: [],
                sides: [
                    {type: 'hero', params: {name: 'Spiderwoman'}},
                    {type: 'alter-ego', params: {name: 'Jessica Drew'}},
                ],
            },
        };
        const store = new MongoDataStore();
        store.database = {
            collection: name => ({
                findOne: async () => name === 'heroes' ? hero : null,
                find: () => ({
                    sort() {
                        return this;
                    },
                    toArray: async () => [],
                }),
            }),
        };

        const catalog = await store.getDeckEditorCatalog('spiderwoman');

        assert.deepEqual(catalog.hero.deckBuildingRules, {
            aspectCount: 2,
            equalAspectCardCounts: true,
        });
        assert.deepEqual(catalog.hero.fixedCards[0].classification, [
            CLASSIFICATION_HERO,
            CLASSIFICATION_AGGRESSION,
        ]);
    });

    test('exposes basic cards as a classification separate from aspects', async () => {
        const hero = {
            _id: 'spiderwoman',
            name: 'Spiderwoman',
            config: {
                cards: [],
                precon: [],
                sides: [],
            },
        };
        const basicCard = {
            _id: 'basic-energy',
            classification: CLASSIFICATION_BASIC,
            order: 0,
            card: {
                type: 'resource',
                params: {
                    name: 'Energía',
                    classification: CLASSIFICATION_BASIC,
                },
            },
        };
        const store = new MongoDataStore();
        store.database = {
            collection: name => ({
                findOne: async () => name === 'heroes' ? hero : null,
                find: () => ({
                    sort() {
                        return this;
                    },
                    toArray: async () => [basicCard],
                }),
            }),
        };

        const catalog = await store.getDeckEditorCatalog('spiderwoman');

        assert.deepEqual(catalog.aspects, []);
        assert.equal(catalog.cards[0].classification, CLASSIFICATION_BASIC);
        assert.equal(Object.hasOwn(catalog.cards[0], 'aspect'), false);
    });

    test('loads basic precon references using their classification', async () => {
        const cardRecords = [
            {
                _id: 'basic-energy',
                classification: CLASSIFICATION_BASIC,
                card: {
                    type: 'resource',
                    params: {name: 'Energía'},
                },
            },
            {
                _id: 'justice-card',
                aspect: 'justice',
                card: {
                    type: 'event',
                    params: {name: 'Justicia'},
                },
            },
        ];
        const hero = {
            _id: 'spiderwoman',
            name: 'Spiderwoman',
            config: {
                precon: [
                    {
                        classification: CLASSIFICATION_BASIC,
                        cardRefs: [{id: 'basic-energy', count: 1}],
                    },
                    {
                        aspect: 'justice',
                        cardRefs: [{id: 'justice-card', count: 1}],
                    },
                ],
            },
        };
        const queries = [];
        const store = new MongoDataStore();
        store.database = {
            collection: name => ({
                findOne: async () => name === 'heroes' ? hero : null,
                find: query => ({
                    toArray: async () => {
                        queries.push(query);

                        return cardRecords.filter(({_id}) =>
                            query._id.$in.includes(_id));
                    },
                }),
            }),
        };

        const config = await store.getHeroConfig('spiderwoman');

        assert.equal(config.aspect, 'justice');
        assert.deepEqual(queries[0].$or, [
            {classification: CLASSIFICATION_BASIC},
            {aspect: CLASSIFICATION_BASIC},
        ]);
        assert.equal(queries[1].aspect, 'justice');
        assert.deepEqual(config.precon.map(({count, card}) => [
            card.params.name,
            count,
        ]), [
            ['Energía', 1],
            ['Justicia', 1],
        ]);
    });

    test('stores one aspect field in repository deck snapshots', () => {
        const snapshot = {
            decks: [multiAspectDeck()],
            deletions: [],
        };
        const serialized = serializeRepositoryDeckSnapshot(snapshot);

        assert.deepEqual(parseRepositoryDeckSnapshot(serialized), snapshot);
        assert.equal(serialized.includes('"aspects"'), false);
    });

    test('stores an aspect array without a second deck field', async () => {
        let persistedDeck;
        const store = new MongoDataStore();
        store.database = {
            collection: () => ({
                replaceOne: async (_query, deck) => {
                    persistedDeck = deck;
                },
            }),
        };

        const savedDeck = await store.saveDeck({
            name: 'Mazo de Spiderwoman',
            heroId: 'spiderwoman',
            aspect: ['aggression', 'justice'],
            cards: [{id: 'aggression-card', count: 2}],
        });

        assert.deepEqual(savedDeck.aspect, ['aggression', 'justice']);
        assert.deepEqual(persistedDeck.aspect, ['aggression', 'justice']);
        assert.equal(Object.hasOwn(savedDeck, 'aspects'), false);
        assert.equal(Object.hasOwn(persistedDeck, 'aspects'), false);
    });

    test('passes the aspect array into player deck configuration', async () => {
        const aspectCards = ['aggression', 'justice'].flatMap(aspect =>
            Array.from({length: 8}, (_value, index) => ({
                _id: `${aspect}-${index + 1}`,
                aspect,
                order: index,
                card: {
                    type: 'event',
                    params: {
                        name: `${aspect} card ${index + 1}`,
                        unique: false,
                    },
                },
            })));
        const deck = {
            _id: 'spiderwoman-deck',
            name: 'Mazo de Spiderwoman',
            heroId: 'spiderwoman',
            aspect: ['aggression', 'justice'],
            cards: aspectCards.map(({_id}) => ({id: _id, count: 3})),
        };
        const hero = {
            _id: 'spiderwoman',
            name: 'Spiderwoman',
            config: {
                deckBuildingRules: {
                    aspectCount: 2,
                    equalAspectCardCounts: true,
                },
                cards: [],
                precon: [],
                sides: [
                    {type: 'hero', params: {name: 'Spiderwoman'}},
                    {type: 'alter-ego', params: {name: 'Jessica Drew'}},
                ],
            },
        };
        const store = new MongoDataStore();
        store.database = {
            collection: name => ({
                findOne: async ({_id}) =>
                    name === 'decks' && _id === deck._id ? deck :
                        name === 'heroes' && _id === hero._id ? hero : null,
                find: query => ({
                    sort() {
                        return this;
                    },
                    toArray: async () => name === 'aspects' ?
                        aspectCards.filter(({_id}) =>
                            !query._id?.$in || query._id.$in.includes(_id)) :
                        [],
                }),
            }),
        };

        const deckConfig = await store.getDeckConfig(deck._id, hero._id);

        assert.deepEqual(deckConfig.aspect, ['aggression', 'justice']);
        assert.equal(
            deckConfig.cards.reduce((total, entry) => total + entry.count, 0),
            48,
        );
        assert.equal(Object.hasOwn(deckConfig, 'aspects'), false);
    });

    test('normalizes a legacy deck aspect list when reading it', async () => {
        const store = new MongoDataStore();
        store.database = {
            collection: () => ({
                findOne: async () => ({
                    _id: 'legacy-deck',
                    name: 'Mazo legado',
                    heroId: 'spiderwoman',
                    aspect: 'aggression',
                    aspects: ['aggression', 'justice'],
                    cards: [],
                }),
            }),
        };

        const deck = await store.getDeck('legacy-deck');

        assert.deepEqual(deck.aspect, ['aggression', 'justice']);
        assert.equal(Object.hasOwn(deck, 'aspects'), false);
    });

    test('normalizes legacy aspect lists from repository snapshots', () => {
        const legacyDeck = {
            ...multiAspectDeck(),
            aspect: 'aggression',
            aspects: ['aggression', 'justice'],
        };
        const snapshot = parseRepositoryDeckSnapshot(JSON.stringify({
            version: 1,
            decks: [legacyDeck],
            deletions: [],
        }));

        assert.deepEqual(snapshot.decks[0].aspect, ['aggression', 'justice']);
        assert.equal(Object.hasOwn(snapshot.decks[0], 'aspects'), false);
    });
});
