# MC Monorepo

Monorepo que contiene el frontend, backend y endpoints del proyecto MC.

## Estructura

```
mc-monorepo/
├── packages/
│   ├── mc-frontend/    # Frontend con Lit-Element
│   ├── mc-back/        # Backend Express + Socket.IO
│   └── mc-endpoints/   # Módulo de endpoints
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
└── package.json
```

## Requisitos

- Node.js 20+
- Docker y Docker Compose

## Instalación Local

```bash
# Instalar dependencias de todas las aplicaciones
npm install
```

## Scripts Disponibles

### Desarrollo Local

```bash
# Iniciar frontend (puerto 8000)
npm run start:frontend

# Iniciar backend (puerto 3000)
npm run start:backend

# Iniciar ambos en paralelo
npm run start:all
```

### Docker

```bash
# Construir imágenes Docker
npm run docker:build

# Iniciar todos los servicios con Docker
npm run docker:up

# Detener los servicios
npm run docker:down

# Ver logs en tiempo real
npm run docker:logs
```

## Servicios

### Frontend (mc-frontend)
- **Tecnología**: Lit-Element 4.0, Material Web
- **Puerto**: 8000
- **Comando**: `npm run serve`
- **URL**: http://localhost:8000

### Backend (mc-back)
- **Tecnología**: Express 4.18, Socket.IO 4.7, Body-Parser, CORS
- **Puerto**: 3000
- **Comando**: `node index.js`
- **URL**: http://localhost:3000

### Endpoints (mc-endpoints)
- Módulo integrado en el backend
- Proporciona los endpoints de la API

## Desarrollo con Docker

Para desarrollar usando Docker con hot-reload:

```bash
docker-compose up
```

Los cambios en los archivos se sincronizarán automáticamente con los contenedores gracias a los volúmenes configurados.

## Notas

- Las aplicaciones están comunicadas a través de la red `mc-network`
- El backend depende del frontend (se inicia después)
- Los volúmenes compartidos permiten desarrollo en tiempo real
