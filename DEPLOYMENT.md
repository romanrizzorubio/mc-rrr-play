# MC RRR Play - Configuración de Despliegue

Este proyecto está configurado para desplegarse fácilmente usando Docker, especialmente en entornos de nube como AWS EC2.

## Configuración de la IP Pública

Para evitar IPs fijas ("a fuego") en el código, utilizamos la variable de entorno `PUBLIC_IP`.

### Pasos para configurar en AWS:

1. **Crear archivo .env**:
   En la raíz del proyecto, crea un archivo llamado `.env`:
   ```bash
   PUBLIC_IP=51.20.138.135
   ```
   *(Sustituye por tu IP actual si cambia)*.

2. **Despliegue**:
   Docker Compose leerá automáticamente esta variable para configurar los orígenes CORS y generar la configuración del frontend.
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

3. **Certificados HTTPS**:
   Si la IP cambia, es recomendable regenerar los certificados para incluir la nueva IP en el SAN (Subject Alternative Name), aunque para acceso vía IP con certificados autofirmados, el navegador seguirá pidiendo "Aceptar el riesgo".

## Puertos requeridos en AWS Security Group:

- **443**: Frontend (HTTPS estándar)
- **3000-3003**: Servicios Backend
- **8100-8400**: Micro-frontends (Remotos)
- **8025**: Mailpit (Opcional, para correos)
