# Arranque por entorno

Este documento resume cómo arrancar la app según el entorno que quieras usar.

## 1) Local directo (sin Docker)

Usa este modo para depurar el proyecto sin Nginx.

```bash
test -f .env || cp .env.local.example .env
npm install
npm run start:all:local
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
USE_HTTPS=false
```

`npm run start:all` no es este modo: ejecuta la aplicación en el host, pero usa Docker para MongoDB y Mailpit. Para no usar Docker, utiliza `npm run start:all:local`.

## 2) Docker local (estable)

La configuración predeterminada usa los puertos publicados en el host. Compose también inicia `mc-gateway`, pero con `USE_PORTS_IN_URL=true` el navegador se conecta directamente a cada puerto y no pasa por el gateway.

1. Copia la config del entorno Docker:
   ```bash
   test -f .env || cp .env.docker.example .env
   ```
2. Arranca la pila:
   ```bash
   docker compose up -d --build
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
USE_HTTPS=false
```

Para probar el gateway local, configura `USE_PORTS_IN_URL=false` y abre http://localhost (puerto 80). En ese modo las URL de remotos incluyen sus prefijos, como `/match/src/remote-entry.js`. Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para ambas variantes.

## 3) Docker en AWS / producción

Estas instrucciones son para EC2 con Docker Compose. El HTTPS público termina en el balanceador o proxy frontal; el `mc-gateway` de Compose escucha por HTTP en el puerto 80. Con `USE_HTTPS=false`, las llamadas entre contenedores también usan HTTP. No hace falta cambiar el `.env` de AWS para separar esos protocolos.

```bash
git pull --ff-only
test -f .env || cp .env.aws.example .env
grep -E '^(PUBLIC_IP|PROTOCOL|USE_HTTPS|USE_PORTS_IN_URL|PORT_GATEWAY|SESSION_COOKIE_SECURE)=' .env
docker compose config --quiet
docker compose up -d --build
docker compose up -d --force-recreate mc-gateway
docker compose ps
docker compose exec mc-gateway wget -qO- http://mc-match-creation:3001/healthz
docker compose exec mc-gateway wget -qO- http://mc-deck-service:3002/healthz
curl -fsS https://mc-rrr.com/api/creation/healthz
curl -fsS https://mc-rrr.com/api/deck/healthz
```

No ejecutes la copia del ejemplo sobre un `.env` existente: podría reemplazar valores propios del despliegue. Los valores públicos esperados son `PUBLIC_IP=mc-rrr.com`, `PROTOCOL=https`, `USE_HTTPS=false`, `USE_PORTS_IN_URL=false`, `PORT_GATEWAY=80` y `SESSION_COOKIE_SECURE=true`. En el Security Group, permite el puerto 80 desde el balanceador/proxy; el puerto 443 debe terminar en ese componente. El Compose actual no configura TLS directo en el puerto 443 de EC2.

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

Después de recrear servicios backend, recrea también `mc-gateway`: Nginx puede conservar las IP upstream anteriores hasta que reinicia.
