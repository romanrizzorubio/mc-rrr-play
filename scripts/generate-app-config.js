import fs from 'fs';
import path from 'path';

const loadEnvironmentFile = () => {
  const envFiles = [];
  const appEnv = process.env.APP_ENV;
  if (appEnv) {
    envFiles.push(path.join(process.cwd(), `.env.${appEnv}`));
  }
  envFiles.push(path.join(process.cwd(), '.env'));

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

loadEnvironmentFile();

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

const configPath = path.join(process.cwd(), 'packages/front/mc-frontend/public/app-config.json');

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`Generated app-config.json with PUBLIC_IP=${publicIp}`);
