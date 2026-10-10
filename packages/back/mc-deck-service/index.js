import {createServer} from 'node:http';

import {MongoDataStore} from 'mc-data';
import {createDeckServiceApp} from './src/deck-service-app.js';

const data = new MongoDataStore();
await data.connect();

const app = createDeckServiceApp({data});
const server = createServer(app);
const port = Number(process.env.PORT || 3002);

server.listen(port, () => {
    console.log(`mc-deck-service running at http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
        server.close(async error => {
            await data.close();
            if (error) {
                console.error('Failed to close mc-deck-service', error);
                process.exitCode = 1;
            }
        });
    });
}
