# MC RRR Play - Descripción General

## ¿Qué es MC RRR Play?

MC RRR Play es una plataforma digital para jugar **Marvel Champions: The Card Game**, un juego de cartas cooperativo donde los jugadores controlan superhéroes de Marvel enfrentándose contra villanos épicos.

Esta es una aplicación web completa que permite:
- **Jugar en línea** contra villanos y escenarios
- **Gestionar partidas** en tiempo real
- **Sincronizar estado** entre jugadores
- **Manejar mecánicas complejas** del juego automáticamente

## Propósito

La aplicación existe para:
1. **Digitalizar el juego de mesa** Marvel Champions TCG
2. **Facilitar juego remoto** entre múltiples jugadores
3. **Automatizar cálculos y reglas** del juego
4. **Ofrecer una experiencia fluida** y responsiva

## Características Principales

### Para Jugadores
- ✅ Crear y unirse a partidas
- ✅ Elegir Superhéroes y escenarios
- ✅ Jugar cartas y ejecutar acciones
- ✅ Ver estado actualizado en tiempo real
- ✅ Seguir el turno y las activaciones

### Para el Sistema
- ✅ Motor de juego que valida reglas
- ✅ Gestión de triggers y efectos de cartas
- ✅ Control de recursos (física, mental)
- ✅ Sincronización multiplayer en tiempo real
- ✅ Persistencia de estado de partidas

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (puerto 8000)            │
│         Aplicación web con Lit-Element 4.0           │
│   Interfaz del usuario, jugabilidad, visualización   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ WebSocket + REST API
                   │
┌──────────────────▼──────────────────────────────────┐
│                    Backend (puerto 3000)             │
│             Express.js + Socket.IO                   │
│      Motor de juego, lógica, persistencia            │
└─────────────────────────────────────────────────────┘
```

## Componentes Principales

### 1. **Backend (MC-Back)**
- Motor de juego que ejecuta la lógica
- Sistema de triggers y efectos
- Gestión de partidas y estado
- API REST y WebSocket
- Manejo de cartas, personajes y escenarios

### 2. **Frontend (MC-Frontend)**
- Interfaz de usuario web moderna
- Componentes Lit-Element
- Materialización con Material Web
- Pantallas de configuración, juego y resultados
- Comunicación en tiempo real

### 3. **Sistema de Endpoints**
- Definición de rutas de API
- Gestión de conexiones
- Eventos de Socket.IO

## Flujo de Juego Básico

### 1. Preparación e Inicio
1. **Crear/Unirse a Partida**
2. **Seleccionar Superhéroe**
3. **Seleccionar Escenario/Villano**
4. **Inicializar Partida**

### 2. Desarrollo de la Ronda (Round Overview)
Una ronda de juego sigue este flujo estructurado:

1. **Fase de Jugador**:
   - Comienza la fase.
   - Cada jugador toma su turno (jugar cartas, atacar, intervenir, etc.).
   - Termina la fase y los jugadores roban hasta su tamaño de mano.
2. **Fase de Villano**:
   - Comienza la fase.
   - Se coloca amenaza en el plan principal.
   - El Villano y los esbirros se activan contra cada jugador.
   - Se reparten y revelan cartas de encuentro.
3. **Mantenimiento**:
   - Se pasa el marcador de jugador inicial.
   - Finaliza la ronda y comienza la siguiente.

### 3. Fin de la Partida
- **Victoria**: El villano es derrotado (0 HP en todas sus etapas).
- **Derrota**: La amenaza alcanza el límite del plan principal o todos los héroes son derrotados.

## Tecnologías

### Backend
- **Node.js 20+** - Runtime
- **Express** - Framework web
- **Socket.IO** - Comunicación en tiempo real
- **JavaScript (ES Modules)** - Lenguaje

### Frontend
- **Lit-Element 4.0** - Framework de componentes web
- **Material Web** - Componentes UI
- **JavaScript (ES Modules)** - Lenguaje
- **CSS Moderno** - Estilos

### Infraestructura
- **Docker** - Containerización
- **Docker Compose** - Orquestación
- **npm Workspaces** - Gestión de monorepo

## Acceso a la Aplicación

- **Frontend**: http://localhost:8000
- **Backend**: http://localhost:3000
- **WebSocket**: ws://localhost:3000 (automático)

## Próximos Pasos

Para entender mejor la aplicación:
- Lee [02-GAME-MECHANICS.md](./02-GAME-MECHANICS.md) para aprender cómo funciona el juego
- Lee [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md) para entender la arquitectura técnica
- Lee [04-USER-FEATURES.md](./04-USER-FEATURES.md) para ver las características completas
