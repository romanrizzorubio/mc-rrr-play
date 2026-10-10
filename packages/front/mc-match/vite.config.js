import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vite';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

const remoteEntryDevRoute = {
    name: 'mc-match-remote-entry-dev-route',
    configureServer(server) {
        server.middlewares.use((req, _res, next) => {
            if (req.url === '/remoteEntry.js') {
                req.url = '/src/remote-entry.js';
            }

            next();
        });
    },
};

export default defineConfig({
    plugins: [remoteEntryDevRoute],
    root: packageRoot,
    publicDir: false,
    server: {
        host: '0.0.0.0',
        port: 8100,
        strictPort: true,
        cors: true,
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
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
});
