# MC Monorepo

Monorepo que contiene el frontend, el motor de juego, los contratos compartidos y los datos de Marvel Champions.

## Estructura

```
mc-monorepo/
├── packages/
│   ├── mc-frontend/    # Frontend con Lit-Element
│   ├── mc-back/        # Backend Express + Socket.IO
│   ├── mc-endpoints/   # Contratos REST y eventos Socket.IO
│   ├── mc-shared/      # Constantes e identificadores del juego
│   └── mc-data/        # Acceso a MongoDB y catálogo inicial
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
└── package.json
```

## Requisitos

- Node.js 20+
- Docker y Docker Compose (para MongoDB local en contenedor o el stack completo)
- MongoDB 7+ con `mongod` en el `PATH` (para el modo `start:all:local`)

## Instalación Local

```bash
# Instalar dependencias de todas las aplicaciones
npm install
```

El backend usa `MONGODB_URI` (por defecto `mongodb://localhost:27017`) y `MONGODB_DATABASE` (por defecto `mc`). `npm run start:all` usa MongoDB en Docker y ejecuta frontend/backend en el host; es equivalente a `npm run start:all:docker`. Para iniciar MongoDB como proceso local usa `npm run start:all:local`, que reutiliza una instancia activa o ejecuta `mongod` con los datos en `.local/mongodb`. `MONGODB_DB_PATH` y `MONGOD_BIN` permiten cambiar la ruta de datos y el ejecutable. El contenedor Docker persiste en `mc-mongodb-data` y queda activo al cerrar la aplicación; usa `npm run mongo:down` para detenerlo. `npm run docker:up` levanta los tres servicios en contenedores.

Al arrancar, `mc-data` añade automáticamente los registros iniciales que falten. Para volver a aplicar el catálogo empaquetado manualmente:

```bash
npm run seed:data
```

En Docker, `docker-compose` inicia MongoDB con un volumen persistente; el backend espera a que esté saludable y carga los registros iniciales que falten.

## Scripts Disponibles

### Desarrollo Local

```bash
# Iniciar frontend (puerto 8000)
npm run start:frontend

# Iniciar backend (puerto 3000)
npm run start:backend

# MongoDB Docker y frontend/backend locales (modo predeterminado)
npm run start:all

# MongoDB local y frontend/backend locales
npm run start:all:local

# Seleccionar explícitamente MongoDB en Docker
npm run start:all:docker

# Iniciar o detener solo MongoDB
npm run mongo:up
npm run mongo:down
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

### Calidad de Código

```bash
# Verificar código y estilo (todo el proyecto)
npm run lint

# Corregir errores automáticamente
npm run lint:fix
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
- Contratos REST y eventos Socket.IO compartidos entre frontend y backend

### Datos (mc-data y mc-shared)
- `mc-data` lee las configuraciones de héroes, escenarios, sets y cartas de aspecto desde las colecciones MongoDB `heroes`, `scenarios`, `sets` y `aspects`.
- `mc-data/seed/catalog/` separa los JSON por héroe, escenario y set; deja los archivos de aspecto directamente en `aspects/`, agrupados por aspecto y tipo, por ejemplo `aspects/aggression-allies.json`. Los precon de héroes referencian esas cartas y `mc-data` las resuelve al entregar su configuración.
- Al arrancar, `mc-data` carga solo los registros que falten; `npm run seed:data` vuelve a reemplazar los documentos del seed con los valores empaquetados.
- `mc-shared` define los identificadores estables que usan el motor del backend y las configuraciones guardadas en MongoDB.

## Desarrollo con Docker

Para desarrollar con frontend y backend locales (y depurarlos desde el IDE), usa `npm run start:all`; solo MongoDB se ejecuta en Docker. Para ejecutar los tres servicios en contenedores, usa `npm run docker:up`.

Para desarrollar el stack completo en Docker con hot-reload:

```bash
docker-compose up
```

Los cambios en los archivos se sincronizarán automáticamente con los contenedores gracias a los volúmenes configurados. El backend carga en MongoDB los registros iniciales que falten cuando arranca.

## Notas

- Las aplicaciones están comunicadas a través de la red `mc-network`
- El backend depende del frontend (se inicia después)
- Los volúmenes compartidos permiten desarrollo en tiempo real
