# MC RRR Play - Configuración de Despliegue

Este proyecto está configurado para desplegarse fácilmente usando Docker, especialmente en entornos de nube como AWS EC2.

## Configuración de Red e IP Pública

Para despliegues en AWS tras un balanceador o con terminación SSL externa, se recomienda usar el modo **HTTP** (puerto 80).

### Pasos para configurar:

1. **Crear archivo .env**:
   Copia la plantilla y ajusta los valores:
   ```bash
   cp .env.template .env
   ```
   
   Asegúrate de configurar:
   - `PUBLIC_IP`: Tu IP pública o dominio.
   - `USE_HTTPS`: `false` (para que AWS gestione el SSL).
   - `PROTOCOL`: `http`.
   - `PORT_FRONTEND`: `80`.

2. **Despliegue**:
   Docker Compose configurará los orígenes CORS y el frontend para funcionar por el puerto 80 sin TLS interna.
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

## Puertos requeridos en AWS Security Group:

- **80**: Frontend (HTTP estándar)
- **3000-3003**: Servicios Backend (API)
- **8100-8400**: Micro-frontends (Remotos)
- **8025**: Mailpit (Opcional, para correos)
