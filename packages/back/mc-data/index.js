import {randomUUID} from 'node:crypto';
import {MongoClient} from 'mongodb';
import {
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_HERO,
    CLASSIFICATION_BASIC,
    validatePlayerDeck,
} from 'mc-shared';
import {loadCatalog} from './seed/catalog.js';
import {
    mergeDeckSnapshots,
    newerRepositoryDeckEvents,
    writeRepositoryDeckSnapshot,
} from './utils/repository-deck-snapshot.js';

export {getLobbyPlayerSeats} from './utils/lobby-player-seats.js';

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
    matchLobbies: 'matchLobbies',
    matches: 'matches',
    scenarios: 'scenarios',
    sets: 'sets',
    users: 'users',
};

export class MongoDataStore {
    constructor({
        clientFactory = uri => new MongoClient(uri),
        catalogLoader = loadCatalog,
    } = {}) {
        this.clientFactory = clientFactory;
        this.catalogLoader = catalogLoader;
        this.client = null;
        this.database = null;
    }
    async connect({
        uri = process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database = process.env.MONGODB_DATABASE || 'mc',
    } = {}) {
        this.client = this.clientFactory(uri);
        await this.client.connect();
        this.database = this.client.db(database);
        await this._seedMissingRecords(await this.catalogLoader());
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
    async getMatchSnapshot(id) {
        const record = await this._collection(collectionNames.matches)
            .findOne({_id: id}, {projection: {snapshot: 1}});

        return record?.snapshot ?? null;
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
    _formatMatchLobby(lobby) {
        if (!lobby) {
            return null;
        }

        const {_id, ...fields} = lobby;

        return {id: _id, ...fields};
    }
    async createMatchLobby({
        name,
        maxPlayers,
        creatorId,
        scenario,
        expert,
    }) {
        const id = randomUUID();
        const now = new Date().toISOString();
        const lobby = {
            _id: id,
            name,
            maxPlayers,
            creatorId,
            players: [],
            scenario,
            expert,
            difficulty: expert ? 'Experto' : 'Normal',
            status: 'waiting',
            createdAt: now,
            updatedAt: now,
        };

        await this._collection(collectionNames.matchLobbies).insertOne(lobby);

        return this._formatMatchLobby(lobby);
    }
    async getMatchLobby(id) {
        const lobby = await this._collection(collectionNames.matchLobbies)
            .findOne({_id: id});

        return this._formatMatchLobby(lobby);
    }
    async getWaitingMatchLobbies() {
        const lobbies = await this._collection(collectionNames.matchLobbies)
            .find({
                status: 'waiting',
            })
            .sort({createdAt: -1})
            .toArray();

        return lobbies.map(lobby => this._formatMatchLobby(lobby));
    }
    async joinMatchLobby(id, player) {
        const result = await this._collection(collectionNames.matchLobbies)
            .updateOne({
                _id: id,
                status: 'waiting',
                'players.hero': {$ne: player.hero},
                $expr: {$lt: [{$size: '$players'}, '$maxPlayers']},
            }, {
                $push: {players: {...player, id: randomUUID()}},
                $set: {updatedAt: new Date().toISOString()},
            });

        return result.modifiedCount === 1 ?
            this.getMatchLobby(id) :
            null;
    }
    async leaveMatchLobby(id, userId) {
        const result = await this._collection(collectionNames.matchLobbies)
            .updateOne({
                _id: id,
                status: 'waiting',
                creatorId: {$ne: userId},
                'players.userId': userId,
            }, {
                $pull: {players: {userId}},
                $set: {updatedAt: new Date().toISOString()},
            });

        return result.modifiedCount === 1 ?
            this.getMatchLobby(id) :
            null;
    }
    async claimMatchLobbyStart(id, creatorId, startingMatch) {
        const result = await this._collection(collectionNames.matchLobbies)
            .updateOne({
                _id: id,
                creatorId,
                status: 'waiting',
                'players.0': {$exists: true},
            }, {
                $set: {
                    status: 'starting',
                    startingAt: new Date().toISOString(),
                    startingMatch,
                    updatedAt: new Date().toISOString(),
                },
            });

        return result.modifiedCount === 1 ?
            this.getMatchLobby(id) :
            null;
    }
    async markMatchLobbyReady(id) {
        const result = await this._collection(collectionNames.matchLobbies)
            .updateOne({
                _id: id,
                status: 'starting',
            }, {
                $set: {
                    'startingMatch.configured': true,
                    updatedAt: new Date().toISOString(),
                },
            });

        return result.modifiedCount === 1 ?
            this.getMatchLobby(id) :
            null;
    }
    async markMatchLobbyStarted(id, startedMatch) {
        const result = await this._collection(collectionNames.matchLobbies)
            .updateOne({
                _id: id,
                status: 'starting',
            }, {
                $set: {
                    status: 'started',
                    startedMatch,
                    updatedAt: new Date().toISOString(),
                },
            });

        return result.modifiedCount === 1 ?
            this.getMatchLobby(id) :
            null;
    }
    async deleteMatchLobby(id, creatorId) {
        const result = await this._collection(collectionNames.matchLobbies)
            .deleteOne({
                _id: id,
                creatorId,
                status: 'waiting',
            });

        return result.deletedCount === 1;
    }
    getHeroesList() {
        return this._collection(collectionNames.heroes)
            .find({}, {
                projection: {
                    _id: 1,
                    name: 1,
                    folder: 1,
                    'config.precon.aspect': 1,
                },
            })
            .sort({order: 1})
            .toArray()
            .then(heroes => heroes.map(({_id, config, ...hero}) => {
                const preconAspect = config?.precon?.find(({aspect}) =>
                    typeof aspect === 'string' &&
                    aspect &&
                    aspect !== CLASSIFICATION_BASIC
                )?.aspect;

                return {
                    id: _id,
                    ...hero,
                    ...(preconAspect ? {preconAspect} : {}),
                };
            }));
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
        const selectedAspect = config.precon.find(({aspect}) =>
            typeof aspect === 'string' && aspect &&
            aspect !== CLASSIFICATION_BASIC);

        for (const entry of config.precon) {
            if (!Array.isArray(entry.cardRefs)) {
                precon.push(entry);
                continue;
            }

            const ids = entry.cardRefs.map(({id: cardId}) => cardId);
            const cardCategory = entry.classification === CLASSIFICATION_BASIC ||
                entry.aspect === CLASSIFICATION_BASIC ?
                {$or: [
                    {classification: CLASSIFICATION_BASIC},
                    {aspect: CLASSIFICATION_BASIC},
                ]} :
                {aspect: entry.aspect};
            const records = await this._collection(collectionNames.aspects)
                .find({_id: {$in: ids}, ...cardCategory}, {
                    projection: {_id: 1, card: 1},
                })
                .toArray();
            const cardsById = new Map(records.map(record => [record._id, record.card]));

            for (const {id: cardId, count} of entry.cardRefs) {
                const card = cardsById.get(cardId);
                if (!card) {
                    const cardCategoryName = entry.classification || entry.aspect;
                    throw new Error(
                        `No ${cardCategoryName} card configuration found for "${cardId}"`,
                    );
                }
                precon.push({count, card});
            }
        }

        return {
            ...config,
            ...(selectedAspect ? {aspect: selectedAspect.aspect} : {}),
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
                    'config.deckBuildingRules': 1,
                    'config.precon': 1,
                    'config.sides': 1,
                },
            },
        );
        if (!hero) {
            return null;
        }

        const cardRecords = await this._collection(collectionNames.aspects)
            .find({}, {
                projection: {
                    _id: 1,
                    aspect: 1,
                    classification: 1,
                    order: 1,
                    card: 1,
                },
            })
            .sort({aspect: 1, classification: 1, order: 1})
            .toArray();
        const summarizeCard = ({type, params = {}}, values = {}) => {
            const classification = values.classification ?? params.classification;

            return {
                ...values,
                ...(classification !== undefined ? {classification} : {}),
                name: params.name,
                subtitle: params.subtitle || '',
                type,
                image: params.image || '',
                cost: params.cost ?? 0,
                traits: Array.isArray(params.traits) ?
                    params.traits :
                    typeof params.traits === 'string' ? [params.traits] : [],
                resources: params.resources || [],
                ...(params.keywords ? {keywords: params.keywords} : {}),
                unique: Boolean(params.unique),
                permanent: Boolean(params.keywords?.permanent),
                ...(params.maximum ? {maximum: params.maximum} : {}),
            };
        };
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
        const cards = cardRecords.map(({_id, aspect, classification, card}) => {
            const isBasicCard = classification === CLASSIFICATION_BASIC ||
                aspect === CLASSIFICATION_BASIC;
            const category = isBasicCard ?
                {classification: CLASSIFICATION_BASIC} :
                {aspect};

            return summarizeCard(card, {id: _id, ...category});
        });
        const aspectIds = [...new Set(cardRecords
            .map(({aspect}) => aspect)
            .filter(aspect => typeof aspect === 'string' &&
                aspect !== CLASSIFICATION_BASIC))];

        return {
            hero: {
                id: hero._id,
                name: hero.name,
                ...(hero.config.deckBuildingRules ? {
                    deckBuildingRules: hero.config.deckBuildingRules,
                } : {}),
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

        const {_id, aspects: legacyAspects, ...fields} = deck;
        const aspect = Array.isArray(fields.aspect) ?
            fields.aspect :
            Array.isArray(legacyAspects) ? legacyAspects : fields.aspect;

        return {id: _id, ...fields, aspect};
    }
    async _addDeckCreatorNames(decks) {
        const creatorIds = [...new Set(decks
            .map(({creatorId}) => creatorId)
            .filter(creatorId => typeof creatorId === 'string' && creatorId))];
        if (!creatorIds.length) {
            return decks.map(deck => ({...deck, creatorName: ''}));
        }

        const creators = await this._collection(collectionNames.users)
            .find(
                {_id: {$in: creatorIds}},
                {projection: {_id: 1, displayName: 1, deletedAt: 1}},
            )
            .toArray();
        const namesById = new Map(creators.map(({_id, displayName, deletedAt}) => [
            _id,
            deletedAt ? 'Usuario eliminado' : displayName,
        ]));

        return decks.map(deck => ({
            ...deck,
            creatorName: namesById.get(deck.creatorId) || '',
        }));
    }
    async getDeck(id) {
        const deck = await this._collection(collectionNames.decks).findOne({_id: id});
        if (!deck || deck.deletedAt) {
            return null;
        }

        const [formattedDeck] = await this._addDeckCreatorNames([
            this._formatDeck(deck),
        ]);

        return formattedDeck;
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

        return this._addDeckCreatorNames(decks.map(deck => this._formatDeck(deck)));
    }
    async getFavoriteDeckIds(userId) {
        const user = await this._collection(collectionNames.users).findOne(
            {_id: userId},
            {projection: {favoriteDeckIds: 1}},
        );

        return Array.isArray(user?.favoriteDeckIds) ?
            user.favoriteDeckIds.filter(id => typeof id === 'string') :
            [];
    }
    async setDeckFavorite(userId, deckId, isFavorite) {
        const update = isFavorite ?
            {$addToSet: {favoriteDeckIds: deckId}} :
            {$pull: {favoriteDeckIds: deckId}};
        const result = await this._collection(collectionNames.users).updateOne(
            {_id: userId},
            update,
        );
        if (result.matchedCount !== 1) {
            const error = new Error('No se encontró la cuenta autenticada.');
            error.statusCode = 404;
            throw error;
        }

        return isFavorite;
    }
    async saveDeck({id, name, heroId, aspect, cards, creatorId}) {
        const deckId = id || randomUUID();
        const existingDeck = id ? await this.getDeck(id) : null;
        const deckCreatorId = existingDeck ?
            existingDeck.creatorId :
            creatorId;
        if (typeof deckCreatorId !== 'string' || !deckCreatorId.trim()) {
            const error = new Error(existingDeck ?
                'El mazo existente no tiene un creador asignado.' :
                'El mazo debe tener un creador autenticado.');
            error.statusCode = existingDeck ? 409 : 401;
            throw error;
        }
        const deck = {
            _id: deckId,
            name,
            heroId,
            aspect,
            creatorId: deckCreatorId,
            cards: cards.map(({id: cardId, count}) => ({id: cardId, count})),
            createdAt: existingDeck?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this._collection(collectionNames.decks).replaceOne(
            {_id: deckId},
            deck,
            {upsert: true},
        );

        const [formattedDeck] = await this._addDeckCreatorNames([
            this._formatDeck(deck),
        ]);

        return formattedDeck;
    }
    async deleteDeck(id, creatorId) {
        if (typeof creatorId !== 'string' || !creatorId.trim()) {
            const error = new Error('Se requiere una cuenta autenticada para eliminar el mazo.');
            error.statusCode = 401;
            throw error;
        }

        const collection = this._collection(collectionNames.decks);
        const deck = await collection.findOne({_id: id, creatorId});
        if (!deck || deck.deletedAt) {
            return false;
        }
        const updatedAt = Date.parse(deck.updatedAt);
        if (!Number.isFinite(updatedAt)) {
            throw new Error(`El mazo "${id}" no tiene una fecha de actualización válida.`);
        }

        const deletedAt = new Date(Math.max(Date.now(), updatedAt + 1)).toISOString();
        const result = await collection.updateOne(
            {
                _id: id,
                creatorId,
                updatedAt: deck.updatedAt,
                deletedAt: {$exists: false},
            },
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
    async restoreRepositoryDecks({decks, deletions}, restoringUserId) {
        const collection = this._collection(collectionNames.decks);
        const localSnapshot = await this.getRepositoryDeckSnapshot();
        const repositoryEvents = newerRepositoryDeckEvents(
            {decks, deletions},
            localSnapshot,
        );
        const localCreatorIds = new Map(localSnapshot.decks
            .filter(deck => typeof deck.creatorId === 'string' && deck.creatorId)
            .map(deck => [deck.id, deck.creatorId]));
        const localDeckIds = new Set(localSnapshot.decks.map(deck => deck.id));
        const hasUnownedLocalDeck = repositoryEvents.some(event =>
            localDeckIds.has(event.id) &&
            !localCreatorIds.has(event.id));
        if (hasUnownedLocalDeck) {
            const error = new Error(
                'No se puede restaurar un mazo local que no tiene creador asignado.',
            );
            error.statusCode = 409;
            throw error;
        }

        const applicableEvents = repositoryEvents.filter(event => {
            const localCreatorId = localCreatorIds.get(event.id);

            return !localCreatorId || localCreatorId === restoringUserId;
        });
        const needsRestoringUser = applicableEvents.some(event =>
            event.type === 'deck' && !localCreatorIds.has(event.id));
        if (needsRestoringUser &&
            (typeof restoringUserId !== 'string' || !restoringUserId.trim())) {
            const error = new Error(
                'Se requiere una sesión autenticada para asignar los mazos restaurados.',
            );
            error.statusCode = 401;
            throw error;
        }

        await Promise.all(applicableEvents.map(event => {
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
                {
                    _id: id,
                    ...deck,
                    creatorId: localCreatorIds.get(id) || restoringUserId,
                },
                {upsert: true},
            );
        }));

        const total = new Set([
            ...decks.map(deck => deck.id),
            ...deletions.map(deletion => deletion.id),
        ]).size;
        const deleted = applicableEvents.filter(event =>
            event.type === 'deletion').length;
        return {
            total,
            restored: applicableEvents.length - deleted,
            deleted,
            keptLocal: total - applicableEvents.length,
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
