import {readFileSync} from 'node:fs';
import {createServer as createHttpsServer} from 'node:https';
import {createServer as createHttpServer} from 'node:http';

export const createServiceServer = (
    app,
    {
        certificatePath = process.env.TLS_CERT_PATH,
        keyPath = process.env.TLS_KEY_PATH,
        useHttps = process.env.USE_HTTPS !== 'false',
    } = {},
) => {
    if (!useHttps) {
        return createHttpServer(app);
    }

    if (!certificatePath || !keyPath) {
        throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must be configured when USE_HTTPS is true.');
    }

    return createHttpsServer({
        cert: readFileSync(certificatePath),
        key: readFileSync(keyPath),
    }, app);
};
