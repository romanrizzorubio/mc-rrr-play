import {createServer} from 'node:http';

import {MongoDataStore} from 'mc-data';
import {createMatchCreationApp} from './src/match-creation-app.js';

const data = new MongoDataStore();
await data.connect();

const app = createMatchCreationApp({data});
const server = createServer(app);
const port = Number(process.env.PORT || 3001);

server.listen(port, () => {
    console.log(`match creation service running at http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
        server.close(async error => {
            await data.close();
            if (error) {
                console.error('Failed to close match creation service', error);
                process.exitCode = 1;
            }
        });
    });
}
