import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {MongoDataStore} from '../index.js';

const createCursor = records => ({
    sort() {
        return this;
    },
    limit(count) {
        this.records = records.slice(0, count);
        return this;
    },
    async toArray() {
        return this.records || records;
    },
});

const createDatabase = (users, decks) => ({
    collection(name) {
        if (name === 'users') {
            return {
                find: filter => createCursor(users.filter(user => {
                    if (filter._id?.$in && !filter._id.$in.includes(user._id)) {
                        return false;
                    }

                    return true;
                })),
                findOne: async filter =>
                    users.find(user => user._id === filter._id) || null,
                updateOne: async (filter, update) => {
                    const user = users.find(record => record._id === filter._id);
                    if (!user) {
                        return {matchedCount: 0, modifiedCount: 0};
                    }
                    if (update.$addToSet) {
                        user.favoriteDeckIds ||= [];
                        const [field, value] = Object.entries(update.$addToSet)[0];
                        if (!user[field].includes(value)) {
                            user[field].push(value);
                        }
                    }
                    if (update.$pull) {
                        const [field, value] = Object.entries(update.$pull)[0];
                        user[field] = (user[field] || []).filter(id => id !== value);
                    }

                    return {matchedCount: 1, modifiedCount: 1};
                },
            };
        }

        return {
            find: filter => createCursor(decks.filter(deck => {
                if (filter.deletedAt?.$exists === false && deck.deletedAt) {
                    return false;
                }
                if (filter.heroId && deck.heroId !== filter.heroId) {
                    return false;
                }

                return true;
            })),
            findOne: async filter => decks.find(deck =>
                deck._id === filter._id &&
                (filter.creatorId === undefined || deck.creatorId === filter.creatorId)
            ) || null,
            updateOne: async (filter, update) => {
                const deck = decks.find(record =>
                    record._id === filter._id &&
                    record.creatorId === filter.creatorId &&
                    record.updatedAt === filter.updatedAt &&
                    !record.deletedAt);
                if (!deck) {
                    return {matchedCount: 0, modifiedCount: 0};
                }
                Object.assign(deck, update.$set);
                return {matchedCount: 1, modifiedCount: 1};
            },
            replaceOne: async (filter, replacement) => {
                const index = decks.findIndex(deck => deck._id === filter._id);
                if (index === -1) {
                    decks.push(replacement);
                } else {
                    decks[index] = replacement;
                }
                return {modifiedCount: 1};
            },
        };
    },
});

const createConnectedStore = (database, catalog = {}) => new MongoDataStore({
    clientFactory: () => ({
        async connect() {},
        db: () => database,
        async close() {},
    }),
    catalogLoader: async () => catalog,
});

describe('deck ownership persistence', () => {
    test('connects with existing deck creators without requiring a default account', async () => {
        const users = [
            {
                _id: 'owner-account',
                displayName: 'Deck owner',
                activatedAt: new Date('2026-01-01T00:00:00.000Z'),
            },
        ];
        const decks = [{
            _id: 'owned-deck',
            name: 'Mazo guardado',
            heroId: 'hero',
            aspect: 'justice',
            creatorId: 'owner-account',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }];
        const store = createConnectedStore(createDatabase(users, decks));

        await store.connect({uri: 'mongodb://localhost:27017', database: 'mc'});

        assert.equal(decks[0].creatorId, 'owner-account');
        assert.deepEqual(users, [{
            _id: 'owner-account',
            displayName: 'Deck owner',
            activatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }]);
        assert.deepEqual(
            (await store.getDecksList()).map(({id, creatorName}) => ({id, creatorName})),
            [{id: 'owned-deck', creatorName: 'Deck owner'}],
        );
        assert.equal((await store.getDeck('owned-deck')).creatorName, 'Deck owner');

        await store.close();
    });

    test('hides the display name of a logically deleted deck creator', async () => {
        const users = [{
            _id: 'deleted-owner',
            displayName: 'Former owner',
            deletedAt: new Date('2026-03-01T00:00:00.000Z'),
        }];
        const decks = [{
            _id: 'owned-deck',
            name: 'Mazo conservado',
            heroId: 'hero',
            aspect: 'justice',
            creatorId: 'deleted-owner',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }];
        const store = new MongoDataStore();
        store.database = createDatabase(users, decks);

        assert.equal(
            (await store.getDeck('owned-deck')).creatorName,
            'Usuario eliminado',
        );
    });

    test('saves the authenticated creator and preserves the original owner on edits', async () => {
        const users = [
            {_id: 'first-owner', displayName: 'First owner'},
            {_id: 'second-owner', displayName: 'Second owner'},
        ];
        const decks = [];
        const store = new MongoDataStore();
        store.database = createDatabase(users, decks);

        const createdDeck = await store.saveDeck({
            name: 'Mazo nuevo',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            creatorId: 'first-owner',
        });
        const updatedDeck = await store.saveDeck({
            id: createdDeck.id,
            name: 'Mazo actualizado',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            creatorId: 'second-owner',
        });

        assert.equal(decks[0].creatorId, 'first-owner');
        assert.equal(createdDeck.creatorName, 'First owner');
        assert.equal(updatedDeck.creatorId, 'first-owner');
        assert.equal(updatedDeck.creatorName, 'First owner');
        assert.equal(updatedDeck.name, 'Mazo actualizado');
    });

    test('persists favorites on the authenticated user account', async () => {
        const users = [{_id: 'current-user', displayName: 'Current user'}];
        const store = new MongoDataStore();
        store.database = createDatabase(users, []);

        assert.deepEqual(await store.getFavoriteDeckIds('current-user'), []);
        assert.equal(
            await store.setDeckFavorite('current-user', 'shared-deck', true),
            true,
        );
        assert.deepEqual(
            await store.getFavoriteDeckIds('current-user'),
            ['shared-deck'],
        );
        await store.setDeckFavorite('current-user', 'shared-deck', false);
        assert.deepEqual(await store.getFavoriteDeckIds('current-user'), []);
    });

    test('deletes a deck only when the authenticated creator ID matches', async () => {
        const decks = [{
            _id: 'owned-deck',
            name: 'Mazo propio',
            heroId: 'hero',
            aspect: 'justice',
            creatorId: 'owner-user',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }];
        const store = new MongoDataStore();
        store.database = createDatabase([], decks);

        assert.equal(await store.deleteDeck('owned-deck', 'another-user'), false);
        assert.equal(Object.hasOwn(decks[0], 'deletedAt'), false);
        assert.equal(await store.deleteDeck('owned-deck', 'owner-user'), true);
        assert.ok(decks[0].deletedAt);
    });

    test('does not assign a new owner when an existing deck has no creator', async () => {
        const decks = [{
            _id: 'ownerless-deck',
            name: 'Mazo sin creador',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
        }];
        const store = new MongoDataStore();
        store.database = createDatabase([], decks);

        await assert.rejects(store.saveDeck({
            id: 'ownerless-deck',
            name: 'Mazo actualizado',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            creatorId: 'current-user',
        }), {statusCode: 409});
        assert.equal(Object.hasOwn(decks[0], 'creatorId'), false);
    });

    test('rejects new decks without an authenticated creator', async () => {
        const store = new MongoDataStore();
        store.database = createDatabase([], []);

        await assert.rejects(store.saveDeck({
            name: 'Mazo sin creador',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
        }), {statusCode: 401});
    });

    test('assigns imported decks to the restoring user and preserves existing owners', async () => {
        const decks = [{
            _id: 'local-deck',
            name: 'Mazo local antiguo',
            heroId: 'hero',
            aspect: 'justice',
            creatorId: 'local-owner',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }];
        const store = new MongoDataStore();
        store.database = createDatabase([], decks);

        await store.restoreRepositoryDecks({
            decks: [
                {
                    id: 'local-deck',
                    name: 'Mazo local actualizado',
                    heroId: 'hero',
                    aspect: 'justice',
                    cards: [],
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-02T00:00:00.000Z',
                },
                {
                    id: 'repository-only',
                    name: 'Mazo del repositorio',
                    heroId: 'hero',
                    aspect: 'justice',
                    cards: [],
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-02T00:00:00.000Z',
                },
            ],
            deletions: [],
        }, 'restoring-user');

        assert.equal(decks.find(deck => deck._id === 'local-deck').creatorId, 'local-owner');
        assert.equal(
            decks.find(deck => deck._id === 'repository-only').creatorId,
            'restoring-user',
        );
    });

    test('does not restore updates or deletions for decks owned by another user', async () => {
        const decks = [{
            _id: 'foreign-deck',
            name: 'Mazo ajeno',
            heroId: 'hero',
            aspect: 'justice',
            creatorId: 'another-user',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }, {
            _id: 'foreign-deletion',
            name: 'Otro mazo ajeno',
            heroId: 'hero',
            aspect: 'justice',
            creatorId: 'another-user',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }];
        const store = new MongoDataStore();
        store.database = createDatabase([], decks);

        const result = await store.restoreRepositoryDecks({
            decks: [{
                id: 'foreign-deck',
                name: 'Versión del repositorio',
                heroId: 'hero',
                aspect: 'justice',
                cards: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
            }],
            deletions: [{
                id: 'foreign-deletion',
                deletedAt: '2026-01-02T00:00:00.000Z',
            }],
        }, 'restoring-user');

        assert.deepEqual(result, {
            total: 2,
            restored: 0,
            deleted: 0,
            keptLocal: 2,
        });
        assert.equal(decks[0].name, 'Mazo ajeno');
        assert.equal(Object.hasOwn(decks[1], 'deletedAt'), false);
    });

    test('rejects repository-only decks when no authenticated restoring user is supplied', async () => {
        const store = new MongoDataStore();
        store.database = createDatabase([], []);

        await assert.rejects(store.restoreRepositoryDecks({
            decks: [{
                id: 'repository-only',
                name: 'Mazo del repositorio',
                heroId: 'hero',
                aspect: 'justice',
                cards: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
            }],
            deletions: [],
        }), {statusCode: 401});
    });

    test('does not modify an ownerless local deck during repository restore', async () => {
        const decks = [{
            _id: 'ownerless-local',
            name: 'Mazo local sin creador',
            heroId: 'hero',
            aspect: 'justice',
            cards: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        }];
        const store = new MongoDataStore();
        store.database = createDatabase([], decks);

        await assert.rejects(store.restoreRepositoryDecks({
            decks: [{
                id: 'ownerless-local',
                name: 'Mazo del repositorio',
                heroId: 'hero',
                aspect: 'justice',
                cards: [],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-02T00:00:00.000Z',
            }],
            deletions: [],
        }, 'restoring-user'), {statusCode: 409});

        await assert.rejects(store.restoreRepositoryDecks({
            decks: [],
            deletions: [{
                id: 'ownerless-local',
                deletedAt: '2026-01-02T00:00:00.000Z',
            }],
        }, 'restoring-user'), {statusCode: 409});
        assert.equal(Object.hasOwn(decks[0], 'creatorId'), false);
        assert.equal(Object.hasOwn(decks[0], 'deletedAt'), false);
    });
});
