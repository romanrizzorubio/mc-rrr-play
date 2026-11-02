import {MongoClient} from 'mongodb';
import {loadCatalog} from './catalog.js';
import {seedCatalog} from './catalog-seeder.js';

const catalog = await loadCatalog();
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
const database = process.env.MONGODB_DATABASE || 'mc';

await client.connect();

try {
    const db = client.db(database);
    await seedCatalog(db, catalog);
} finally {
    await client.close();
}

console.log(`Seeded game data in MongoDB database "${database}"`);
