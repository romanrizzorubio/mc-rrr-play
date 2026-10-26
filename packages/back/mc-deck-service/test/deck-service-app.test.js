import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, test} from 'node:test';

import {ENDPOINTS} from 'mc-endpoints';
import {CLASSIFICATION_BASIC, TARGET_DECK} from 'mc-shared';
import {createDeckServiceApp} from '../src/deck-service-app.js';

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

const createCatalog = (heroId = 'hero', heroName = 'Héroe') => ({
    hero: {
        id: heroId,
        name: heroName,
        image: 'heroes/hero.png',
        baseCardCount: 15,
        fixedCards: [],
        identities: [],
    },
    aspects: [{id: 'justice'}],
    cards: Array.from({length: 12}, (_value, index) => ({
        id: `card-${index + 1}`,
        name: `Carta ${index + 1}`,
        ...(index >= 8 ?
            {classification: CLASSIFICATION_BASIC} :
            {aspect: 'justice'}),
        type: 'event',
        unique: false,
        permanent: false,
    })),
    precon: [{id: 'card-1', count: 1}],
});

const createLegalCardList = () => [
    ...Array.from({length: 8}, (_value, index) => ({
        id: `card-${index + 1}`,
        count: 3,
    })),
    {id: 'card-9', count: 1},
];

const createData = (catalog, ...otherCatalogs) => {
    const decks = new Map();
    const catalogs = new Map([catalog, ...otherCatalogs]
        .map(item => [item.hero.id, item]));
    let deckSequence = 0;

    return {
        decks,
        getDeckHeroesList: async () => [...catalogs.values()].map(({hero}) => ({
            id: hero.id,
            name: hero.name,
            image: hero.image,
        })),
        getDeckEditorCatalog: async heroId => catalogs.get(heroId) || null,
        getDecksList: async heroId => [...decks.values()]
            .filter(deck => heroId === undefined || deck.heroId === heroId),
        getDeck: async id => decks.get(id) || null,
        saveDeck: async deck => {
            const id = deck.id || `deck-${++deckSequence}`;
            const savedDeck = {...deck, id};
            decks.set(id, savedDeck);
            return savedDeck;
        },
        deleteDeck: async id => decks.delete(id),
    };
};

describe('deck service app', () => {
test('lists heroes with their face image for deck creation', async () => {
    const service = await listen(createDeckServiceApp({data: createData(createCatalog())}));

    try {
        const response = await fetch(`${service.url}${ENDPOINTS.DECK.GET_HEROES_LIST}`);

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), [{
            id: 'hero',
            name: 'Héroe',
            image: 'heroes/hero.png',
        }]);
    } finally {
        await service.close();
    }
});

test('saves card references as a legal deck and filters drafts from match selection', async () => {
    const catalog = createCatalog();
    const data = createData(catalog);
    const service = await listen(createDeckServiceApp({data}));

    try {
        const legalResponse = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'Mazo legal',
                heroId: 'hero',
                aspect: 'justice',
                cards: createLegalCardList(),
            }),
        });
        const legalDeck = await legalResponse.json();

        assert.equal(legalResponse.status, 201);
        assert.equal(legalDeck.heroName, 'Héroe');
        assert.equal(legalDeck.validation.legal, true);
        assert.equal(legalDeck.validation.size, 40);
        assert.deepEqual(data.decks.get(legalDeck.id).cards, createLegalCardList());
        assert.equal(Object.hasOwn(data.decks.get(legalDeck.id), 'fixedCards'), false);

        const draftResponse = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'Borrador',
                heroId: 'hero',
                aspect: 'justice',
                cards: [{id: 'card-1', count: 1}],
            }),
        });
        const draft = await draftResponse.json();
        const matchDecksResponse = await fetch(
            `${service.url}${ENDPOINTS.DECK.LIST}?hero=hero&legal=true`
        );

        assert.equal(draftResponse.status, 201);
        assert.equal(draft.validation.legal, false);
        assert.deepEqual((await matchDecksResponse.json()).map(deck => deck.id), [legalDeck.id]);
    } finally {
        await service.close();
    }
});

test('lists decks across heroes with display names and total card counts', async () => {
    const catalog = createCatalog();
    const otherCatalog = createCatalog('other-hero', 'Otro héroe');
    const data = createData(catalog, otherCatalog);
    data.decks.set('deck-1', {
        id: 'deck-1',
        name: 'Mazo de justicia',
        heroId: 'hero',
        aspect: 'justice',
        cards: createLegalCardList(),
    });
    data.decks.set('deck-2', {
        id: 'deck-2',
        name: 'Borrador de otro héroe',
        heroId: 'other-hero',
        aspect: 'aggression',
        cards: createLegalCardList(),
    });
    const service = await listen(createDeckServiceApp({data}));

    try {
        const response = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`);
        const decks = await response.json();
        const legalOnlyResponse = await fetch(
            `${service.url}${ENDPOINTS.DECK.LIST}?legal=true`
        );
        const legalDecks = await legalOnlyResponse.json();

        assert.equal(response.status, 200);
        assert.deepEqual(decks.map(deck => ({
            name: deck.name,
            hero: deck.heroName,
            aspect: deck.aspect,
            size: deck.validation.size,
            legal: deck.validation.legal,
        })), [
            {
                name: 'Mazo de justicia',
                hero: 'Héroe',
                aspect: 'justice',
                size: 40,
                legal: true,
            },
            {
                name: 'Borrador de otro héroe',
                hero: 'Otro héroe',
                aspect: 'aggression',
                size: 40,
                legal: false,
            },
        ]);
        assert.deepEqual(legalDecks.map(deck => deck.id), ['deck-1']);
    } finally {
        await service.close();
    }
});

test('restores timestamped decks from the repository snapshot', async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'mc-deck-service-'));
    const repositoryDeckSnapshotPath = join(temporaryDirectory, 'decks.json');
    const repositoryDeck = {
        id: 'repo-deck',
        name: 'Mazo guardado',
        heroId: 'hero',
        aspect: 'justice',
        cards: createLegalCardList(),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
    };
    await writeFile(repositoryDeckSnapshotPath, JSON.stringify({
        version: 1,
        decks: [repositoryDeck],
        deletions: [{id: 'deleted-deck', deletedAt: '2026-01-03T00:00:00.000Z'}],
    }));

    const data = createData(createCatalog());
    let restoredSnapshot;
    data.restoreRepositoryDecks = async snapshot => {
        restoredSnapshot = snapshot;
        return {
            total: snapshot.decks.length + snapshot.deletions.length,
            restored: snapshot.decks.length,
            deleted: snapshot.deletions.length,
            keptLocal: 0,
        };
    };
    const service = await listen(createDeckServiceApp({
        data,
        repositoryDeckSnapshotPath,
    }));

    try {
        const response = await fetch(
            `${service.url}${ENDPOINTS.DECK.RESTORE_REPOSITORY}`,
            {method: 'POST'},
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            total: 2,
            restored: 1,
            deleted: 1,
            keptLocal: 0,
        });
        assert.deepEqual(restoredSnapshot, {
            decks: [repositoryDeck],
            deletions: [{id: 'deleted-deck', deletedAt: '2026-01-03T00:00:00.000Z'}],
        });
    } finally {
        await service.close();
        await rm(temporaryDirectory, {recursive: true, force: true});
    }
});

test('saves the physical repository deck backup on demand', async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'mc-deck-service-backup-'));
    const repositoryDeckSnapshotPath = join(temporaryDirectory, 'decks.json');
    const repositoryDeck = {
        id: 'repo-deck',
        name: 'Mazo guardado',
        heroId: 'hero',
        aspect: 'justice',
        cards: createLegalCardList(),
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
    };
    const repositoryDeletion = {
        id: 'deleted-deck',
        deletedAt: '2026-01-03T00:00:00.000Z',
    };
    await writeFile(repositoryDeckSnapshotPath, JSON.stringify({
        version: 1,
        decks: [repositoryDeck],
        deletions: [repositoryDeletion],
    }));

    const data = createData(createCatalog());
    let savedSnapshot;
    let savedSnapshotPath;
    data.saveRepositoryDeckSnapshot = async (snapshot, snapshotPath) => {
        savedSnapshot = snapshot;
        savedSnapshotPath = snapshotPath;
        return {
            decks: snapshot.decks.length,
            deletions: snapshot.deletions.length,
        };
    };
    const service = await listen(createDeckServiceApp({
        data,
        repositoryDeckSnapshotPath,
    }));

    try {
        const response = await fetch(
            `${service.url}${ENDPOINTS.DECK.SAVE_REPOSITORY}`,
            {method: 'POST'},
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {decks: 1, deletions: 1});
        assert.deepEqual(savedSnapshot, {
            decks: [repositoryDeck],
            deletions: [repositoryDeletion],
        });
        assert.equal(savedSnapshotPath, repositoryDeckSnapshotPath);
    } finally {
        await service.close();
        await rm(temporaryDirectory, {recursive: true, force: true});
    }
});

test('marks aspect, copy-limit, and uniqueness conflicts as draft validation errors', async () => {
    const catalog = createCatalog();
    catalog.hero.identities = [{
        name: 'Identidad fija',
        relatedNames: ['Nombre civil'],
        unique: true,
    }];
    catalog.cards[0].name = 'Carta repetida';
    catalog.cards[1].name = 'Carta repetida';
    catalog.cards[2].name = 'Nombre civil';
    catalog.cards[2].unique = true;
    delete catalog.cards[8].classification;
    catalog.cards[8].aspect = 'aggression';
    catalog.aspects.push({id: 'aggression'});
    const data = createData(catalog);
    const service = await listen(createDeckServiceApp({data}));
    const cards = [
        {id: 'card-1', count: 2},
        {id: 'card-2', count: 2},
        {id: 'card-3', count: 1},
        ...Array.from({length: 6}, (_value, index) => ({
            id: `card-${index + 4}`,
            count: 3,
        })),
    ];

    try {
        const response = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'Mazo no legal',
                heroId: 'hero',
                aspect: 'justice',
                cards,
            }),
        });
        const deck = await response.json();

        assert.equal(response.status, 201);
        assert.equal(deck.validation.legal, false);
        assert.ok(deck.validation.errors.some(error => error.includes('aspecto seleccionado')));
        assert.ok(deck.validation.errors.some(error => error.includes('más de 3 copias')));
        assert.ok(deck.validation.errors.some(error => error.includes('carta única fija')));
    } finally {
        await service.close();
    }
});

test('applies a card maximum that is scoped to the player deck', async () => {
    const catalog = createCatalog();
    catalog.cards[0].maximum = {count: 1, target: TARGET_DECK};
    const service = await listen(createDeckServiceApp({data: createData(catalog)}));
    const cards = createLegalCardList();
    cards[0].count = 2;
    cards[cards.length - 1].count = 2;

    try {
        const response = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'Mazo con exceso de copias',
                heroId: 'hero',
                aspect: 'justice',
                cards,
            }),
        });
        const deck = await response.json();

        assert.equal(response.status, 201);
        assert.equal(deck.validation.legal, false);
        assert.ok(deck.validation.errors.some(error =>
            error.includes('más de 1 copia de "Carta 1"')));
    } finally {
        await service.close();
    }
});

test('marks a 51-card deck as an illegal draft', async () => {
    const catalog = createCatalog();
    const service = await listen(createDeckServiceApp({data: createData(catalog)}));

    try {
        const response = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'Mazo demasiado grande',
                heroId: 'hero',
                aspect: 'justice',
                cards: Array.from({length: 12}, (_value, index) => ({
                    id: `card-${index + 1}`,
                    count: 3,
                })),
            }),
        });
        const deck = await response.json();

        assert.equal(response.status, 201);
        assert.equal(deck.validation.size, 51);
        assert.ok(deck.validation.errors.some(error => error.includes('superar 50 cartas')));
    } finally {
        await service.close();
    }
});

test('rejects unknown card IDs and missing heroes', async () => {
    const catalog = createCatalog();
    const service = await listen(createDeckServiceApp({data: createData(catalog)}));

    try {
        const unknownHero = await fetch(
            `${service.url}${ENDPOINTS.DECK.GET_CATALOG}?hero=missing`
        );
        const unknownCard = await fetch(`${service.url}${ENDPOINTS.DECK.LIST}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'Mazo',
                heroId: 'hero',
                aspect: 'justice',
                cards: [{id: 'not-a-card', count: 1}],
            }),
        });

        assert.equal(unknownHero.status, 404);
        assert.equal(unknownCard.status, 400);
        assert.equal((await unknownCard.json()).error.status, 400);
    } finally {
        await service.close();
    }
});
});
