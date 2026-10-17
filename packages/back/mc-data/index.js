import {randomUUID} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_HERO,
    validatePlayerDeck,
} from 'mc-shared';
import {loadCatalog} from './seed/catalog.js';
import {
    mergeDeckSnapshots,
    newerRepositoryDeckEvents,
    writeRepositoryDeckSnapshot,
} from './utils/repository-deck-snapshot.js';

export {
    mergeDecksByUpdatedAt,
    mergeDeckSnapshots,
    newerRepositoryDeckEvents,
    parseRepositoryDeckSnapshot,
    REPOSITORY_DECK_SNAPSHOT_PATH,
    REPOSITORY_DECK_SNAPSHOT_VERSION,
    serializeRepositoryDeckSnapshot,
} from './utils/repository-deck-snapshot.js';

const collectionNames = {
    aspects: 'aspects',
    decks: 'decks',
    heroes: 'heroes',
    matches: 'matches',
    scenarios: 'scenarios',
    sets: 'sets',
};

export class MongoDataStore {
    constructor() {
        this.client = null;
        this.database = null;
    }
    async connect({
        uri = process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database = process.env.MONGODB_DATABASE || 'mc',
    } = {}) {
        this.client = new MongoClient(uri);
        await this.client.connect();
        this.database = this.client.db(database);
        await this._seedMissingRecords(await loadCatalog());
    }
    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.database = null;
        }
    }
    _collection(name) {
        if (!this.database) {
            throw new Error('MongoDataStore must be connected before it can be used');
        }

        return this.database.collection(name);
    }
    async _seedMissingRecords(catalog) {
        for (const [collectionName, records] of Object.entries(catalog)) {
            const collection = this._collection(collectionName);
            await Promise.all(records.map(record => collection.updateOne(
                {_id: record._id},
                {$setOnInsert: record},
                {upsert: true},
            )));
        }
    }
    async _getConfig(collection, id) {
        const record = await this._collection(collection).findOne({_id: id});

        if (!record || !Object.hasOwn(record, 'config')) {
            throw new Error(`No ${collection} configuration found for "${id}"`);
        }

        return record.config;
    }
    getMatchSnapshots() {
        return this._collection(collectionNames.matches)
            .find({}, {projection: {_id: 1, snapshot: 1}})
            .toArray();
    }
    saveMatchSnapshot(id, snapshot) {
        return this._collection(collectionNames.matches).replaceOne(
            {_id: id},
            {_id: id, snapshot},
            {upsert: true},
        );
    }
    deleteMatchSnapshot(id) {
        return this._collection(collectionNames.matches).deleteOne({_id: id});
    }
    getHeroesList() {
        return this._collection(collectionNames.heroes)
            .find({}, {projection: {_id: 1, name: 1, folder: 1}})
            .sort({order: 1})
            .toArray()
            .then(heroes => heroes.map(({_id, ...hero}) => ({id: _id, ...hero})));
    }
    getDeckHeroesList() {
        return this._collection(collectionNames.heroes)
            .find({}, {
                projection: {
                    _id: 1,
                    name: 1,
                    'config.sides': 1,
                },
            })
            .sort({order: 1})
            .toArray()
            .then(heroes => heroes.map(({_id, name, config}) => {
                const heroSide = config?.sides?.find(({type}) => type === CARD_TYPE_HERO);

                return {
                    id: _id,
                    name,
                    image: heroSide?.params?.image || '',
                };
            }));
    }
    async getScenariosList() {
        const scenarios = await this._collection(collectionNames.scenarios)
            .find({}, {
                projection: {
                    _id: 0,
                    name: 1,
                    folder: 1,
                    'config.sets': 1,
                    'config.defaultSets': 1,
                },
            })
            .toArray();

        const requiredSetIds = new Set(scenarios.flatMap(({config}) =>
            config?.sets || []
        ));
        const requiredSetRecords = requiredSetIds.size ?
            await this._collection(collectionNames.sets)
                .find({_id: {$in: [...requiredSetIds]}}, {
                    projection: {
                        _id: 1,
                        'config.name': 1,
                    },
                })
                .toArray() :
            [];
        const requiredSetNames = new Map(requiredSetRecords.map(({_id, config}) => [
            _id,
            config?.name,
        ]));

        return scenarios
            .map(({name, folder, config}) => {
                const requiredSets = (config?.sets || []).map(id => {
                    const setName = requiredSetNames.get(id);
                    if (!setName) {
                        throw new Error(
                            `No name found for required encounter set "${id}" in scenario "${folder}".`
                        );
                    }

                    return {id, name: setName};
                });

                return {
                    name,
                    folder,
                    requiredSets,
                    defaultModularSets: [...(config?.defaultSets || [])],
                };
            })
            .sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}) ||
                left.folder.localeCompare(right.folder, 'es')
            );
    }
    async getModularSetsList() {
        const sets = await this._collection(collectionNames.sets)
            .find({'config.standard': false}, {
                projection: {
                    _id: 1,
                    'config.name': 1,
                },
            })
            .toArray();

        return sets.map(({_id, config}) => ({
            id: _id,
            name: config.name,
        }));
    }
    async getHeroConfig(id) {
        const config = await this._getConfig(collectionNames.heroes, id);
        const precon = [];
        const selectedAspect = config.precon.find(({aspect}) => aspect !== 'basic');
        if (!selectedAspect) {
            throw new Error(`No default aspect configured for hero "${id}"`);
        }

        for (const entry of config.precon) {
            if (!Array.isArray(entry.cardRefs)) {
                precon.push(entry);
                continue;
            }

            const ids = entry.cardRefs.map(({id: cardId}) => cardId);
            const records = await this._collection(collectionNames.aspects)
                .find({_id: {$in: ids}, aspect: entry.aspect}, {projection: {_id: 1, card: 1}})
                .toArray();
            const cardsById = new Map(records.map(record => [record._id, record.card]));

            for (const {id: cardId, count} of entry.cardRefs) {
                const card = cardsById.get(cardId);
                if (!card) {
                    throw new Error(`No ${entry.aspect} card configuration found for "${cardId}"`);
                }
                precon.push({count, card});
            }
        }

        return {
            ...config,
            aspect: selectedAspect.aspect,
            precon,
        };
    }
    async getDeckEditorCatalog(heroId) {
        const hero = await this._collection(collectionNames.heroes).findOne(
            {_id: heroId},
            {
                projection: {
                    _id: 1,
                    name: 1,
                    'config.cards': 1,
                    'config.precon': 1,
                    'config.sides': 1,
                },
            },
        );
        if (!hero) {
            return null;
        }

        const cardRecords = await this._collection(collectionNames.aspects)
            .find({}, {projection: {_id: 1, aspect: 1, order: 1, card: 1}})
            .sort({aspect: 1, order: 1})
            .toArray();
        const summarizeCard = ({type, params = {}}, values = {}) => ({
            ...values,
            name: params.name,
            subtitle: params.subtitle || '',
            type,
            image: params.image || '',
            cost: params.cost ?? 0,
            traits: Array.isArray(params.traits) ?
                params.traits :
                typeof params.traits === 'string' ? [params.traits] : [],
            resources: params.resources || [],
            unique: Boolean(params.unique),
            permanent: Boolean(params.keywords?.permanent),
            ...(params.maximum ? {maximum: params.maximum} : {}),
        });
        const fixedCards = hero.config.cards.map(({count, card}) => ({
            ...summarizeCard(card),
            count,
        }));
        const heroSide = hero.config.sides.find(({type}) => type === CARD_TYPE_HERO);
        const alterEgoSide = hero.config.sides.find(({type}) => type === CARD_TYPE_ALTEREGO);
        const identities = heroSide ? [{
            ...summarizeCard(heroSide),
            relatedNames: alterEgoSide ? [alterEgoSide.params.name] : [],
        }] : [];
        const precon = hero.config.precon.flatMap(entry =>
            (entry.cardRefs || []).map(({id, count}) => ({id, count})));
        const cards = cardRecords.map(({_id, aspect, card}) =>
            summarizeCard(card, {id: _id, aspect}));
        const aspectIds = [...new Set(cardRecords
            .map(({aspect}) => aspect)
            .filter(aspect => aspect !== 'basic'))];

        return {
            hero: {
                id: hero._id,
                name: hero.name,
                baseCardCount: fixedCards.reduce((total, card) =>
                    total + (card.permanent ? 0 : card.count), 0),
                fixedCards,
                identities,
            },
            aspects: aspectIds.map(id => ({id})),
            cards,
            precon,
        };
    }
    _formatDeck(deck) {
        if (!deck) {
            return null;
        }

        const {_id, ...fields} = deck;

        return {id: _id, ...fields};
    }
    async getDeck(id) {
        const deck = await this._collection(collectionNames.decks).findOne({_id: id});

        return deck?.deletedAt ? null : this._formatDeck(deck);
    }
    async getDecksList(heroId) {
        const filter = {
            deletedAt: {$exists: false},
            ...(heroId === undefined ? {} : {heroId}),
        };
        const decks = await this._collection(collectionNames.decks)
            .find(filter)
            .sort({name: 1, createdAt: 1})
            .toArray();

        return decks.map(deck => this._formatDeck(deck));
    }
    async saveDeck({id, name, heroId, aspect, cards}) {
        const deckId = id || randomUUID();
        const existingDeck = id ? await this.getDeck(id) : null;
        const deck = {
            _id: deckId,
            name,
            heroId,
            aspect,
            cards: cards.map(({id: cardId, count}) => ({id: cardId, count})),
            createdAt: existingDeck?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this._collection(collectionNames.decks).replaceOne(
            {_id: deckId},
            deck,
            {upsert: true},
        );

        return this._formatDeck(deck);
    }
    async deleteDeck(id) {
        const collection = this._collection(collectionNames.decks);
        const deck = await collection.findOne({_id: id});
        if (!deck || deck.deletedAt) {
            return false;
        }
        const updatedAt = Date.parse(deck.updatedAt);
        if (!Number.isFinite(updatedAt)) {
            throw new Error(`El mazo "${id}" no tiene una fecha de actualización válida.`);
        }

        const deletedAt = new Date(Math.max(Date.now(), updatedAt + 1)).toISOString();
        const result = await collection.updateOne(
            {_id: id, updatedAt: deck.updatedAt, deletedAt: {$exists: false}},
            {$set: {deletedAt}},
        );

        return result.modifiedCount === 1;
    }
    async getRepositoryDeckSnapshot() {
        const collection = this._collection(collectionNames.decks);
        const records = await collection.find({})
            .sort({_id: 1})
            .toArray();
        const snapshot = {decks: [], deletions: []};

        for (const record of records) {
            if (record.deletedAt) {
                snapshot.deletions.push({
                    id: record._id,
                    deletedAt: record.deletedAt,
                });
            } else {
                snapshot.decks.push(this._formatDeck(record));
            }
        }

        return snapshot;
    }
    async saveRepositoryDeckSnapshot(
        repositorySnapshot,
        snapshotPath,
    ) {
        const mergedSnapshot = mergeDeckSnapshots(
            repositorySnapshot,
            await this.getRepositoryDeckSnapshot(),
        );
        await writeRepositoryDeckSnapshot(mergedSnapshot, snapshotPath);

        return {
            decks: mergedSnapshot.decks.length,
            deletions: mergedSnapshot.deletions.length,
        };
    }
    async restoreRepositoryDecks(repositorySnapshot) {
        const collection = this._collection(collectionNames.decks);
        const localSnapshot = await this.getRepositoryDeckSnapshot();
        const repositoryEvents = newerRepositoryDeckEvents(
            repositorySnapshot,
            localSnapshot,
        );

        await Promise.all(repositoryEvents.map(event => {
            if (event.type === 'deletion') {
                return collection.replaceOne(
                    {_id: event.id},
                    {_id: event.id, deletedAt: event.value.deletedAt},
                    {upsert: true},
                );
            }

            const {id, ...deck} = event.value;
            return collection.replaceOne(
                {_id: id},
                {_id: id, ...deck},
                {upsert: true},
            );
        }));

        const total = new Set([
            ...repositorySnapshot.decks.map(deck => deck.id),
            ...repositorySnapshot.deletions.map(deletion => deletion.id),
        ]).size;
        const deleted = repositoryEvents.filter(event => event.type === 'deletion').length;
        return {
            total,
            restored: repositoryEvents.length - deleted,
            deleted,
            keptLocal: total - repositoryEvents.length,
        };
    }
    async getDeckConfig(id, heroId) {
        const deck = await this.getDeck(id);
        if (!deck) {
            const error = new Error(`No se encontró el mazo "${id}".`);
            error.statusCode = 404;
            throw error;
        }
        if (deck.heroId !== heroId) {
            const error = new Error('El mazo seleccionado pertenece a otro superhéroe.');
            error.statusCode = 400;
            throw error;
        }

        const catalog = await this.getDeckEditorCatalog(heroId);
        const validation = validatePlayerDeck(deck, catalog);
        if (!validation.legal) {
            const error = new Error(
                `El mazo "${deck.name}" no cumple las reglas de construcción: ` +
                validation.errors.join(' '),
            );
            error.statusCode = 400;
            throw error;
        }

        const ids = deck.cards.map(({id: cardId}) => cardId);
        const records = await this._collection(collectionNames.aspects)
            .find({_id: {$in: ids}}, {projection: {_id: 1, card: 1}})
            .toArray();
        const cardsById = new Map(records.map(record => [record._id, record.card]));

        const cards = deck.cards.map(({id: cardId, count}) => {
            const card = cardsById.get(cardId);
            if (!card) {
                const error = new Error(`No se encontró la carta "${cardId}" del mazo.`);
                error.statusCode = 400;
                throw error;
            }

            return {count, card};
        });

        return {
            aspect: deck.aspect,
            cards,
        };
    }
    getScenarioConfig(id) {
        return this._getConfig(collectionNames.scenarios, id);
    }
    getSetConfig(id) {
        return this._getConfig(collectionNames.sets, id);
    }
}
