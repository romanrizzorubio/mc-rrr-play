import {MongoClient} from 'mongodb';
import {loadCatalog} from './catalog.js';

const catalog = await loadCatalog();
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
const database = process.env.MONGODB_DATABASE || 'mc';

await client.connect();

try {
    const db = client.db(database);
    for (const [collectionName, records] of Object.entries(catalog)) {
        const collection = db.collection(collectionName);
        await Promise.all(records.map(({_id, ...document}) => collection.replaceOne(
            {_id},
            {_id, ...document},
            {upsert: true},
        )));
    }
} finally {
    await client.close();
}

console.log(`Seeded game data in MongoDB database "${database}"`);
