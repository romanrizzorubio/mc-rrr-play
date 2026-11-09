import fs from 'node:fs';
import path from 'node:path';

export const generateAppConfig = (root = process.cwd()) => {
    const publicIp = process.env.PUBLIC_IP || 'localhost';
    const protocol = process.env.PROTOCOL || 'http';
    const usePorts = process.env.USE_PORTS_IN_URL !== 'false';

    const getServiceUrl = (port, pathPrefix = '') => {
        const normalizedPrefix = pathPrefix && !pathPrefix.startsWith('/') ? `/${pathPrefix}` : (pathPrefix || '');
        const host = usePorts ? `${protocol}://${publicIp}:${port}` : `${protocol}://${publicIp}`;
        const baseUrl = `${host}${normalizedPrefix}`.replace(/\/+$/, '');
        return `${baseUrl}/`;
    };

    const getUserServiceUrl = () => {
        if (usePorts) {
            return `${protocol}://${publicIp}:3003/`;
        }

        return `${protocol}://${publicIp}/api/auth/`;
    };

    const getRemoteEntryUrl = (port, pathPrefix = '') => {
        const normalizedPrefix = pathPrefix && !pathPrefix.startsWith('/') ? `/${pathPrefix}` : (pathPrefix || '');
        const host = usePorts ? `${protocol}://${publicIp}:${port}` : `${protocol}://${publicIp}`;
        return `${host}${normalizedPrefix}/src/remote-entry.js`;
    };

    const config = {
        services: {
            match: getServiceUrl(3000, usePorts ? '' : '/api/match'),
            matchCreation: getServiceUrl(3001, usePorts ? '' : '/api/creation'),
            deck: getServiceUrl(3002, usePorts ? '' : '/api/deck'),
            users: getUserServiceUrl(),
        },
        remotes: {
            mcMatch: getRemoteEntryUrl(8100, usePorts ? '' : '/match'),
            mcDeck: getRemoteEntryUrl(8200, usePorts ? '' : '/deck'),
            mcStatic: getRemoteEntryUrl(8300, usePorts ? '' : '/static'),
            mcUsers: getRemoteEntryUrl(8400, usePorts ? '' : '/users'),
        },
    };

    const configPath = path.join(root, 'packages/front/mc-frontend/public/app-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Generated app-config.json with PUBLIC_IP=${publicIp}`);
};
