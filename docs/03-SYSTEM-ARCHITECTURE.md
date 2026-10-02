# Arquitectura del Sistema

## Visión General de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTACIÓN                            │
│              Frontend (Lit-Element Components)               │
│         (Interfaz visual, entrada de usuario)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP REST + WebSocket (Socket.IO)
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    COMUNICACIÓN                              │
│         Express.js + Socket.IO (Backend/Frontend)            │
│     (Enrutamiento, validación, sincronización)               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   LÓGICA DE NEGOCIO                          │
│    Motor de Juego (Engine, Triggers, Efectos)                │
│   (Reglas, validaciones, estado del juego)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     MODELO DE DATOS                          │
│    Match, Player, Cards, Scenario, Hero (Entidades)         │
│         (Representación del estado del juego)                │
└─────────────────────────────────────────────────────────────┘
```

### Packages compartidos y catálogo de juego

- `packages/mc-endpoints` publica las rutas REST y los eventos Socket.IO usados por frontend y backend.
- `packages/mc-shared` publica los identificadores de capacidades, efectos, objetivos, rasgos, tipos de carta y otros valores del dominio. Las configuraciones de MongoDB almacenan estos valores como strings.
- `packages/mc-data` conecta con MongoDB y proporciona al backend los catálogos y configuraciones de héroes, escenarios, sets y cartas de aspecto. La conexión se configura con `MONGODB_URI` y `MONGODB_DATABASE`.
- En desarrollo, `npm run start:all` (o `npm run start:all:docker`) inicia MongoDB en Docker y ejecuta frontend/backend en el host; `npm run start:all:local` usa `mongod` local. `npm run docker:up` ejecuta los tres servicios en contenedores.
- El catálogo inicial está separado en `packages/mc-data/seed/catalog/{heroes,scenarios,sets,aspects}/`: hay un módulo JavaScript por héroe, escenario y set; los archivos de `aspects/` están directamente en esa carpeta y agrupan las cartas por aspecto y tipo (por ejemplo, `aggression-allies.js`). Estos módulos pueden importar identificadores de `mc-shared`; sus valores se guardan como strings al persistirlos en MongoDB. Al conectar, `mc-data` inserta solo los documentos ausentes en las colecciones `heroes`, `scenarios`, `sets` y `aspects`. Antes de arrancar el backend mediante `npm run start:backend` (incluyendo `start:all` y `docker:up`), se ejecuta `npm run seed:data`, que reemplaza los documentos del catálogo empaquetado por los valores exportados por los módulos.
- Los documentos usan `_id` como identificador estable. Héroes, escenarios y sets guardan su configuración en `config`; cada documento de `aspects` contiene una carta. Los precon de héroe guardan referencias ordenadas a esas cartas, que `getHeroConfig()` expande al cargar la configuración.
- El seed normaliza las cartas al formato `{type, params}` que consume `CardsFactory`, conservando dentro de `params` sus capacidades y efectos.
- El estado activo de las partidas continúa en memoria en el backend; MongoDB se usa para el catálogo de contenido, no para guardar partidas.

Ejemplo de documento de héroe:

```json
{
  "_id": "spiderman",
  "order": 2,
  "name": "Spiderman",
  "folder": "spiderman",
  "config": {
    "sides": [],
    "cards": [],
    "precon": []
  }
}
```

Las listas REST proyectan `name` y `folder`; al crear un jugador o escenario, el backend busca el documento por `_id` y pasa `config` a las fábricas del motor.

## Componentes del Backend

### 1. Engine (Motor de Juego)

**Ubicación:** `src/engine/`

El Engine es la base de toda la lógica del juego:

```javascript
class Engine {
  // Gestiona efectos y triggers
  trigger(event, data) { /* Dispara un evento */ }
  effect(handler) { /* Aplica un efecto */ }
  
  // Validación y ejecución
  validate(action) { /* Valida reglas */ }
  execute(action) { /* Ejecuta una acción */ }
}
```

**Responsabilidades:**
- Gestionar el flujo de eventos
- Validar acciones según reglas
- Aplicar efectos y cambios de estado
- Coordinar triggers y respuestas

### 2. Model (Modelo de Datos)

**Ubicación:** `src/model/`

Las entidades principales:

#### Match
```javascript
class Match extends Engine {
  name: string
  players: Player[]
  scenario: Scenario
  villains: Card[]
  playing: boolean
  
  // Acceso a información agregada
  get characters() { /* Todos los personajes */ }
  get accelerationIcons() { /* Contadores */ }
}
```

#### Player
```javascript
class Player {
  name: string
  hero: Superhero
  hand: Hand
  deck: Deck
  zone: PlayerZone
  resources: { physical, mental }
  damage: number
}
```

#### Card
```javascript
class Card {
  id: string
  name: string
  type: 'hero' | 'event' | 'ally' | 'upgrade'
  cost: number
  effects: Effect[]
  triggers: Trigger[]
  damage: number
}
```

#### Scenario
```javascript
class Scenario {
  name: string
  villain: Card
  encounterDeck: Deck
  accelerationIcons: number
  accelerationTokens: number
}
```

### 3. Capacidades (Abilities)

**Ubicación:** `src/abilities/`

Sistema de capacidades y efectos de cartas:

**Tipos de Capacidades:**
- **Core** - Capacidades básicas
- **Actions** - Acciones del jugador
- **Response** - Respuestas a eventos
- **When** - Triggers condicionales
- **Interrupt** - Interrupciones de acciones
- **Resource** - Generación de recursos
- **Basic** - Capacidades simples

**Estructura:**
```javascript
class Ability {
  condition() { /* Condición para activarse */ }
  activate() { /* Ejecutar la capacidad */ }
  resolve() { /* Resolver efectos */ }
}
```

### 4. Triggers (Disparadores)

**Ubicación:** `src/triggers/`

Sistema de triggers que detectan eventos:

**Triggers Base:**
- `AttackTrigger` - Detecta ataques
- `DefeatTrigger` - Detecta derrotas
- `DamageTrigger` - Detecta daño
- `PlayedTrigger` - Detecta cartas jugadas

**Sistema de Mixins:**
Los triggers pueden combinarse con mixins para crear lógica compleja:
- `mixin-your-hero-trigger` - Tu Superhéroe específicamente
- `mixin-enemy-trigger` - Enemigos
- `mixin-condition-trigger` - Condiciones
- `mixin-attack-trigger` - Ataques
- `mixin-villain-trigger` - Villanos

**Ejemplo:**
```javascript
class YourHeroGetsAttackTrigger extends AttackTrigger {
  // Se dispara cuando TU Superhéroe recibe un ataque
  detect(event) {
    return event.target === this.controller.hero;
  }
}
```

### 5. Activations (Activaciones)

**Ubicación:** `src/activations/`

Tipos de activaciones que los jugadores pueden ejecutar:

- **Attack** - Ataque a un enemigo
- **Defense** - Defensa contra daño
- **Thwart** - Reducción de amenaza
- **Scheme** - Plan especial

Cada activación:
- Requiere recursos específicos
- Tiene un efecto base
- Puede tener modificadores

### 6. Effects (Efectos)

**Ubicación:** `src/effects/`

Sistema de efectos que modifican el estado:

**Tipos de Efectos:**
- `PlayMatchEffect` - Efecto de jugar una carta
- `DamageEffect` - Infligir daño
- `HealEffect` - Curar daño
- `ResourceEffect` - Generar recursos

**Estructura de Efecto:**
```javascript
class Effect {
  apply() { /* Aplicar el efecto */ }
  resolve() { /* Resolver consecuencias */ }
  revert() { /* Deshacer el efecto */ }
}
```

### 7. Server (Servidor)

**Ubicación:** `packages/mc-back/src/server/`

Express y Socket.IO comparten el servidor HTTP del backend, que escucha en el puerto `3000`.

#### McRest
- Define rutas GET y POST, analiza cuerpos JSON y obtiene la partida a partir de la cabecera HTTP `match`.
- Las partidas se guardan en memoria en `Mc.matches`.

**Rutas REST registradas actualmente:**

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/get-heroes-list` | Obtener la lista de héroes |
| `GET` | `/get-scenarios-list` | Obtener la lista de escenarios |
| `POST` | `/create-match` | Crear una partida |
| `POST` | `/create-player` | Añadir un jugador |
| `POST` | `/create-scenario` | Añadir un escenario |
| `POST` | `/init-match` | Inicializar la partida |
| `POST` | `/player-flip` | Cambiar la identidad del jugador |
| `POST` | `/play-card` | Jugar una carta |
| `POST` | `/resolve-ability` | Resolver una capacidad |

#### McSocket
- Gestiona los eventos Socket.IO definidos en `packages/mc-endpoints/events.js`.
- Recibe `end-turn` y gestiona el intercambio `open-dialog` / `dialog-response`.
- Emite eventos `*-refresh` para que el frontend actualice el estado de partida.
- Actualmente `Mc` guarda una única conexión en `this.socket`; los envíos no son un broadcast a todas las conexiones.

**Eventos principales:** `end-turn`, `open-dialog`, `dialog-response` y los eventos `*-refresh` descritos en [Comunicación](#comunicación).

## Componentes del Frontend

### 1. Estructura de Componentes

```
src/
├── components/
│   ├── core/
│   │   ├── mc-app/           # Componente raíz
│   │   ├── mc-main/          # Contenedor principal
│   │   └── mc-navigate/      # Sistema de navegación
│   │
│   ├── config/
│   │   ├── mc-form-player/   # Selección de jugador
│   │   ├── mc-form-scenario/ # Selección de escenario
│   │   └── mc-form-match/    # Configuración de partida
│   │
│   ├── game/
│   │   ├── mc-board/         # Tablero del juego
│   │   ├── mc-hand/          # Mano del jugador
│   │   ├── mc-card/          # Carta individual
│   │   └── mc-status/        # Barra de estado
│   │
│   └── common/
│       └── mc-dialog/        # Diálogos genéricos
│
├── misc/
│   ├── cards.js              # Datos de cartas
│   ├── resources.js          # Manejo de recursos
│   └── utils.js              # Utilidades
│
└── index.html                # Punto de entrada
```

### 2. Componentes Principales

#### mc-app
Componente raíz que:
- Inicializa la aplicación
- Gestiona estado global
- Configura enrutamiento

```javascript
<mc-app></mc-app>
```

#### mc-main
Contenedor principal que:
- Renderiza vista actual
- Gestiona navegación
- Coordina comunicación

#### mc-board
Tablero del juego que:
- Muestra zona de juego
- Renderiza enemigos
- Muestra contadores

#### mc-hand
Mano del jugador que:
- Muestra cartas disponibles
- Permite jugar cartas
- Indica costos

### 3. Tecnologías Utilizadas

**Lit-Element 4.0**
- Framework de componentes web
- Reactividad automática
- Sintaxis declarativa

**Material Web**
- Componentes UI de Material Design
- Estilos modernos
- Accesibilidad integrada

**Socket.IO Cliente**
- Conexión WebSocket
- Sincronización en tiempo real
- Reconexión automática

## Flujo de Datos

### Creación de Partida

```
Frontend                                  Backend
├─ GET /get-heroes-list ─────────────────► Devuelve la lista de héroes
├─ GET /get-scenarios-list ───────────────► Devuelve la lista de escenarios
├─ POST /create-match ────────────────────► Crea y guarda Match
├─ POST /create-player ───────────────────► Añade Player a Match
├─ POST /create-scenario ─────────────────► Añade Scenario a Match
├─ POST /init-match ──────────────────────► Inicializa el motor y la partida
└─ Recibe JSON y renderiza la partida
```

### Ejecutar Acción

```
Frontend                                  Backend
├─ UI envía flip/jugar/resolver ─────────► REST POST correspondiente
│                                         ├─ Ejecuta acción en Player/Engine
│                                         ├─ Resuelve triggers y efectos
│                                         └─ Emite el evento *-refresh adecuado
├─ Recibe la actualización por Socket.IO
├─ Integra el payload en el estado local
└─ Lit vuelve a renderizar

Fin de turno: el frontend emite `end-turn` por Socket.IO.
Diálogos: el backend emite `open-dialog`; el frontend responde con `dialog-response`.
```

## Comunicación

### REST API

Se usa para obtener las listas, crear e inicializar la partida y ejecutar las acciones de cambiar identidad, jugar carta y resolver capacidad. Las rutas se declaran en `packages/mc-back/src/server/rest/` y sus constantes compartidas están en `packages/mc-endpoints/endpoints.js`, importadas tanto por el backend como por el frontend. El backend obtiene las listas y configuraciones de contenido mediante `mc-data` desde MongoDB.

Las peticiones llevan JSON; el backend identifica la partida con la cabecera `match`. Las rutas registradas actualmente son las indicadas en la tabla de **McRest**. `Api.request()` resuelve las rutas (con `/` inicial) contra `httpHost` usando `new URL()`, por lo que `/create-match` se solicita como `http://localhost:3000/create-match`.

### WebSocket (Socket.IO)

Se usa para el fin de turno, los diálogos interactivos y las actualizaciones de estado en tiempo real.

```javascript
socket.emit('end-turn')
socket.on('match-refresh', (match) => { /* actualizar estado */ })
socket.on('player-refresh', (player) => { /* actualizar jugador */ })
socket.on('open-dialog', (params) => { /* mostrar diálogo */ })
socket.emit('dialog-response', response)
```

Los nombres de eventos son los valores centralizados en `packages/mc-endpoints/events.js`. El backend conserva actualmente una sola conexión Socket.IO y sus emisiones no se difunden a todos los clientes.

## Gestión de Estado

### Match State

El estado de una partida contiene:
- Jugadores y sus recursos
- Cartas en juego
- Villano y amenaza
- Contador de aceleración
- Triggers activos
- Efectos pendientes

```javascript
{
  name: "game-1",
  playing: true,
  players: [
    {
      name: "Player 1",
      hero: { /* datos del Superhéroe */ },
      hand: [ /* cartas */ ],
      damage: 5,
      resources: { physical: 1, mental: 1 }
    }
  ],
  scenario: { /* datos del escenario */ },
  villains: [ /* enemigos */ ],
  accelerationTokens: 2
}
```

## Persistencia

### Almacenamiento

**Catálogo de juego (MongoDB):**
- `heroes`: lista visible e información de configuración completa de cada héroe.
- `scenarios`: lista visible e información de configuración completa de cada escenario.
- `sets`: configuración de los sets de encuentro.
- `aspects`: cartas de aspecto almacenadas individualmente y referenciadas desde los precon de héroe.
- `mc-data` carga automáticamente los registros ausentes del catálogo inicial de `packages/mc-data/seed/catalog/`; `npm run seed:data` vuelve a reemplazar los documentos empaquetados. Al desplegar, configura `MONGODB_URI` y `MONGODB_DATABASE` para apuntar a la base correspondiente.

**Durante la partida:**
- El estado de las partidas se mantiene en memoria en el backend; aún no se persiste en MongoDB.
- Socket.IO envía actualizaciones al socket actualmente guardado por el backend; no hay difusión a todas las conexiones.
