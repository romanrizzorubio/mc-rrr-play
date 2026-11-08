import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vite';
import {getDevelopmentHttpsOptions} from '../dev-https.js';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

const remoteEntryDevRoute = {
    name: 'mc-users-remote-entry-dev-route',
    configureServer(server) {
        server.middlewares.use((req, _res, next) => {
            if (req.url === '/remoteEntry.js') {
                req.url = '/src/remote-entry.js';
            }

            next();
        });
    },
};

const healthCheck = {
    name: 'mc-users-health-check',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            if (req.url === '/healthz') {
                res.statusCode = 200;
                res.end('ok');
                return;
            }
            next();
        });
    },
};

export default defineConfig(({command}) => ({
    plugins: [remoteEntryDevRoute, healthCheck],
    root: packageRoot,
    publicDir: false,
    server: {
        host: '0.0.0.0',
        port: 8400,
        strictPort: true,
        cors: true,
        allowedHosts: true,
        hmr: {
            clientPort: process.env.PORT_GATEWAY || 80,
        },
        ...(command === 'serve' && process.env.USE_HTTPS !== 'false' ? {https: getDevelopmentHttpsOptions()} : {}),
        fs: {
            allow: [repositoryRoot],
        },
    },
    build: {
        target: 'es2022',
        lib: {
            entry: resolve(packageRoot, 'src/remote-entry.js'),
            formats: ['es'],
            fileName: () => 'remoteEntry.js',
        },
        rollupOptions: {
            output: {
                chunkFileNames: 'chunks/[name]-[hash].js',
            },
        },
    },
}));
