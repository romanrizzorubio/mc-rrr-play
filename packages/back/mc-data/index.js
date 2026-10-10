import {MongoClient} from 'mongodb';
import {loadCatalog} from './seed/catalog.js';

const collectionNames = {
    aspects: 'aspects',
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
            .find({}, {projection: {_id: 0, name: 1, folder: 1}})
            .sort({order: 1})
            .toArray();
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

        return scenarios
            .map(({name, folder, config}) => ({
                name,
                folder,
                configuredSets: [...(config.sets || []), ...(config.defaultSets || [])],
            }))
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

        return {...config, precon};
    }
    getScenarioConfig(id) {
        return this._getConfig(collectionNames.scenarios, id);
    }
    getSetConfig(id) {
        return this._getConfig(collectionNames.sets, id);
    }
}
