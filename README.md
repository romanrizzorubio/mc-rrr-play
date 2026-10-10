# MC Monorepo

Monorepo que contiene el frontend, el motor de juego, los contratos compartidos y los datos de Marvel Champions.

## Estructura

```
mc-monorepo/
├── packages/
│   ├── front/
│   │   ├── mc-frontend/    # Carcasa Lit y creación de partidas
│   │   ├── mc-match/       # Remoto frontend para jugar
│   │   ├── mc-deck/        # Remoto frontend del editor de mazos
│   │   ├── mc-static/      # Remoto de imágenes, fuentes y estilos estáticos
│   │   └── mc-components/  # Paquete npm de componentes Lit compartidos
│   ├── back/
│   │   ├── mc-back/        # Microservicio de partidas: motor + Socket.IO
│   │   ├── mc-match-creation-service/ # API de creación y catálogo
│   │   ├── mc-deck-service/ # API y persistencia de mazos
│   │   └── mc-data/        # Acceso a MongoDB y catálogo inicial
│   └── core/
│       ├── mc-endpoints/   # Contratos REST y eventos Socket.IO
│       └── mc-shared/      # Constantes e identificadores del juego
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

Los servicios usan `MONGODB_URI` (por defecto `mongodb://localhost:27017`) y `MONGODB_DATABASE` (por defecto `mc`). `npm run start:all` usa MongoDB en Docker y ejecuta la carcasa, remotos y servicios en el host; es equivalente a `npm run start:all:docker`. Para iniciar MongoDB como proceso local usa `npm run start:all:local`, que reutiliza una instancia activa o ejecuta `mongod` con los datos en `.local/mongodb`. `MONGODB_DB_PATH` y `MONGOD_BIN` permiten cambiar la ruta de datos y el ejecutable. El contenedor Docker persiste en `mc-mongodb-data` y queda activo al cerrar la aplicación; usa `npm run mongo:down` para detenerlo. `npm run docker:up` levanta todos los servicios en contenedores.

Al arrancar, `mc-data` añade automáticamente los registros iniciales que falten. Para volver a aplicar el catálogo empaquetado manualmente:

```bash
npm run seed:data
```

En Docker, `docker-compose` inicia MongoDB con un volumen persistente; el backend espera a que esté saludable y carga los registros iniciales que falten.

## Scripts Disponibles

### Desarrollo Local

```bash
# En una terminal, iniciar primero el remoto de recursos estáticos (puerto 8300)
npm run start:mc-static

# En otra terminal, iniciar la carcasa principal (puerto 8000)
npm run start:frontend

# Iniciar remoto de juego (puerto 8100)
npm run start:mc-match

# Iniciar remoto editor de mazos (puerto 8200)
npm run start:mc-deck

# Iniciar servicio de partidas (puerto 3000)
npm run start:backend

# Iniciar servicio de creación de partidas (puerto 3001)
npm run start:match-creation

# Iniciar servicio de mazos (puerto 3002)
npm run start:mc-deck-service

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

### Carcasa (mc-frontend)
- **Tecnología**: Lit-Element 4.0, Material Web
- **Puerto**: 8000
- **Responsabilidad**: lobby, creación de partidas, navegación y carga diferida de remotos
- **URL**: http://localhost:8000

### Remotos frontend
- `mc-match` (puerto 8100): interfaz completa de juego, cargada al abrir una partida mediante ES modules nativos.
- `mc-deck` (puerto 8200): editor remoto para crear, modificar y borrar mazos.
- `mc-static` (puerto 8300): imágenes, fuentes, favicons y hojas de estilo públicas compartidas por los frontends.

Las URL de servicios y remotos se pueden ajustar en `packages/front/mc-frontend/public/app-config.json`.

### Componentes frontend compartidos
- `mc-components` es un paquete npm del monorepo, no un remoto ni un proceso independiente.
- `mc-match`, `mc-deck` y la carcasa lo declaran como dependencia; incluye elementos compartidos como el diálogo de imagen de carta.

### Servicio de partidas (mc-back)
- **Tecnología**: Express 4.18, Socket.IO 4.7, Body-Parser, CORS
- **Puerto**: 3000
- **Responsabilidad**: estado y motor de juego, persistencia de partidas y eventos Socket.IO

### Servicio de creación (mc-match-creation-service)
- **Puerto**: 3001
- **Responsabilidad**: catálogo y orquestación de la creación mediante la API interna de partidas

### Servicio de mazos (mc-deck-service)
- **Puerto**: 3002
- **Responsabilidad**: catálogo de construcción, validación y persistencia de mazos en MongoDB

### Endpoints (mc-endpoints)
- Contratos REST y eventos Socket.IO compartidos entre frontend y backend

### Datos (mc-data y mc-shared)
- `mc-data` lee las configuraciones de héroes, escenarios, sets y cartas de aspecto desde las colecciones MongoDB `heroes`, `scenarios`, `sets` y `aspects`; los mazos se guardan en `decks`.
- `mc-data/seed/catalog/` separa los módulos JavaScript por héroe, escenario y set; organiza las cartas de aspecto en subcarpetas por aspecto y tipo, por ejemplo `aspects/aggression/allies.js`. Estos módulos importan identificadores de `mc-shared`; los precon de héroes referencian las cartas de aspecto y `mc-data` las resuelve al entregar su configuración.
- Al arrancar, `mc-data` carga solo los registros que falten; `npm run seed:data` vuelve a reemplazar los documentos del seed con los valores empaquetados.
- `mc-shared` define los identificadores estables que usan el motor del backend y las configuraciones guardadas en MongoDB.

## Desarrollo con Docker

Para desarrollar con la carcasa, los remotos y microservicios locales (y depurarlos desde el IDE), usa `npm run start:all`; solo MongoDB se ejecuta en Docker. Para ejecutar todo el stack en contenedores, usa `npm run docker:up`.

Para desarrollar el stack completo en Docker con hot-reload:

```bash
docker-compose up
```

Los cambios en los archivos se sincronizarán automáticamente con los contenedores gracias a los volúmenes configurados. El backend carga en MongoDB los registros iniciales que falten cuando arranca.

## Notas

- Las aplicaciones están comunicadas a través de la red `mc-network`
- El servicio de creación consume la API interna del servicio de partidas
- Los volúmenes compartidos permiten desarrollo en tiempo real
