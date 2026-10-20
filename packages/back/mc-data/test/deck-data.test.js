import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';

import {
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_HERO,
    TARGET_DECK,
    TRAIT_SHIELD,
    getPlayerDeckCardCopyLimit,
} from 'mc-shared';
import basicUpgrades from '../seed/catalog/aspects/basic/upgrades.js';
import leadershipAllies from '../seed/catalog/aspects/leadership/allies.js';
import {MongoDataStore, parseRepositoryDeckSnapshot} from '../index.js';

const card = (id, aspect) => ({
    _id: id,
    aspect,
    order: Number(id.slice(-1)),
    card: {
        type: 'event',
        params: {
            name: `Carta ${id}`,
            image: `aspect/${id}.png`,
            unique: false,
        },
    },
});

const makeDeckStore = (additionalAspectCards = []) => {
    const aspectCards = Array.from({length: 8}, (_value, index) =>
        card(`justice-${index + 1}`, 'justice'));
    aspectCards.push(leadershipAllies[0], ...additionalAspectCards);
    aspectCards[0].card.params.cost = 2;
    aspectCards[0].card.params.resources = ['e', 'm'];
    aspectCards[0].card.params.traits = ['avenger', 'weapon'];
    aspectCards.push(card('basic-9', 'basic'));
    aspectCards.at(-1).card.params.maximum = {count: 1, target: TARGET_DECK};
    aspectCards.at(-1).card.params.traits = 'avenger';
    const hero = {
        _id: 'hero',
        name: 'Héroe',
        config: {
            sides: [
                {type: CARD_TYPE_ALTEREGO, params: {name: 'Identidad civil', unique: true}},
                {
                    type: CARD_TYPE_HERO,
                    params: {
                        name: 'Identidad heroica',
                        image: 'heroes/spiderman/peter0b.webp',
                        unique: true,
                    },
                },
            ],
            cards: [{
                count: 15,
                card: {
                    type: 'event',
                    params: {
                        name: 'Carta fija',
                        unique: false,
                        cost: 1,
                        resources: ['p'],
                    },
                },
            }],
            precon: [{
                aspect: 'justice',
                cardRefs: [{id: 'justice-1', count: 2}],
            }],
        },
    };
    const deck = {
        _id: 'deck-1',
        name: 'Mazo válido',
        heroId: 'hero',
        aspect: 'justice',
        cards: [
            ...Array.from({length: 8}, (_value, index) => ({
                id: `justice-${index + 1}`,
                count: 3,
            })),
            {id: 'basic-9', count: 1},
        ],
    };
    const otherDeck = {
        _id: 'deck-2',
        name: 'Otro mazo',
        heroId: 'other-hero',
        aspect: 'justice',
        cards: [{id: 'justice-1', count: 1}],
    };
    const decks = [deck, otherDeck];
    const collection = name => ({
        findOne: async query => {
            if (name === 'heroes' && query._id === hero._id) {
                return hero;
            }
            if (name === 'decks' && query._id === deck._id) {
                return deck;
            }
            return null;
        },
        find: query => {
            const records = name === 'heroes' ?
                [hero] :
                name === 'aspects' ?
                aspectCards.filter(record => !query._id?.$in ||
                    query._id.$in.includes(record._id)) :
                name === 'decks' ?
                    decks.filter(record =>
                        query.heroId === undefined || query.heroId === record.heroId) :
                    [];
            return {
                sort() {
                    return this;
                },
                toArray: async () => records,
            };
        },
    });
    const store = new MongoDataStore();
    store.database = {collection};

    return {store, deck};
};

test('catalog exposes fixed hero cards and custom deck config expands only saved references', async () => {
    const {store, deck} = makeDeckStore();
    const catalog = await store.getDeckEditorCatalog('hero');
    const [hero] = await store.getDeckHeroesList();
    const deckConfig = await store.getDeckConfig('deck-1', 'hero');
    const heroConfig = await store.getHeroConfig('hero');

    assert.equal(catalog.hero.baseCardCount, 15);
    assert.equal(catalog.hero.fixedCards[0].cost, 1);
    assert.deepEqual(catalog.hero.fixedCards[0].resources, ['p']);
    const aspectCard = catalog.cards.find(({id}) => id === 'justice-1');
    assert.equal(aspectCard.cost, 2);
    assert.deepEqual(aspectCard.traits, ['avenger', 'weapon']);
    assert.deepEqual(catalog.cards.find(({id}) => id === 'basic-9').traits, ['avenger']);
    assert.deepEqual(
        catalog.cards.find(({id}) => id === 'leadership-maria-hill').traits,
        [TRAIT_SHIELD],
    );
    assert.deepEqual(aspectCard.resources, ['e', 'm']);
    assert.deepEqual(catalog.cards.find(({id}) => id === 'basic-9').maximum, {
        count: 1,
        target: TARGET_DECK,
    });
    assert.equal(catalog.precon[0].id, 'justice-1');
    assert.deepEqual(hero, {
        id: 'hero',
        name: 'Héroe',
        image: 'heroes/spiderman/peter0b.webp',
    });
    assert.equal(heroConfig.aspect, 'justice');
    assert.equal(deckConfig.aspect, deck.aspect);
    assert.equal(deckConfig.cards.length, deck.cards.length);
    assert.deepEqual(deckConfig.cards[0], {
        count: 3,
        card: {
            type: 'event',
            params: {
                name: 'Carta justice-1',
                image: 'aspect/justice-1.png',
                unique: false,
                cost: 2,
                traits: ['avenger', 'weapon'],
                resources: ['e', 'm'],
            },
        },
    });
});

test('catalog marks El Hechicero Supremo as unique and limits it to one copy', async () => {
    const supremeSorcerer = basicUpgrades.find(({_id}) =>
        _id === 'basic-el-hechicero-supremo');
    assert.ok(supremeSorcerer);

    const {store} = makeDeckStore([supremeSorcerer]);
    const catalog = await store.getDeckEditorCatalog('hero');
    const cardFromCatalog = catalog.cards.find(({id}) => id === supremeSorcerer._id);

    assert.equal(cardFromCatalog.unique, true);
    assert.equal(getPlayerDeckCardCopyLimit({
        aspect: 'justice',
        cards: [],
    }, catalog, cardFromCatalog.id), 1);
});

test('lists custom decks across heroes when no hero filter is provided', async () => {
    const {store} = makeDeckStore();
    const allDecks = await store.getDecksList();
    const heroDecks = await store.getDecksList('hero');

    assert.deepEqual(allDecks.map(({id}) => id), ['deck-1', 'deck-2']);
    assert.deepEqual(heroDecks.map(({id}) => id), ['deck-1']);
});

test('writes the merged deck backup to a physical snapshot file', async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'mc-data-deck-backup-'));
    const snapshotPath = join(temporaryDirectory, 'decks.json');
    const localDecks = [
        {
            _id: 'shared',
            name: 'Versión local reciente',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
        },
        {
            _id: 'local-only',
            name: 'Solo local',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {_id: 'deleted', deletedAt: '2026-01-04T00:00:00.000Z'},
    ];
    const collection = {
        find: () => ({
            sort() {
                return this;
            },
            toArray: async () => localDecks,
        }),
    };
    const store = new MongoDataStore();
    store.database = {collection: () => collection};

    try {
        const result = await store.saveRepositoryDeckSnapshot({
            decks: [
                {
                    id: 'shared',
                    name: 'Versión del repositorio antigua',
                    heroId: 'hero',
                    aspect: 'justice',
                    cards: [],
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-02T00:00:00.000Z',
                },
                {
                    id: 'repository-only',
                    name: 'Solo repositorio',
                    heroId: 'hero',
                    aspect: 'justice',
                    cards: [],
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            deletions: [],
        }, snapshotPath);
        const savedSnapshot = parseRepositoryDeckSnapshot(
            await readFile(snapshotPath, 'utf8'),
        );

        assert.deepEqual(result, {decks: 3, deletions: 1});
        assert.deepEqual(savedSnapshot.decks.map(({id, name}) => ({id, name})), [
            {id: 'local-only', name: 'Solo local'},
            {id: 'repository-only', name: 'Solo repositorio'},
            {id: 'shared', name: 'Versión local reciente'},
        ]);
        assert.deepEqual(savedSnapshot.deletions, [{
            id: 'deleted',
            deletedAt: '2026-01-04T00:00:00.000Z',
        }]);
    } finally {
        await rm(temporaryDirectory, {recursive: true, force: true});
    }
});

test('restores repository deck versions only when they are the latest', async () => {
    const localDecks = [
        {
            _id: 'shared-newer-repo',
            name: 'Local antigua',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
        },
        {
            _id: 'shared-newer-local',
            name: 'Local reciente',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-04T00:00:00.000Z',
        },
        {
            _id: 'local-only',
            name: 'Solo local',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
            _id: 'repo-deleted',
            name: 'Borrado local antiguo',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
        },
    ];
    const replacements = [];
    const collection = {
        find: () => ({
            sort() {
                return this;
            },
            toArray: async () => localDecks,
        }),
        replaceOne: async (filter, replacement, options) => {
            replacements.push({filter, replacement, options});
        },
    };
    const store = new MongoDataStore();
    store.database = {collection: () => collection};

    const result = await store.restoreRepositoryDecks({
        decks: [
            {
                id: 'shared-newer-repo',
                name: 'Repo reciente',
                heroId: 'hero',
                aspect: 'justice',
                cards: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-03T00:00:00.000Z',
            },
            {
                id: 'shared-newer-local',
                name: 'Repo antigua',
                heroId: 'hero',
                aspect: 'justice',
                cards: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-03T00:00:00.000Z',
            },
            {
                id: 'repo-only',
                name: 'Solo repo',
                heroId: 'hero',
                aspect: 'justice',
                cards: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
            },
        ],
        deletions: [{id: 'repo-deleted', deletedAt: '2026-01-03T00:00:00.000Z'}],
    });

    assert.deepEqual(result, {total: 4, restored: 2, deleted: 1, keptLocal: 1});
    assert.deepEqual(replacements.map(({filter, replacement, options}) => ({
        id: filter._id,
        replacement: {
            name: replacement.name,
            deletedAt: replacement.deletedAt,
        },
        options,
    })), [
        {
            id: 'shared-newer-repo',
            replacement: {name: 'Repo reciente', deletedAt: undefined},
            options: {upsert: true},
        },
        {
            id: 'repo-only',
            replacement: {name: 'Solo repo', deletedAt: undefined},
            options: {upsert: true},
        },
        {
            id: 'repo-deleted',
            replacement: {name: undefined, deletedAt: '2026-01-03T00:00:00.000Z'},
            options: {upsert: true},
        },
    ]);
    assert.equal(replacements.some(({filter}) => filter._id === 'local-only'), false);
});

test('deletes decks with a tombstone and excludes them from reads', async () => {
    let storedDeck = {
        _id: 'deck-to-delete',
        name: 'Mazo',
        heroId: 'hero',
        aspect: 'justice',
        cards: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
    };
    let listFilter;
    const collection = {
        findOne: async ({_id}) => _id === storedDeck._id ? storedDeck : null,
        updateOne: async (filter, update) => {
            assert.equal(filter._id, storedDeck._id);
            assert.equal(filter.updatedAt, storedDeck.updatedAt);
            storedDeck = {...storedDeck, ...update.$set};
            return {modifiedCount: 1};
        },
        find: filter => {
            listFilter = filter;
            return {
                sort() {
                    return this;
                },
                toArray: async () => storedDeck.deletedAt ? [] : [storedDeck],
            };
        },
    };
    const store = new MongoDataStore();
    store.database = {collection: () => collection};

    assert.equal(await store.deleteDeck('deck-to-delete'), true);
    assert.ok(Date.parse(storedDeck.deletedAt) > Date.parse(storedDeck.updatedAt));
    assert.equal(await store.getDeck('deck-to-delete'), null);
    assert.deepEqual(await store.getDecksList(), []);
    assert.deepEqual(listFilter, {deletedAt: {$exists: false}});
});

test('custom deck config rejects another hero and illegal saved drafts', async () => {
    const {store, deck} = makeDeckStore();
    deck.cards = [{id: 'justice-1', count: 1}];

    await assert.rejects(store.getDeckConfig('deck-1', 'other-hero'), {
        statusCode: 400,
    });
    await assert.rejects(store.getDeckConfig('deck-1', 'hero'), error =>
        error.statusCode === 400 && error.message.includes('al menos 40 cartas'));
});
