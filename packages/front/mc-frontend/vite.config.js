import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vite';
import {getDevelopmentHttpsOptions} from '../dev-https.js';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

const healthCheck = {
    name: 'mc-frontend-health-check',
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
    plugins: [healthCheck],
    root: packageRoot,
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    server: {
        host: '0.0.0.0',
        port: 8000,
        strictPort: true,
        allowedHosts: true,
        ...(command === 'serve' && process.env.USE_HTTPS !== 'false' ? {https: getDevelopmentHttpsOptions()} : {}),
    },
    build: {
        target: 'es2022',
    },
}));
