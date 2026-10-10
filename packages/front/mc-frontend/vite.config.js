import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vite';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    root: packageRoot,
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    server: {
        host: '0.0.0.0',
        port: 8000,
        strictPort: true,
    },
    build: {
        target: 'es2022',
    },
});
