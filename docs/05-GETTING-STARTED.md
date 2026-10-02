# Guía de Inicio Rápido

## Instalación y Configuración

### Requisitos Previos

- **Node.js 20+** - [Descargar](https://nodejs.org/)
- **npm** - Incluido con Node.js
- **Docker y Docker Compose** (para MongoDB local en contenedor o el stack completo)
- **MongoDB 7+ con `mongod` en el `PATH`** (solo para `start:all:local`)
- **Git** (para clonar el repositorio)

### Instalación Local

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/romanrizzorubio/mc-rrr-play.git
cd mc-rrr-play
```

#### 2. Instalar Dependencias

```bash
npm install
```

Esto instala dependencias para todos los packages del monorepo:
- `packages/mc-frontend`
- `packages/mc-back`
- `packages/mc-endpoints`
- `packages/mc-shared`
- `packages/mc-data`

#### 3. Preparar MongoDB

Elige cómo ejecutar MongoDB:

- `npm run start:all` (igual que `npm run start:all:docker`) usa el contenedor Docker y ejecuta frontend/backend en el host. Los datos persisten en `mc-mongodb-data`; `npm run mongo:down` lo detiene.
- `npm run start:all:local` reutiliza una instancia Mongo local activa o inicia `mongod`. Requiere MongoDB Community Server en el `PATH`; los datos se guardan en `.local/mongodb` y puedes cambiar la ruta con `MONGODB_DB_PATH`.
- `npm run docker:up` ejecuta frontend, backend y MongoDB en contenedores.

Para iniciar solo la base Docker antes de lanzar los servicios desde el IDE, usa `npm run mongo:up`. Al iniciar el backend con `npm run start:backend` (también desde `start:all` o `docker:up`), se ejecuta `npm run seed:data` antes de arrancarlo. Esto reemplaza en MongoDB los documentos del catálogo empaquetado por los valores definidos en los módulos JavaScript; cualquier personalización hecha directamente en MongoDB se perderá. También puedes ejecutarlo manualmente:

```bash
npm run seed:data
```

#### 4. Iniciar la Aplicación

##### Opción A: MongoDB en Docker y aplicación local

```bash
npm run start:all
```

Esto inicia MongoDB en Docker y frontend/backend en el host. Pulsa `Ctrl+C` para detener los procesos locales; el contenedor de MongoDB queda activo. La aplicación queda disponible en:
- Frontend en `http://localhost:8000`
- Backend en `http://localhost:3000`

##### Opción B: MongoDB local

Si tienes MongoDB Community Server instalado y `mongod` en el `PATH`, inicia MongoDB local junto con frontend/backend:

```bash
npm run start:all:local
```

Los datos locales se guardan en `.local/mongodb`. Para depurar frontend y backend por separado desde el IDE, usa `npm run mongo:up` y luego inicia cada aplicación individualmente.

### Instalación con Docker

#### 1. Construir Imágenes

```bash
npm run docker:build
```

#### 2. Iniciar Servicios

```bash
npm run docker:up
```

Esto inicia frontend, backend y MongoDB, todos en Docker. El backend carga el catálogo cuando MongoDB está saludable. La aplicación queda disponible en:
- Frontend en `http://localhost:8000`
- Backend en `http://localhost:3000`
- MongoDB en `mongodb://localhost:27017` (los datos persisten en el volumen `mc-mongodb-data`)
- Sincronización automática de cambios (hot-reload)

#### 3. Ver Logs

```bash
npm run docker:logs
```

#### 4. Detener Servicios

```bash
npm run docker:down
```

## Acceso a la Aplicación

Una vez iniciada la aplicación:

### Frontend
- **URL**: http://localhost:8000
- **Descripción**: Interfaz de usuario para jugar

### Backend
- **URL**: http://localhost:3000
- **Descripción**: API REST + WebSocket
- **Verificar estado**: http://localhost:3000 debería mostrar conectado

## Primer Juego

### Paso 1: Crear o Unirse a Partida

1. Abre http://localhost:8000
2. Haz clic en "Nueva Partida" o "Unirse"
3. Ingresa un nombre para la partida

### Paso 2: Seleccionar Superhéroe

1. Se muestra lista de Superhéroes disponibles
2. Haz clic en el que desees
3. Se muestra información del Superhéroe

### Paso 3: Seleccionar Escenario

1. Se muestra lista de villanos/escenarios
2. Selecciona dificultad
3. Confirma selección

### Paso 4: ¡Jugar!

1. Se inicializa la partida
2. Comienza el primer turno
3. Sigue las instrucciones en pantalla

## Conceptos Básicos Rápidos

### Recursos
- **Física** (🥋) - Usada para atacar
- **Mental** (🧠) - Usada para defensa

### Acciones
- **Jugar Carta** - Arrastra desde tu mano al tablero
- **Atacar** - Gasta física para infligir daño
- **Defender** - Gasta mental para reducir daño
- **Contraarrestar** - Gasta mental para reducir amenaza

### Objetivo
- **Victoria** - Derrota el villano (lleva su vida a 0)
- **Derrota** - Tu Superhéroe alcanza 0 vida o la amenaza del villano llega al máximo

## Solución de Problemas

### Frontend no carga

**Síntomas:** Página en blanco en localhost:8000

**Soluciones:**
1. Verifica que el servidor está ejecutándose: `npm run start:frontend`
2. Abre la consola del navegador (F12) para ver errores
3. Limpia caché: Ctrl+Shift+Del (Chrome/Firefox)

### Backend no responde

**Síntomas:** Errores de conexión al crear partida

**Soluciones:**
1. Verifica que backend corre: `node packages/mc-back/index.js`
2. Revisa que puerto 3000 está disponible
3. Mira logs: `npm run docker:logs` (si uses Docker)

### No aparecen héroes o escenarios

**Síntomas:** Las listas de selección están vacías o la creación de contenido falla.

**Soluciones:**
1. Verifica que MongoDB está activo y que `MONGODB_URI`/`MONGODB_DATABASE` apuntan a la base correcta.
2. Ejecuta `npm run seed:data` para cargar el catálogo inicial.

### Puerto ocupado

**Síntomas:** "EADDRINUSE" error

**Solución:**
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# O matar en puerto 8000
lsof -ti:8000 | xargs kill -9
```

### Cambios no reflejan

**Síntomas:** Cambios en código no aparecen en navegador

**Soluciones:**
1. Verifica hot-reload está habilitado
2. Recarga página (F5)
3. Limpia caché (Ctrl+Shift+Del)
4. Reinicia servidor: `npm run start:frontend`

## Estructura de Carpetas Útil

```
mc-rrr-play/
├── docs/                    # 📚 Esta documentación
│
├── packages/
│   ├── mc-frontend/        # 🎨 Interfaz usuario
│   │   ├── src/
│   │   │   ├── components/  # Componentes web
│   │   │   └── misc/        # Utilidades
│   │   └── index.html
│   │
│   ├── mc-back/            # 🎮 Motor de juego
│   │   ├── src/
│   │   │   ├── model/       # Entidades (Match, Player, etc)
│   │   │   ├── engine/      # Motor de reglas
│   │   │   ├── abilities/   # Capacidades de cartas
│   │   │   ├── triggers/    # Sistema de triggers
│   │   │   ├── effects/     # Efectos del juego
│   │   │   └── server/      # API REST + WebSocket
│   │   └── index.js
│   │
│   ├── mc-endpoints/       # 🔌 Contratos REST y Socket.IO
│   ├── mc-shared/          # Constantes compartidas del dominio
│   └── mc-data/            # MongoDB; catálogo JavaScript por entidad y carta de aspecto
│
├── docker-compose.yml       # Configuración Docker
├── package.json             # Monorepo config
└── README.md                # Info general

```

## Comandos Útiles

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar todo
npm run start:all

# Frontend solo
npm run start:frontend

# Backend solo
npm run start:backend
```

### Docker

```bash
# Construir imágenes
npm run docker:build

# Iniciar con Docker
npm run docker:up

# Ver logs
npm run docker:logs

# Detener servicios
npm run docker:down
```

## Próximas Lecturas

- [01-OVERVIEW.md](./01-OVERVIEW.md) - Descripción general de la aplicación
- [02-GAME-MECHANICS.md](./02-GAME-MECHANICS.md) - Cómo funciona el juego
- [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md) - Arquitectura técnica
- [04-USER-FEATURES.md](./04-USER-FEATURES.md) - Características disponibles

## Recursos Adicionales

### Marvel Champions TCG
- [Página oficial](https://www.fantasyflightgames.com/en/products/marvel-champions-the-card-game/)
- Rulebook oficial (descargable en el sitio)

### Tecnologías Utilizadas
- [Lit-Element Documentation](https://lit.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Material Web](https://github.com/material-components/material-web)

## Obtener Ayuda

### Problemas Técnicos
1. Revisa los logs en la consola del navegador (F12)
2. Verifica que todos los servicios están corriendo
3. Abre un issue en GitHub con logs y pasos para reproducir

### Reglas del Juego
- Consulta [02-GAME-MECHANICS.md](./02-GAME-MECHANICS.md)
- Revisa rulebook oficial de Marvel Champions

### Preguntas Sobre Desarrollo
- Lee [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md)
- Explora el código fuente en `packages/mc-back/src`
