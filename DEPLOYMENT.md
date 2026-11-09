# MC RRR Play - Configuración de Despliegue

Este proyecto tiene tres entornos: desarrollo local, Docker local y producción en AWS. Docker local admite acceso directo por puertos (predeterminado) o el gateway para probar una topología más parecida a producción.

## Resumen de Escenarios

| Escenario | Conexión | `USE_PORTS_IN_URL` | `PUBLIC_IP` | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Desarrollo Local** | Directa (puertos) | `true` | `localhost` | `npm run start:all:local`; HTTP por defecto. |
| **Docker Local** | Puertos directos (predeterminado) o Gateway | `true` o `false` | `localhost` | `.env.docker.example` usa puertos directos; el gateway es opcional. |
| **Producción (AWS)** | Gateway detrás de terminación TLS | `false` | `dominio.com` | El gateway de Compose recibe HTTP en el puerto 80. |

En Docker Compose el contenedor `mc-gateway` se inicia junto con el resto de servicios. El navegador solo lo usa cuando `USE_PORTS_IN_URL=false`. No se necesita `local.mc-rrr.com`: para local usa `localhost`.

## Importancia del Gateway (Nginx)

El Gateway (`USE_PORTS_IN_URL=false`) es obligatorio en producción y opcional en Docker local. Cuando se usa:

1.  **CORS y Seguridad**: Centraliza el tráfico en el puerto 80 del gateway; si la URL pública usa HTTPS, TLS termina en el ALB o proxy frontal. Esto evita peticiones del navegador entre diferentes puertos y permite usar cookies `Secure` de forma consistente.
2.  **Resolución de Módulos ESM**: Los microfrontends se cargan como módulos ESM. Al usar el Gateway, las importaciones internas de un remoto (ej. `import './src/component.js'`) se resuelven contra la ruta del servicio (ej. `http://localhost/deck/src/component.js`) en lugar de la raíz del servidor, lo que previene errores 404.

---

## 1. Desarrollo Local directo (npm run start:all:local)

En este modo, cada servicio escucha en su puerto y el frontend se comunica directamente con ellos. 

**Configuración (.env):**
```env
PUBLIC_IP=localhost
PROTOCOL=http         # Si usas HTTPS, cambia también USE_HTTPS a true
USE_PORTS_IN_URL=true
USE_HTTPS=false       # Para HTTPS, cambia también PROTOCOL a https
```

**Puertos necesarios:** 8000 (Frontend), 8100, 8200, 8300 y 8400 (Remotos), 3000-3003 (APIs). Si se usa MailDev local, también 1025 y 8025.

Antes de iniciar, `npm run start:all:local` comprueba esos puertos y se detiene con comandos para liberar los que ya estén ocupados. MongoDB no se termina ni se comprueba como puerto libre: si ya está disponible, el arranque local lo reutiliza. Este control no se ejecuta en modo Docker.

El arranque local lee `.env` y regenera `app-config.json` con esos valores; con `USE_HTTPS=false` y `PROTOCOL=http`, abre la aplicación en `http://localhost:8000`. `npm run start:all` es un modo distinto: ejecuta la aplicación en el host y usa Docker para MongoDB y Mailpit.

---

## 2. Docker Local por puertos directos (predeterminado)

Usa `.env.docker.example` para que el navegador se conecte a los puertos publicados de cada contenedor. Compose inicia también `mc-gateway`, pero no se utiliza para las URL de la aplicación en este modo.

**Configuración (.env):**
```env
PUBLIC_IP=localhost
PROTOCOL=http
USE_PORTS_IN_URL=true
USE_HTTPS=false
PORT_GATEWAY=80
```

**Arranque:** `docker compose up -d --build`.

**Acceso:** `http://localhost:8000`; los remotos usan directamente los puertos 8100, 8200, 8300 y 8400.

---

## 3. Docker Local a través del Gateway (opcional)

Usa este modo para probar localmente el enrutamiento por prefijos de producción.

**Configuración (.env):**
```env
PUBLIC_IP=localhost
PROTOCOL=http
USE_PORTS_IN_URL=false
PORT_GATEWAY=80
```

**Acceso:** http://localhost (a través del puerto 80).

---

## 4. Despliegue en AWS con Docker Compose (EC2)

El HTTPS público termina en el ALB o proxy frontal. El `mc-gateway` de este Compose escucha por HTTP en el puerto 80 y enruta las peticiones a los contenedores. Con `USE_HTTPS=false`, las llamadas entre servicios backend también son HTTP; `PROTOCOL=https` se usa para las URL públicas del navegador.

### Configuración

El archivo `.env.aws.example` contiene los valores de la aplicación. En una instancia existente, conserva el `.env`: no lo sobrescribas con el ejemplo. Los valores relevantes son:

```env
PUBLIC_IP=mc-rrr.com
PROTOCOL=https
USE_HTTPS=false
USE_PORTS_IN_URL=false
PORT_GATEWAY=80
SESSION_COOKIE_SECURE=true
```

El Security Group de EC2 debe permitir el puerto 80 desde el ALB/proxy frontal, no desde todos los orígenes. El HTTPS público (443) termina en el ALB/proxy; el Compose actual no configura un listener TLS en el puerto 443 de EC2. No abras los puertos internos de los servicios backend a Internet.

### Actualizar y desplegar

Desde la raíz del repositorio en EC2, actualiza el código y crea `.env` solo si aún no existe:

```bash
git pull --ff-only
test -f .env || cp .env.aws.example .env
docker compose config --quiet
docker compose up -d --build
docker compose up -d --force-recreate mc-gateway
```

Recrear el gateway después de los servicios backend hace que Nginx vuelva a resolver sus IP internas, que pueden cambiar al recrear contenedores. No uses `docker compose down -v`: eliminaría los datos persistidos de MongoDB.

Comprueba desde el gateway y desde el dominio público:

```bash
docker compose exec mc-gateway wget -qO- http://mc-match-creation:3001/healthz
docker compose exec mc-gateway wget -qO- http://mc-deck-service:3002/healthz
curl -fsS https://mc-rrr.com/api/creation/healthz
curl -fsS https://mc-rrr.com/api/deck/healthz
```

Para instrucciones generales de arranque y las URL de acceso por entorno, consulta [STARTING.md](STARTING.md). Estas instrucciones de despliegue son para EC2 con Docker Compose; ECS requiere actualizar la definición de tarea y desplegar el servicio correspondiente.
