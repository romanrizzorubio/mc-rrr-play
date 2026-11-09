# MC RRR Play - Configuración de Despliegue

Este proyecto soporta tres modos principales de configuración según el entorno: Desarrollo Local, Docker Local (Gateway) y Producción (AWS).

## Resumen de Escenarios

| Escenario | Conexión | `USE_PORTS_IN_URL` | `PUBLIC_IP` | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Desarrollo Local** | Directa (Puertos) | `true` | `localhost` | Ideal para depuración rápida sin Nginx. |
| **Docker Local** | Puertos directos, sin Nginx | `true` | `localhost` | Configuración estable para local; evita self-proxy y 502. |
| **Producción (AWS)** | Gateway (SSL/ALB) | `false` | `dominio.com` | Configuración final tras balanceador o proxy. |

> Importante: no se usa `local.mc-rrr.com` en local. Usa `localhost` o tu propio dominio añadido a `hosts`, pero el Nginx solo debe activarse para AWS/producción.

## Importancia del Gateway (Nginx)

El uso del Gateway (`USE_PORTS_IN_URL=false`) es obligatorio en entornos productivos y altamente recomendado en Docker por dos razones críticas:

1.  **CORS y Seguridad**: Centraliza todo el tráfico en el puerto 80 (o 443), evitando que el navegador bloquee peticiones entre diferentes puertos y permitiendo el uso de cookies `Secure` de forma consistente.
2.  **Resolución de Módulos ESM**: Los microfrontends se cargan como módulos ESM. Al usar el Gateway, las importaciones internas de un remoto (ej. `import './src/component.js'`) se resuelven contra la ruta del servicio (ej. `http://localhost/deck/src/component.js`) en lugar de la raíz del servidor, lo que previene errores 404.

---

## 1. Desarrollo Local (npm run start:all)

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

El arranque local lee `.env` y regenera `app-config.json` con esos valores; con `USE_HTTPS=false` y `PROTOCOL=http`, abre la aplicación en `http://localhost:8000`.

---

## 2. Docker Local con Gateway (Recomendado)

Usa Docker Compose y Nginx como puerta de enlace única en el puerto 80 (o el definido en `PORT_GATEWAY`). Evita problemas de CORS y carga de módulos microfrontend en navegadores estrictos.

**Configuración (.env):**
```env
PUBLIC_IP=localhost
PROTOCOL=http
USE_PORTS_IN_URL=false
PORT_GATEWAY=80
```

**Acceso:** http://localhost (a través del puerto 80).

---

## 3. Despliegue en AWS (EC2 / ECS)

Para despliegues tras un balanceador (ALB) o con terminación SSL externa, se unifica todo el tráfico en el puerto 80 del contenedor, y Nginx redirige por rutas.

### Pasos para configurar:

1. **Crear archivo .env**:
   ```env
   PUBLIC_IP=mc-rrr.com
   PROTOCOL=https
   USE_HTTPS=false
   USE_PORTS_IN_URL=false
   PORT_GATEWAY=80
   SESSION_COOKIE_SECURE=true
   ```
   
2. **Puertos en Security Group**:
   - Abrir solo el puerto **80** (o 443 si apuntas directamente al EC2).

3. **Despliegue**:
   ```bash
   docker compose up -d --build
   ```

Con esta configuración, Nginx (`mc-gateway`) se encarga de repartir el tráfico internamente por rutas (`/api/...`, `/match/...`, `/deck/...`, etc.) basándose en la configuración definida en `nginx.conf`.
