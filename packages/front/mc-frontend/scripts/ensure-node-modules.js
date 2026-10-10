import { lstat, symlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendNodeModules = resolve(frontendRoot, 'node_modules');
const rootNodeModules = resolve(frontendRoot, '../../node_modules');

try {
    await lstat(frontendNodeModules);
} catch (error) {
    if (error.code !== 'ENOENT') {
        throw error;
    }

    await lstat(rootNodeModules);
    await symlink(rootNodeModules, frontendNodeModules, process.platform === 'win32' ? 'junction' : 'dir');
}
