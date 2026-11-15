import {generateAppConfig} from './generate-app-config.js';
import {loadEnvironmentFile} from './load-environment-file.js';

export const configureLocalApp = root => {
    loadEnvironmentFile(root);
    process.env.USE_HTTPS ??= 'false';
    const localProtocol = process.env.USE_HTTPS === 'false' ? 'http' : 'https';
    process.env.PROTOCOL ??= localProtocol;
    if (process.env.PROTOCOL !== localProtocol) {
        throw new Error(
            `Local startup requires PROTOCOL=${localProtocol} when USE_HTTPS=${process.env.USE_HTTPS}.`,
        );
    }

    generateAppConfig(root);
};
