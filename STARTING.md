# Arranque por entorno

Este documento resume cómo arrancar la app según el entorno que quieras usar.

## 1) Local directo (sin Docker)

Usa este modo para depurar el proyecto sin Nginx.

```bash
cp .env.local.example .env
npm install
npm run start:all
```

Acceso esperado:
- Frontend: http://localhost:8000
- Match remote: http://localhost:8100/src/remote-entry.js
- Deck remote: http://localhost:8200/src/remote-entry.js
- Static remote: http://localhost:8300/src/remote-entry.js
- Users remote: http://localhost:8400/src/remote-entry.js

Configuración clave:
```env
USE_PORTS_IN_URL=true
PUBLIC_IP=localhost
PROTOCOL=http
```

## 2) Docker local (estable)

Este modo usa los puertos directos del host y es la configuración más fiable para Docker local. El gateway de Nginx sobre `localhost` puede entrar en un bucle de self-proxy y devolver 502.

No uses `local.mc-rrr.com` como host local: esa URL ya no forma parte de la configuración soportada. Para ejecutar localmente usa `localhost` o un dominio propio que añadas a tu `/etc/hosts`, pero nunca el gateway de Nginx por defecto en local.

1. Copia la config del entorno Docker:
   ```bash
   cp .env.docker.example .env
   ```
2. Arranca la pila:
   ```bash
   docker compose up -d --build
   ```

Acceso esperado:
- Frontend: http://localhost:8000
- Match remote: http://localhost:8100/match/src/remote-entry.js
- Deck remote: http://localhost:8200/deck/src/remote-entry.js
- Static remote: http://localhost:8300/static/src/remote-entry.js
- Users remote: http://localhost:8400/users/src/remote-entry.js

Configuración clave:
```env
USE_PORTS_IN_URL=true
PUBLIC_IP=localhost
PROTOCOL=http
```

Nota importante: en Docker local la opción gateway en `:80` no es la recomendación por defecto porque `localhost` dentro del contenedor puede hacer auto-proxy y responder 502. La configuración estable es usar los puertos directos del host.

## 3) Docker en AWS / producción

Usa este modo cuando la app se sirve detrás de un dominio público o balanceador.

```bash
cp .env.aws.example .env
docker compose up -d --build
```

Acceso esperado:
- Frontend: https://mc-rrr.com/
- Match remote: https://mc-rrr.com/match/src/remote-entry.js
- Deck remote: https://mc-rrr.com/deck/src/remote-entry.js
- Static remote: https://mc-rrr.com/static/src/remote-entry.js
- Users remote: https://mc-rrr.com/users/src/remote-entry.js

Configuración clave:
```env
USE_PORTS_IN_URL=false
PUBLIC_IP=mc-rrr.com
PROTOCOL=https
PORT_GATEWAY=80
SESSION_COOKIE_SECURE=true
```

## Nota importante

El punto clave para que funcione todo es usar la ruta real del módulo Vite en cada entorno:

- Local: `/src/remote-entry.js` sobre cada puerto.
- Gateway: `/match/src/remote-entry.js`, `/deck/src/remote-entry.js`, etc.

No uses `remoteEntry.js` directo como URL pública. Vite lo reescribe internamente a `src/remote-entry.js`.
