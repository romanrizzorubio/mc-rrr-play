import {copyFile, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const certificateDirectory = resolve(projectRoot, '.local/certs');
const keyPath = resolve(certificateDirectory, 'localhost-key.pem');
const certificatePath = resolve(certificateDirectory, 'localhost.pem');

await mkdir(certificateDirectory, {recursive: true});

const installResult = spawnSync('mkcert', ['-install'], {stdio: 'inherit'});
if (installResult.error || installResult.status !== 0) {
    throw new Error(
        'No se pudo ejecutar mkcert -install. Instala mkcert y vuelve a intentarlo.',
        {cause: installResult.error},
    );
}

const certificateResult = spawnSync('mkcert', [
    '-key-file',
    keyPath,
    '-cert-file',
    certificatePath,
    'localhost',
    '127.0.0.1',
    '::1',
    'mc-backend',
    'mc-user-service',
    'mc-match-creation',
    'mc-deck-service',
    'mc-frontend',
    'mc-match',
    'mc-deck',
    'mc-static',
    'mc-users',
], {stdio: 'inherit'});
if (certificateResult.error || certificateResult.status !== 0) {
    throw new Error('No se pudo generar el certificado HTTPS local con mkcert.', {
        cause: certificateResult.error,
    });
}

const caResult = spawnSync('mkcert', ['-CAROOT'], {encoding: 'utf8'});
if (caResult.error || caResult.status !== 0 || !caResult.stdout.trim()) {
    throw new Error('No se pudo localizar la autoridad certificadora local de mkcert.', {
        cause: caResult.error,
    });
}

await copyFile(
    resolve(caResult.stdout.trim(), 'rootCA.pem'),
    resolve(certificateDirectory, 'rootCA.pem'),
);
console.log(`Certificados HTTPS locales preparados en ${certificateDirectory}`);
