import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

export const getDevelopmentHttpsOptions = () => {
    const certificatePath = process.env.TLS_CERT_PATH ||
        resolve(repositoryRoot, '.local/certs/localhost.pem');
    const keyPath = process.env.TLS_KEY_PATH ||
        resolve(repositoryRoot, '.local/certs/localhost-key.pem');

    try {
        return {
            cert: readFileSync(certificatePath),
            key: readFileSync(keyPath),
        };
    } catch (cause) {
        throw new Error(
            'No se pudieron cargar los certificados HTTPS de desarrollo. Ejecuta npm run https:setup.',
            {cause},
        );
    }
};
