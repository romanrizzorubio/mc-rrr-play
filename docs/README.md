# MC RRR Play - Documentación

Bienvenido a la documentación funcional de **MC RRR Play**, una plataforma digital para jugar Marvel Champions: The Card Game.

## 📚 Índice de Documentos

### Para Empezar Rápido
- **[05-GETTING-STARTED.md](./05-GETTING-STARTED.md)** ⭐ **COMIENZA AQUÍ**
  - Instalación y configuración
  - Primer juego paso a paso
  - Solución de problemas
  - Comandos útiles

### Entender el Juego
- **[02-GAME-MECHANICS.md](./02-GAME-MECHANICS.md)**
  - Conceptos fundamentales (Partidas, Jugadores, Cartas)
  - Sistema de recursos y activaciones
  - Fases del turno
  - Sistema de triggers y efectos

### Entender la Aplicación
- **[01-OVERVIEW.md](./01-OVERVIEW.md)**
  - Descripción general de la plataforma
  - Características principales
  - Arquitectura de alto nivel
  - Tecnologías utilizadas

- **[04-USER-FEATURES.md](./04-USER-FEATURES.md)**
  - Características funcionales para usuarios
  - Cómo crear y unirse a partidas
  - Cómo ejecutar acciones en el juego
  - Gestión de recursos

### Para Desarrolladores
- **[03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md)**
  - Capas de la arquitectura
  - Componentes del Backend
  - Componentes del Frontend
  - Flujos de datos
  - Sistema de comunicación

## 🎮 ¿Por Dónde Empiezo?

### Si Quiero...

**...jugar ahora**
→ Lee [05-GETTING-STARTED.md](./05-GETTING-STARTED.md)

**...entender las reglas del juego**
→ Lee [02-GAME-MECHANICS.md](./02-GAME-MECHANICS.md)

**...saber qué hace la aplicación**
→ Lee [01-OVERVIEW.md](./01-OVERVIEW.md)

**...desarrollar/modificar la aplicación**
→ Lee [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md)

**...conocer todas las características**
→ Lee [04-USER-FEATURES.md](./04-USER-FEATURES.md)

## 📊 Estructura General

```
MC RRR Play
│
├─ Frontend (Lit-Element)
│  └─ Interfaz web en puerto 8000
│
├─ Backend (Express + Socket.IO)
│  └─ Motor de juego en puerto 3000
│
└─ Datos
   └─ Cartas, Escenarios, Héroes
```

## 🚀 Inicio Rápido (2 minutos)

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar aplicación
npm run start:all

# 3. Abrir en navegador
# Frontend: http://localhost:8000
# Backend:  http://localhost:3000
```

## 🎯 Conceptos Clave

### Partida
Una sesión de juego donde jugadores controlan superhéroes enfrentando un villano.

### Jugador
Controla un superhéroe con su baraja de cartas personal.

### Recursos
- **Física** - Usada para atacar
- **Mental** - Usada para defensa

### Activaciones
- **Attack** - Atacar un enemigo
- **Defense** - Reducir daño
- **Thwart** - Reducir amenaza
- **Scheme** - Plan especial

### Objetivo
- **Victoria** - Derrota el villano
- **Derrota** - Tu héroe o la amenaza alcanzan máximo

## 🔗 Enlaces Útiles

- [GitHub Repository](https://github.com/romanrizzorubio/mc-rrr-play)
- [Marvel Champions TCG Oficial](https://www.fantasyflightgames.com/en/products/marvel-champions-the-card-game/)
- [Lit-Element Docs](https://lit.dev/)
- [Express.js Docs](https://expressjs.com/)
- [Socket.IO Docs](https://socket.io/docs/)

## 📝 Notas

- Esta documentación se enfoca en **funcionalidad**, no en implementación técnica
- Para detalles técnicos profundos, ve a [03-SYSTEM-ARCHITECTURE.md](./03-SYSTEM-ARCHITECTURE.md)
- Los diagramas ASCII se han simplificado para claridad

## 🤝 Contribuir

Si encuentras errores o tienes sugerencias para mejorar la documentación:
1. Abre un issue en GitHub
2. Describe claramente el problema o sugerencia
3. Incluye ejemplos si es posible

## 📅 Versión

- **Versión Actual**: 1.0.0
- **Última Actualización**: Septiembre 2026

---

**¿Listo para jugar?** → [Ir a 05-GETTING-STARTED.md](./05-GETTING-STARTED.md)
