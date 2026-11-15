import fs from 'node:fs';
import path from 'node:path';

export const loadEnvironmentFile = (root = process.cwd()) => {
    const envFiles = [];
    const appEnv = process.env.APP_ENV;
    if (appEnv) {
        envFiles.push(path.join(root, `.env.${appEnv}`));
    }
    envFiles.push(path.join(root, '.env'));

    for (const envFile of envFiles) {
        if (!fs.existsSync(envFile)) {
            continue;
        }

        for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
            if (!match) {
                continue;
            }

            const [, key, rawValue] = match;
            if (typeof process.env[key] !== 'undefined') {
                continue;
            }

            const value = rawValue.trim();
            const unquoted = value.startsWith('"') && value.endsWith('"') ||
                value.startsWith("'") && value.endsWith("'") ?
                value.slice(1, -1) :
                value;
            process.env[key] = unquoted;
        }
    }
};
