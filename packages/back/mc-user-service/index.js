import {createServiceServer} from 'mc-server-utils';
import {loadUserServiceConfig} from './src/config.js';
import {createSmtpMailer} from './src/smtp-mailer.js';
import {createUserServiceApp} from './src/user-service-app.js';
import {MongoUserStore} from './src/user-store.js';

const config = loadUserServiceConfig();
const store = new MongoUserStore({
    uri: config.mongoUri,
    database: config.mongoDatabase,
});
const mailer = createSmtpMailer(config.smtp);

await store.connect();

const server = createServiceServer(createUserServiceApp({
    store,
    mailer,
    frontendOrigin: config.frontendOrigin,
    secureCookies: config.secureCookies,
}));

await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, resolve);
});
const protocol = process.env.USE_HTTPS === 'false' ? 'http' : 'https';
console.log(`mc-user-service running at ${protocol}://localhost:${config.port}`);

let shuttingDown = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;

        server.close(async error => {
            try {
                await store.close();
            } catch (closeError) {
                console.error('Failed to close mc-user-service MongoDB connection', {
                    name: closeError.name,
                    code: closeError.code,
                });
                process.exitCode = 1;
            }

            if (error) {
                console.error('Failed to close mc-user-service HTTP server', {
                    name: error.name,
                    code: error.code,
                });
                process.exitCode = 1;
            }
        });
    });
}
