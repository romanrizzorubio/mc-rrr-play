import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vite';
import {getDevelopmentHttpsOptions} from '../dev-https.js';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({command}) => ({
    root: packageRoot,
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    server: {
        host: '0.0.0.0',
        port: 8000,
        strictPort: true,
        ...(command === 'serve' ? {https: getDevelopmentHttpsOptions()} : {}),
    },
    build: {
        target: 'es2022',
    },
}));
