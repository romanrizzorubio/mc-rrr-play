import fs from 'fs';
import path from 'path';

const publicIp = process.env.PUBLIC_IP || 'localhost';
const protocol = process.env.PROTOCOL || 'https';
const usePorts = process.env.USE_PORTS_IN_URL !== 'false';

const getUrl = (port) => {
  const portSuffix = usePorts ? `:${port}` : '';
  return `${protocol}://${publicIp}${portSuffix}`;
};

const config = {
  services: {
    match: getUrl(3000),
    matchCreation: getUrl(3001),
    deck: getUrl(3002),
    users: getUrl(3003)
  },
  remotes: {
    mcMatch: `${getUrl(8100)}/remoteEntry.js`,
    mcDeck: `${getUrl(8200)}/remoteEntry.js`,
    mcStatic: `${getUrl(8300)}/remoteEntry.js`,
    mcUsers: `${getUrl(8400)}/remoteEntry.js`
  }
};

const configPath = path.join(process.cwd(), 'packages/front/mc-frontend/public/app-config.json');

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`Generated app-config.json with PUBLIC_IP=${publicIp}`);
