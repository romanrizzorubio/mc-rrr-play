# Guía de Inicio Rápido

## Instalación y Configuración

### Requisitos Previos

- **Node.js 20+** - [Descargar](https://nodejs.org/)
- **npm** - Incluido con Node.js
- **Docker y Docker Compose** (opcionales; solo para ejecutar servicios en contenedores)
- **mkcert** (solo para los modos con HTTPS de desarrollo)
- **MongoDB 7+ con `mongod` en el `PATH`**, o una instancia MongoDB externa configurada con `MONGODB_URI`
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
- `packages/front/mc-frontend`
- `packages/front/mc-users`
- `packages/front/mc-match`
- `packages/front/mc-deck`
- `packages/front/mc-static`
- `packages/front/mc-components`
- `packages/back/mc-back`
- `packages/back/mc-match-creation-service`
- `packages/back/mc-user-service`
- `packages/back/mc-deck-service`
- `packages/back/mc-server-utils`
- `packages/back/mc-data`
- `packages/core/mc-endpoints`
- `packages/core/mc-shared`

#### 3. Preparar HTTPS local (solo si se va a usar HTTPS)

Instala [mkcert](https://github.com/FiloSottile/mkcert) y ejecuta:

```bash
npm run https:setup
```

Ejecuta este comando una sola vez para los modos que usan HTTPS local, como `npm run start:all` o Docker con `USE_HTTPS=true`. Instala la autoridad certificadora local, genera un certificado para `localhost` y los nombres de servicio Docker, y guarda los ficheros en `.local/certs/` (excluido de Git). Confía en esa autoridad en el navegador. Los modos HTTP (`start:all:local` y la plantilla `.env.docker.example`) no necesitan estos certificados. No se ejecuta en cada arranque porque `mkcert -install` modifica la confianza del sistema. No copies certificados ni claves privadas al repositorio.

#### 4. Preparar MongoDB

Elige cómo ejecutar MongoDB:

- `npm run start:all` (igual que `npm run start:all:docker`) usa el contenedor Docker y ejecuta la carcasa, los remotos y servicios en el host. Los datos persisten en `mc-mongodb-data`; `npm run mongo:down` lo detiene.
- `npm run start:all:local` reutiliza una instancia Mongo local activa o inicia `mongod`; si `MONGODB_URI` apunta a un host externo, no inicia una base local. Para MongoDB local, requiere MongoDB Community Server en el `PATH`; los datos se guardan en `.local/mongodb` y puedes cambiar la ruta con `MONGODB_DB_PATH`.
- `npm run docker:up` ejecuta los frontends, microservicios y MongoDB en contenedores.

Para iniciar solo la base Docker antes de lanzar los servicios desde el IDE, usa `npm run mongo:up`. Si ejecutas procesos individuales con HTTPS, define las rutas del certificado y la autoridad para que Node confíe en los servicios locales:

```bash
export TLS_CERT_PATH="$PWD/.local/certs/localhost.pem"
export TLS_KEY_PATH="$PWD/.local/certs/localhost-key.pem"
export NODE_EXTRA_CA_CERTS="$PWD/.local/certs/rootCA.pem"
export SESSION_COOKIE_SECURE=true
export FRONTEND_ORIGIN=https://localhost:8000
export FRONTEND_ORIGINS=https://localhost:8000,https://localhost:8100
export AUTH_SERVICE_URL=https://localhost:3003
export MATCH_SERVICE_URL=https://localhost:3000
```

`start:all` y Docker configuran las variables necesarias para el modo elegido; en Docker, las comunicaciones internas usan HTTP cuando `USE_HTTPS=false`. Al iniciar el backend con `npm run start:backend` (también desde `start:all` o `docker:up`), se ejecuta `npm run seed:data` antes de arrancarlo. Esto reemplaza en MongoDB los documentos del catálogo empaquetado por los valores definidos en los módulos JavaScript; cualquier personalización hecha directamente en MongoDB se perderá. También puedes ejecutarlo manualmente:

```bash
npm run seed:data
```

El seed solo actualiza las colecciones del catálogo y no modifica los mazos guardados en `decks`. `./mc-monorepo.sh clean` y `docker-compose down` conservan el volumen `mc-mongodb-data`. No uses `docker-compose down -v` salvo que quieras borrar explícitamente todos los datos de MongoDB, incluidos los mazos guardados.

El servicio de usuarios necesita que `FRONTEND_ORIGIN` coincida con el origen del frontend (`http` o `https`). Las cookies se marcan como `Secure` cuando `SESSION_COOKIE_SECURE=true`; los arranques locales establecen ese valor según el protocolo elegido.

Para desarrollo, `start:all:local` inicia MailDev como servidor SMTP local sin Docker. Captura los mensajes —no los envía a direcciones reales— para que puedas abrir los enlaces de activación y recuperación desde http://localhost:8025; SMTP escucha en `127.0.0.1:1025`. `start:all` y `docker:up` usan Mailpit en Docker. Para iniciar MailDev por separado usa `npm run maildev` y detenlo con `Ctrl+C`; al iniciar solo el servicio de usuarios, ejecuta MailDev en otra terminal y configura `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025` y `SMTP_FROM='MC RRR Play <noreply@localhost>'`.

Para usar un proveedor SMTP real, configura sus valores antes de iniciar `start:all`:

```bash
export SMTP_HOST=smtp.example.com
export SMTP_PORT=587
export SMTP_USER=usuario-smtp
export SMTP_PASSWORD=contraseña-smtp
export SMTP_FROM='MC RRR Play <noreply@example.com>'
```

`SMTP_USER` y `SMTP_PASSWORD` deben configurarse juntos o dejarse ambos vacíos si el servidor permite envío sin autenticación. Docker Compose también lee estas variables de un archivo `.env` local y permite reemplazar los valores predeterminados de Mailpit. No guardes credenciales SMTP en el repositorio.

Los permisos de administrador se guardan en el campo `isAdmin` de cada usuario en MongoDB. Para promover una cuenta existente, ejecuta `npm run promote-admin --workspace=packages/back/mc-user-service -- correo@ejemplo.com`; el correo debe pertenecer a una cuenta existente y no eliminada. La pestaña de usuarios y las operaciones de catálogo comprueban el rol en el backend.

El hook `pre-commit` solo ejecuta las pruebas; no guarda ni añade el backup de mazos al commit. Para actualizar el fichero físico `packages/back/mc-data/seed/catalog/decks.json`, un administrador usa el botón **Guardar copia en el catálogo** del editor. **Restaurar del repositorio** también está reservado a administradores; aplica el evento más reciente por ID (`updatedAt` para mazos y `deletedAt` para borrados), conserva los mazos locales ausentes del snapshot y propaga los borrados para que no reaparezcan en otra instalación. Para respetar la propiedad, los cambios y borrados del snapshot solo se aplican a mazos del usuario que ejecuta la restauración; los mazos nuevos importados se asignan a esa cuenta.

#### 5. Iniciar la Aplicación

##### Opción A: MongoDB en Docker y aplicación local

```bash
npm run start:all
```

Esto inicia MongoDB y Mailpit en Docker, y los frontends/microservicios en el host. Pulsa `Ctrl+C` para detenerlos; los contenedores quedan activos. La aplicación queda disponible en:
- Carcasa en `https://localhost:8000`
- Servicio de partidas en `https://localhost:3000`
- Servicio de creación en `https://localhost:3001`
- Servicio de mazos en `https://localhost:3002`
- Servicio de usuarios en `https://localhost:3003`
- Remoto de juego en `https://localhost:8100`
- Remoto de mazos en `https://localhost:8200`
- Recursos estáticos en `https://localhost:8300`
- Remoto de cuentas en `https://localhost:8400`

##### Opción B: MongoDB local

Inicia frontend/backend y MailDev sin Docker. Necesitas MongoDB Community Server con `mongod` en el `PATH`, o una instancia MongoDB externa configurada con `MONGODB_URI`:

```bash
npm run start:all:local
```

Con MongoDB local, los datos se guardan en `.local/mongodb`; el correo de activación queda en http://localhost:8025. Para depurar frontend y backend por separado desde el IDE, inicia MongoDB y MailDev en terminales separadas con `npm run mongo:up` y `npm run maildev`, y después inicia cada aplicación individualmente. Al ejecutar la carcasa por separado, inicia también `npm run start:mc-static` en otra terminal.

El arranque local (`npm run start:all:local`) lee `.env` y sirve la carcasa en `http://localhost:8000` por defecto (`USE_HTTPS=false`, `PROTOCOL=http`). `npm run start:all` usa HTTPS por defecto; Docker usa HTTP con `.env.docker.example` y puede configurarse por separado.

### Instalación con Docker

Para el modo local predeterminado, configura los puertos directos y HTTP:

```bash
test -f .env || cp .env.docker.example .env
```

La plantilla `.env.docker.example` usa `USE_PORTS_IN_URL=true`, por lo que el navegador se conecta a los puertos publicados directamente. Aunque Compose también inicia `mc-gateway`, este modo no lo usa. Para usar Gateway local, configura `USE_PORTS_IN_URL=false` y sigue [DEPLOYMENT.md](../DEPLOYMENT.md).

#### 1. Construir Imágenes

```bash
npm run docker:build
```

#### 2. Iniciar Servicios

```bash
npm run docker:up
```

Esto inicia frontend, backend y MongoDB, todos en Docker. Con `.env.docker.example`, la aplicación usa HTTP y queda disponible en:
- Frontend en `http://localhost:8000`
- Backend en `http://localhost:3000`
- Usuarios en `http://localhost:3003` y remoto de cuentas en `http://localhost:8400`
- MongoDB en `mongodb://localhost:27017` (los datos persisten en el volumen `mc-mongodb-data`)

El backend carga el catálogo cuando MongoDB está saludable. El Compose actual no monta todo el código fuente para hot-reload; después de cambiar código, reconstruye las imágenes con `docker compose up -d --build`.

#### 3. Ver Logs

```bash
npm run docker:logs
```

#### 4. Detener Servicios

```bash
npm run docker:down
```

## Acceso a la Aplicación

Una vez iniciada la aplicación, usa las URL del modo elegido:

### Frontend
- **URL**: `https://localhost:8000` con `start:all` (HTTPS por defecto); `http://localhost:8000` con `start:all:local` o `.env.docker.example`.
- **Descripción**: Interfaz de usuario para jugar

### Backend
- **URL directa**: `https://localhost:3000` con `start:all`; `http://localhost:3000` con los modos HTTP.
- **Descripción**: API REST + WebSocket
- **Verificar estado**: añade `/healthz` a la URL del backend correspondiente.

## Primer Juego

### Paso 1: Crear una cuenta e iniciar sesión

1. Abre la URL del frontend según el modo (`https://localhost:8000` para `start:all` o `http://localhost:8000` para los modos HTTP) y selecciona **Crear un nuevo usuario**.
2. Introduce email y nombre visible.
3. Abre el enlace de activación recibido por correo y establece una contraseña segura. La activación inicia sesión automáticamente.
4. Si SMTP no está configurado, el servicio de usuarios no puede entregar los enlaces.

### Paso 2: Crear o Unirse a Partida

1. Haz clic en **Nueva partida** o elige una sala de espera disponible.
2. Si creas la partida, completa el asistente: **Paso 1**, nombre y máximo de jugadores; **Paso 2**, tu superhéroe y mazo, con la tabla de aspecto y filtros usada por los invitados; **Paso 3**, escenario, dificultad y conjuntos modulares.
3. Al crearla entrarás en la sala de espera. Cada invitado elige allí su superhéroe y mazo; el creador puede iniciar con las plazas disponibles.
4. Si te unes a una sala, selecciona tu superhéroe y mazo en esa sala.

### Inicio de la partida: ¡Jugar!

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
1. Verifica que los servidores están ejecutándose: `npm run start:frontend` y `npm run start:mc-static` en terminales separadas.
2. Abre la consola del navegador (F12) para ver errores
3. Limpia caché: Ctrl+Shift+Del (Chrome/Firefox)

### Backend no responde

**Síntomas:** Errores de conexión al crear partida

**Soluciones:**
1. Verifica que backend corre: `node packages/back/mc-back/index.js`
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
# Identificar y, si corresponde, terminar el proceso que ocupa el puerto 3000
lsof -ti:3000 | xargs kill -9

# O identificar y terminar el proceso que ocupa el puerto 8000
lsof -ti:8000 | xargs kill -9
```

### Cambios no reflejan

**Síntomas:** Cambios en código no aparecen en navegador

**Soluciones:**
1. En desarrollo local, verifica que los servidores Vite sigan activos y recarga la página.
2. En Docker, reconstruye las imágenes tras cambiar código: `docker compose up -d --build`.
3. Si el navegador sigue mostrando una versión anterior, limpia la caché y reinicia los servicios afectados.

## Estructura de Carpetas Útil

```
mc-rrr-play/
├── docs/                    # 📚 Esta documentación
│
├── packages/
│   ├── front/
│   │   ├── mc-frontend/    # 🎨 Carcasa, lobby y creación
│   │   ├── mc-users/       # 👤 Remoto de gestión de usuarios
│   │   ├── mc-match/       # 🎮 Remoto de juego
│   │   ├── mc-deck/        # 🃏 Editor de mazos
│   │   ├── mc-static/      # 🖼️ Remoto de recursos estáticos
│   │   └── mc-components/  # 🧩 Paquete npm de componentes Lit compartidos
│   ├── back/
│   │   ├── mc-match-creation-service/ # Creación y catálogo
│   │   ├── mc-user-service/ # 👤 Cuentas y sesiones
│   │   ├── mc-deck-service/ # API y persistencia de mazos
│   │   ├── mc-back/        # 🎮 Motor de juego
│   │   │   ├── src/
│   │   │   │   ├── model/      # Entidades (Match, Player, etc)
│   │   │   │   ├── engine/     # Motor de reglas
│   │   │   │   ├── abilities/  # Capacidades de cartas
│   │   │   │   ├── triggers/   # Sistema de triggers
│   │   │   │   ├── effects/    # Efectos del juego
│   │   │   │   └── server/     # API REST + WebSocket
│   │   │   └── index.js
│   │   └── mc-data/        # MongoDB; catálogo JavaScript por entidad y carta
│   └── core/
│       ├── mc-endpoints/   # 🔌 Contratos REST y Socket.IO
│       └── mc-shared/      # Constantes compartidas del dominio
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

# Remoto estático (en una terminal)
npm run start:mc-static

# Remoto de usuarios (puerto 8400, en otra terminal)
npm run start:mc-users

# Carcasa (en otra terminal)
npm run start:frontend

# Servicio de usuarios (puerto 3003)
npm run start:mc-user-service

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
- Revisa rulebook oficial de MC RRR

### Preguntas Sobre Desarrollo
- Lee [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md)
- Explora el código fuente en `packages/back/mc-back/src`
