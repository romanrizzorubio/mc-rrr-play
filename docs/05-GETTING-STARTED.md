# Guía de Inicio Rápido

## Instalación y Configuración

### Requisitos Previos

- **Node.js 20+** - [Descargar](https://nodejs.org/)
- **npm** - Incluido con Node.js
- **Docker y Docker Compose** (opcional, para desarrollo con contenedores)
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

#### 3. Iniciar la Aplicación

##### Opción A: Ambos servicios en paralelo

```bash
npm run start:all
```

Esto inicia:
- Frontend en `http://localhost:8000`
- Backend en `http://localhost:3000`

##### Opción B: Servicios independientes

Terminal 1 - Frontend:
```bash
npm run start:frontend
```

Terminal 2 - Backend:
```bash
npm run start:backend
```

### Instalación con Docker

#### 1. Construir Imágenes

```bash
npm run docker:build
```

#### 2. Iniciar Servicios

```bash
npm run docker:up
```

Esto inicia:
- Frontend en `http://localhost:8000`
- Backend en `http://localhost:3000`
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

1. Se muestra lista de superhéroes disponibles
2. Haz clic en el que desees
3. Se muestra información del héroe

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
- **Derrota** - Tu héroe alcanza 0 vida o la amenaza del villano llega al máximo

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
│   │   │   ├── abilities/   # Habilidades de cartas
│   │   │   ├── triggers/    # Sistema de triggers
│   │   │   ├── effects/     # Efectos del juego
│   │   │   └── server/      # API REST + WebSocket
│   │   └── index.js
│   │
│   └── mc-endpoints/       # 🔌 Módulo de endpoints
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
