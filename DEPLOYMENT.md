# MC RRR Play - Configuración de Despliegue

Este proyecto está configurado para desplegarse fácilmente usando Docker, especialmente en entornos de nube como AWS EC2.

## Configuración de Red e IP Pública

Para despliegues en AWS tras un balanceador o con terminación SSL externa, se recomienda usar el modo **HTTP** (puerto 80).

### Pasos para configurar (Opción recomendada: Proxy Unificado):

1. **Crear archivo .env**:
   Copia la plantilla y ajusta los valores:
   ```env
   PUBLIC_IP=mc-rrr.com
   PROTOCOL=https
   USE_HTTPS=false
   USE_PORTS_IN_URL=false
   PORT_GATEWAY=80
   SESSION_COOKIE_SECURE=true
   ```
   
2. **Despliegue**:
   ```bash
   docker compose up -d --build
   ```

Con esta configuración, **solo necesitas abrir el puerto 80 (o 443 en el ALB)**. Nginx (`mc-gateway`) se encarga de repartir el tráfico internamente por rutas (`/api/...`, `/static/...`, etc.).

## Puertos requeridos en AWS Security Group (Con Proxy Unificado):

- **80 (o 443)**: Todo el tráfico (Frontend, APIs y Remotos) se unifica aquí.

## Puertos requeridos en AWS Security Group (Sin Proxy - Opción 1):

Si estableces `USE_PORTS_IN_URL=true`, deberás abrir:
- **80**: Frontend principal.
- **3000-3003**: Servicios Backend (API).
- **8100-8400**: Micro-frontends (Remotos).
