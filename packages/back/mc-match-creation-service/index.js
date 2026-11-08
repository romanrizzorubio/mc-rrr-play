import {createServiceServer} from 'mc-server-utils';
import {MongoDataStore} from 'mc-data';
import {createMatchCreationApp} from './src/match-creation-app.js';

const data = new MongoDataStore();
await data.connect();

const app = createMatchCreationApp({data});
const server = createServiceServer(app);
const port = Number(process.env.PORT || 3001);

const protocol = process.env.USE_HTTPS === 'false' ? 'http' : 'https';
server.listen(port, '0.0.0.0', () => {
    console.log(`match creation service running at ${protocol}://0.0.0.0:${port}`);
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
