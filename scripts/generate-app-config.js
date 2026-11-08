import fs from 'fs';
import path from 'path';

const publicIp = process.env.PUBLIC_IP || 'localhost';
const protocol = process.env.PROTOCOL || 'https';

const config = {
  services: {
    match: `${protocol}://${publicIp}:3000`,
    matchCreation: `${protocol}://${publicIp}:3001`,
    deck: `${protocol}://${publicIp}:3002`,
    users: `${protocol}://${publicIp}:3003`
  },
  remotes: {
    mcMatch: `${protocol}://${publicIp}:8100/remoteEntry.js`,
    mcDeck: `${protocol}://${publicIp}:8200/remoteEntry.js`,
    mcStatic: `${protocol}://${publicIp}:8300/remoteEntry.js`,
    mcUsers: `${protocol}://${publicIp}:8400/remoteEntry.js`
  }
};

const configPath = path.join(process.cwd(), 'packages/front/mc-frontend/public/app-config.json');

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log(`Generated app-config.json with PUBLIC_IP=${publicIp}`);
