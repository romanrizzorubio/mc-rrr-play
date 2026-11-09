import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vite';
import {getDevelopmentHttpsOptions} from '../dev-https.js';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

const remoteEntryDevRoute = {
    name: 'mc-static-remote-entry-dev-route',
    configureServer(server) {
        server.middlewares.use((req, _res, next) => {
            if (req.url.endsWith('/remoteEntry.js')) {
                req.url = '/src/remote-entry.js';
            }
            next();
        });
    },
};

const healthCheck = {
    name: 'mc-static-health-check',
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
    base: process.env.USE_PORTS_IN_URL === 'false' ? '/static/' : '/',
    plugins: [remoteEntryDevRoute, healthCheck],
    root: packageRoot,
    publicDir: resolve(packageRoot, 'src/assets'),
    server: {
        host: '0.0.0.0',
        port: 8300,
        strictPort: true,
        cors: true,
        allowedHosts: true,
        hmr: {
            path: '/static/',
            clientPort: process.env.PORT_GATEWAY || 80,
        },
        ...(command === 'serve' && process.env.USE_HTTPS !== 'false' ? {https: getDevelopmentHttpsOptions()} : {}),
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
