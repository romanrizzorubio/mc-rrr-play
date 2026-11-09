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
PROTOCOL=http         # O https si ejecutaste npm run https:setup
USE_PORTS_IN_URL=true
USE_HTTPS=false       # O true si usas certificados locales
```

**Puertos necesarios:** 8000 (Frontend), 8100-8400 (Remotos), 3000-3003 (APIs).

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
