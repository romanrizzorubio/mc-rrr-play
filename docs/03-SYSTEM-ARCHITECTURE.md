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

**Ubicación:** `src/server/`

#### McRest
- Define endpoints REST
- Gestiona peticiones HTTP
- Retorna respuestas JSON

**Endpoints Principales:**
- `POST /match/create` - Crear partida
- `POST /match/:name/join` - Unirse a partida
- `GET /match/:name` - Obtener estado
- `POST /match/:name/action` - Ejecutar acción

#### McSocket
- Gestiona conexiones WebSocket
- Emite eventos en tiempo real
- Sincroniza estado entre clientes

**Eventos Principales:**
- `match:updated` - Partida actualizada
- `player:action` - Acción de jugador
- `game:ended` - Juego terminado

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
│   ├── endpoints.js          # URLs de API
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
Frontend                Backend
├─ Usuario rellena       
│  formulario            
├─ Envía POST           
│  /match/create ────────► Backend
│                        ├─ Valida datos
│                        ├─ Crea Match
│                        ├─ Inicializa Motor
│                        └─ Retorna estado
├─ Recibe datos         
│  actualizado
└─ Renderiza UI
```

### Ejecutar Acción

```
Frontend                Backend
├─ Usuario ejecuta      
│  acción               
├─ Emite evento vía     
│  Socket.IO ───────────► Backend
│                        ├─ Valida acción
│                        ├─ Ejecuta en Engine
│                        ├─ Detecta triggers
│                        ├─ Aplica efectos
│                        ├─ Actualiza estado
│                        └─ Emite update
├─ Recibe update vía
│  Socket.IO
└─ Re-renderiza UI
```

## Comunicación

### REST API

Usado para operaciones iniciales:

```
POST /match/create
GET /match/:name
POST /match/:name/join
POST /match/:name/action
```

### WebSocket (Socket.IO)

Usado para comunicación en tiempo real:

```javascript
socket.on('match:updated', (state) => { /* actualizar */ })
socket.emit('player:action', { type, data })
socket.on('game:ended', (result) => { /* mostrar resultado */ })
```

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

**Durante la Partida:**
- Estado se mantiene en memoria en el Backend
- Socket.IO sincroniza con Frontends

**Futuro:**
- Podría agregarse base de datos
- Guardado de historial
- Análisis de partidas
