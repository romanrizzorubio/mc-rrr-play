import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, it} from 'node:test';

import {configureLocalApp} from '../utils/configure-local-app.js';

describe('local app configuration', () => {
    it('loads HTTP settings from .env and generates HTTP service and remote URLs', async () => {
        const root = await mkdtemp(join(tmpdir(), 'mc-local-app-config-'));
        const publicDirectory = join(root, 'packages/front/mc-frontend/public');
        const envKeys = [
            'APP_ENV',
            'PUBLIC_IP',
            'PROTOCOL',
            'USE_PORTS_IN_URL',
            'USE_HTTPS',
        ];
        const previousEnvironment = new Map(
            envKeys.map(key => [key, process.env[key]]),
        );

        try {
            for (const key of envKeys) {
                delete process.env[key];
            }
            await mkdir(publicDirectory, {recursive: true});
            await writeFile(
                join(root, '.env'),
                'PUBLIC_IP=localhost\nPROTOCOL=http\nUSE_PORTS_IN_URL=true\nUSE_HTTPS=false\n',
            );

            configureLocalApp(root);

            assert.equal(process.env.USE_HTTPS, 'false');
            assert.equal(process.env.PROTOCOL, 'http');
            const config = JSON.parse(await readFile(
                join(publicDirectory, 'app-config.json'),
                'utf8',
            ));
            const urls = [...Object.values(config.services), ...Object.values(config.remotes)];
            assert.ok(urls.every(url => new URL(url).protocol === 'http:'));
        } finally {
            for (const [key, value] of previousEnvironment) {
                if (typeof value === 'undefined') {
                    delete process.env[key];
                } else {
                    process.env[key] = value;
                }
            }
            await rm(root, {recursive: true, force: true});
        }
    });
});
