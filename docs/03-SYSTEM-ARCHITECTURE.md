# Arquitectura del Sistema

## Visión General de Capas

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            PRESENTACIÓN                                      │
│       Carcasa mc-frontend + remotos mc-match, mc-deck y mc-static            │
│               (Lobby, juego, mazos y recursos compartidos)                  │
└─────────────────────────────────┬────────────────────────────────────────────┘
                      │
                      │ HTTP REST + WebSocket (Socket.IO)
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    MICROSERVICIOS                            │
│ mc-match-creation-service │ mc-back │ mc-deck-service        │
│   (catálogo/creación)     │ (motor) │ (mazos)                 │
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

- `packages/front/` contiene `mc-frontend` (carcasa y creación), `mc-match` (remoto de juego), `mc-deck` (editor de mazos), `mc-static` (imágenes, fuentes, favicons y CSS público) y `mc-components` (paquete npm de componentes Lit reutilizables).
- `packages/back/` contiene `mc-back`, los servicios `mc-match-creation-service` y `mc-deck-service`, y `mc-data`, que conecta con MongoDB para los catálogos, mazos e instantáneas de partidas.
- `packages/core/mc-endpoints` publica las rutas REST y eventos Socket.IO usados por frontend y backend.
- `packages/core/mc-shared` publica identificadores de capacidades, efectos, objetivos, rasgos, tipos de carta y otros valores del dominio. Las configuraciones de MongoDB almacenan estos valores como strings.
- `mc-frontend` conserva el lobby y la creación. Carga `mc-static` para resolver recursos; los componentes Lit compartidos se instalan como dependencia npm en `mc-frontend`, `mc-match` y `mc-deck`, y quedan incluidos al compilar cada consumidor. El setup de una partida puede solicitar diálogos, por lo que `mc-match` se carga antes de inicializarla; `mc-deck` se carga al abrir la sección de mazos. La carcasa registra Material Web una sola vez para que los remotos compartan sus elementos. Las URL de los remotos se configuran en `packages/front/mc-frontend/public/app-config.json`.
- `mc-static` almacena los recursos públicos en `src/assets/` y los publica bajo `/images/`, `/font/` y `/styles/`; el remoto expone `getAssetUrl()` para resolverlos desde la carcasa y el juego.
- `mc-components` exporta componentes Lit reutilizables, como `mc-card-image-dialog`; los consumidores los importan directamente como dependencia y los registran en `customElements`.
- `mc-match-creation-service` sirve los catálogos y las rutas públicas de creación, orquestando mediante endpoints internos las operaciones que requieren el motor de `mc-back`.
- `mc-back` es el servicio de partidas: mantiene el motor, el estado persistido y Socket.IO. Sus endpoints internos de creación están bajo `/internal/`.
- `mc-deck-service` valida las reglas de construcción y persiste los mazos en la colección `decks`. Cada documento guarda el héroe, el aspecto, referencias `{id, count}` a las cartas editables y las fechas `createdAt`/`updatedAt`; las cartas fijas del héroe siguen viniendo del catálogo. Solo el botón **Guardar copia en el catálogo** sincroniza el evento más reciente por ID entre MongoDB y `packages/back/mc-data/seed/catalog/decks.json`; el hook `pre-commit` no modifica el backup. Los borrados explícitos se conservan como tombstones con `deletedAt`, para que no reaparezcan al restaurar en otra instalación. La restauración desde `mc-deck` compara las fechas de actualización y borrado por ID, conserva los mazos exclusivamente locales y aplica los eventos más recientes del repositorio. `GET /decks` entrega la biblioteca completa con nombre del héroe y tamaño validado para el listado principal.
- El remoto `mc-deck` separa la selección de héroe, la lista de mazos y el editor (incluidas las listas de cartas) en componentes Lit independientes; `mc-deck-app` coordina el estado y `DeckServiceClient` encapsula las llamadas al servicio.
- Las vistas de `mc-deck` se enrutan desde `mc-frontend`: `/decks`, `/decks/create`, `/decks/edit` y `/decks/edit/:id`. La carcasa mantiene el remoto montado y le comunica la ruta activa y sus parámetros para admitir navegación directa e historial del navegador.
- En desarrollo, `npm run start:all` (o `npm run start:all:docker`) inicia MongoDB en Docker y ejecuta la carcasa, los remotos y servicios en el host; `npm run start:all:local` usa `mongod` local. `npm run docker:up` ejecuta todos los servicios en contenedores.
- El catálogo inicial está separado en `packages/back/mc-data/seed/catalog/{heroes,scenarios,sets,aspects}/`: hay un módulo JavaScript por héroe, escenario y set; los archivos de `aspects/` están organizados en subcarpetas por aspecto y agrupan las cartas por tipo (por ejemplo, `aspects/aggression/allies.js`). Estos módulos pueden importar identificadores de `mc-shared`; sus valores se guardan como strings al persistirlos en MongoDB. Al conectar, `mc-data` inserta solo los documentos ausentes en las colecciones `heroes`, `scenarios`, `sets` y `aspects`. Antes de arrancar el backend mediante `npm run start:backend` (incluyendo `start:all` y `docker:up`), se ejecuta `npm run seed:data`, que reemplaza los documentos del catálogo empaquetado por los valores exportados por los módulos.
- Los documentos usan `_id` como identificador estable. Héroes, escenarios y sets guardan su configuración en `config`; cada documento de `aspects` contiene una carta. Los precon de héroe guardan referencias ordenadas a esas cartas, que `getHeroConfig()` expande al cargar la configuración.
- El seed normaliza las cartas al formato `{type, params}` que consume `CardsFactory`, conservando dentro de `params` sus capacidades y efectos.
- El backend mantiene las partidas activas en `Mc.matches` y guarda sus instantáneas en la colección `matches` de MongoDB. Al iniciar, restaura el motor y reanuda la fase y el turno guardados.

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

**Modelo de costes:** `Cost` distingue los costes de recursos al jugar cartas, los costes de flecha de las capacidades, el agotamiento obligatorio de las capacidades básicas y los costes adicionales aportados por constantes. `AbilityCosts` agrupa los costes de una capacidad; la sesión prepara y reserva todos los pagos antes de aplicarlos, y si uno no puede pagarse o se cancela durante esa preparación, no se aplica ninguno ni se resuelve la capacidad.

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

Los nombres contextuales de las interrupciones se definen en la clase del trigger correspondiente mediante `getInterruptName()`. Este nombre sustituye el título de la interrupción, mientras que las respuestas y otros tipos de capacidad conservan el título configurado en la capacidad.

### 5. Activations (Activaciones)

**Ubicación:** `src/activations/`

Tipos de activaciones que los jugadores pueden ejecutar:

- **Attack** - Ataque a un enemigo
- **Defense** - Defensa contra daño
- **Recovery** - Recuperar vida
- **Thwart** - Reducción de amenaza
- **Scheme** - Plan especial

Cada nueva resolución crea una activación independiente; los efectos de la misma resolución comparten su activación.

Cada llamada normal a `Ability.resolveAbility()` crea una instancia del árbol completo de efectos. Los resultados se comparten entre los efectos hijos de esa ejecución, pero no sobreviven como estado de ejecución a la siguiente resolución. `ability.effect` expone la instancia más reciente; la próxima resolución usa la definición de fábrica para crear otra instancia limpia. Si se proporciona un efecto explícito como segundo argumento, quien llama aporta una instancia ya preparada y conserva su control sobre ella.

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

**Ubicación:** `packages/back/mc-back/src/server/`

Express y Socket.IO comparten el servidor HTTP del servicio de partidas, que escucha en el puerto `3000`. El servicio de creación escucha en `3001` y consume los catálogos en MongoDB.

#### McRest
- Define rutas GET, POST y DELETE, analiza cuerpos JSON y obtiene la partida a partir de la cabecera HTTP `match` para las acciones de juego.
- Restaura en `Mc.matches` las partidas de MongoDB y persiste sus cambios.

**Rutas REST públicas y responsables:**

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/get-heroes-list` | Obtener héroes (servicio de creación) |
| `GET` | `/get-matches-list` | Listar partidas vía servicio de creación, con el héroe y aspecto de cada jugador |
| `GET` | `/get-scenarios-list` | Obtener escenarios (servicio de creación) |
| `GET` | `/get-modular-sets-list` | Obtener conjuntos modulares (servicio de creación) |
| `POST` | `/create-match` | Crear partida vía servicio de creación |
| `POST` | `/reset-match` | Reiniciar una partida con su configuración original |
| `DELETE` | `/delete-match` | Eliminar por nombre la partida y su instantánea, aunque no esté cargada en memoria |
| `POST` | `/create-player` | Añadir jugador vía servicio de creación |
| `POST` | `/create-scenario` | Añadir escenario vía servicio de creación |
| `POST` | `/init-match` | Inicializar vía servicio de creación |
| `POST` | `/player-flip` | Cambiar identidad directamente en `mc-back` |
| `POST` | `/play-card` | Jugar carta directamente en `mc-back` |
| `POST` | `/resolve-ability` | Resolver capacidad directamente en `mc-back` |

#### McSocket
- Gestiona los eventos Socket.IO definidos en `packages/core/mc-endpoints/events.js`.
- Une cada socket a una sala `mc-match:<nombre>` mediante `join-match` y enruta las actualizaciones a esa partida.
- Recibe `end-turn` y gestiona el intercambio correlacionado `open-dialog` / `dialog-response`.
- La instantánea `match-refresh` incluye la fase y el jugador activo para que la interfaz solo ofrezca finalizar el turno a quien corresponda.
- Tras una reconexión, el cliente vuelve a unirse; si el setup terminó, recibe una instantánea completa y, si hay un diálogo pendiente, este se vuelve a emitir.
- El fin de turno y las respuestas de diálogo requieren acknowledgement; la interfaz informa de desconexiones, fallos y expiraciones.

**Eventos principales:** `join-match`, `end-turn`, `open-dialog`, `dialog-response` y los eventos `*-refresh` descritos en [Comunicación](#comunicación).

## Componentes del Frontend

La carcasa `mc-frontend` ofrece el lobby, la creación y la navegación. Al iniciar, carga `mc-static` para resolver los recursos; los componentes compartidos están incluidos en los bundles de sus consumidores. Al entrar a una partida carga `mc-match` como ES module y al abrir "Mazos" carga `mc-deck`. El bundle del juego no se descarga al abrir el lobby.

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
├─ GET /get-matches-list ─────────────────► Lista partidas persistidas en MongoDB
├─ Usuario selecciona una existente ──────► Socket.IO `join-match` + snapshot
└─ O pulsa "Nueva partida"
   ├─ GET /get-heroes-list ───────────────► Devuelve la lista de héroes
   ├─ GET /get-scenarios-list ────────────► Devuelve la lista de escenarios
   ├─ POST /create-match ─────────────────► Crea y guarda Match
   ├─ Socket.IO `join-match` ─────────────► Une al cliente antes del setup
   ├─ POST /create-player ────────────────► Añade Player a Match
   ├─ POST /create-scenario ──────────────► Añade Scenario a Match
   ├─ POST /init-match ───────────────────► Inicializa motor y partida
   └─ Recibe JSON y renderiza la partida
```

La creación de una partida también consulta `/get-modular-sets-list` y envía la selección al crear el escenario.
Cada partida tiene un `id` estable que se incluye en la lista y en la ruta de juego `/match/:id`; el nombre sigue siendo su etiqueta visible.

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

Unión y resincronización: el frontend emite `join-match`; el backend valida y añade el socket a la sala, y devuelve `match-refresh` cuando la partida está inicializada.
Fin de turno: el frontend emite `end-turn` con la partida y espera el acknowledgement del backend.
Diálogos: el backend emite `open-dialog` con un identificador de solicitud; el frontend responde con `dialog-response` correlacionado y acknowledgement.
```

## Comunicación

### REST API

Se usa para obtener listas de héroes, escenarios, conjuntos modulares y partidas activas, crear e inicializar partidas y ejecutar acciones de juego. El servicio de creación sirve el catálogo y enruta las operaciones de creación al servicio de partidas; `mc-back` conserva las acciones de juego y Socket.IO. Las rutas públicas e internas están centralizadas en `packages/core/mc-endpoints/endpoints.js`.

Las peticiones llevan JSON; las rutas de partida usan la cabecera `match`. `Api.request()` dirige las rutas públicas de creación y catálogo al servicio `matchCreation` y las acciones de juego a `match`, según `public/app-config.json`. Por defecto, `/create-match` se solicita a `http://localhost:3001/create-match`; las acciones de juego y Socket.IO usan `http://localhost:3000`.

Los errores REST se devuelven como JSON con `{error: {message, status}}` y un estado HTTP adecuado; las rutas desconocidas responden `404` y los errores inesperados responden `500` sin exponer detalles internos. `Api.request()` convierte las respuestas fallidas en errores con el mensaje del servidor para que la interfaz los muestre al usuario.

### WebSocket (Socket.IO)

Se usa para el fin de turno, los diálogos interactivos y las actualizaciones de estado en tiempo real.

```javascript
socket.emit('join-match', {match}, acknowledgement)
socket.emit('end-turn', {match, player}, acknowledgement)
socket.on('match-refresh', (match) => { /* actualizar estado */ })
socket.on('player-refresh', (player) => { /* actualizar jugador */ })
socket.on('open-dialog', (params) => { /* mostrar diálogo */ })
socket.emit('dialog-response', {match, requestId, response}, acknowledgement)
```

Los nombres de eventos son los valores centralizados en `packages/core/mc-endpoints/events.js`. Los eventos de juego se aíslan por sala de partida. Al reconectar, el frontend vuelve a unirse para recibir el estado completo si el setup ya terminó y los diálogos pendientes, incluso si se perdieron actualizaciones incrementales.

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
- `mc-data` carga automáticamente los registros ausentes del catálogo inicial de `packages/back/mc-data/seed/catalog/`; `npm run seed:data` vuelve a reemplazar los documentos empaquetados. Al desplegar, configura `MONGODB_URI` y `MONGODB_DATABASE` para apuntar a la base correspondiente.

**Partidas (MongoDB):**
- La colección `matches` guarda el estado completo del motor, incluidos mazos, cartas, efectos y referencias entre objetos; no se usa el JSON de presentación del frontend.
- El snapshot conserva el `id` estable y una configuración inicial compacta (configuración de los jugadores y del escenario, sets modulares y dificultad). No anida una segunda instantánea completa del motor, para evitar duplicar cartas en la persistencia.
- Cada cambio REST de una partida inicializada se persiste antes de responder. El flujo automático guarda puntos de reanudación entre turnos y fases.
- Al arrancar, el backend rehidrata las partidas y reanuda las que estaban activas. `MONGODB_URI` y `MONGODB_DATABASE` determinan dónde se guardan.

**Durante la partida:**
- `Mc.matches` mantiene en memoria las partidas cargadas desde MongoDB.
- El lobby lista las partidas persistidas y permite reanudar una después de reiniciar el backend, siempre que MongoDB conserve los datos.
- Socket.IO envía actualizaciones a la sala correspondiente; cada cliente debe unirse a la partida antes de recibirlas.
