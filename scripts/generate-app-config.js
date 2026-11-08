import fs from 'fs';
import path from 'path';

const publicIp = process.env.PUBLIC_IP || 'localhost';
const protocol = process.env.PROTOCOL || 'https';
const usePorts = process.env.USE_PORTS_IN_URL !== 'false';

const getUrl = (port, pathPrefix = '') => {
  const normalizedPrefix = pathPrefix && !pathPrefix.endsWith('/') ? `${pathPrefix}/` : pathPrefix;
  if (!usePorts) {
    return `${protocol}://${publicIp}${normalizedPrefix}`;
  }
  return `${protocol}://${publicIp}:${port}${normalizedPrefix}`;
};
const config = {
  services: {
    match: getUrl(3000, '/api/match'),
    matchCreation: getUrl(3001, '/api/creation'),
    deck: getUrl(3002, '/api/deck'),
    users: getUrl(3003, '/api/auth')
  },
  remotes: {
    mcMatch: `${getUrl(8100, '/match')}remoteEntry.js`,
    mcDeck: `${getUrl(8200, '/deck')}remoteEntry.js`,
    mcStatic: `${getUrl(8300, '/static')}remoteEntry.js`,
    mcUsers: `${getUrl(8400, '/users')}remoteEntry.js`
  }
};

const configPath = path.join(process.cwd(), 'packages/front/mc-frontend/public/app-config.json');

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`Generated app-config.json with PUBLIC_IP=${publicIp}`);
