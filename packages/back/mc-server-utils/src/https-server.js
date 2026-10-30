import {readFileSync} from 'node:fs';
import {createServer} from 'node:https';

export const createHttpsServiceServer = (
    app,
    {
        certificatePath = process.env.TLS_CERT_PATH,
        keyPath = process.env.TLS_KEY_PATH,
    } = {},
) => {
    if (!certificatePath || !keyPath) {
        throw new Error('TLS_CERT_PATH and TLS_KEY_PATH must be configured.');
    }

    return createServer({
        cert: readFileSync(certificatePath),
        key: readFileSync(keyPath),
    }, app);
};
