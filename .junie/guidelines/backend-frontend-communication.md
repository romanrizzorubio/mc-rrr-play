# Guía de Comunicación entre Backend y Frontend (Skill)

Consulta esta guía antes de cambiar cómo se comunican la interfaz y el servidor. Describe el contrato actual; para confirmar detalles, revisa las rutas, los eventos y sus consumidores en el código indicado.

## Arquitectura actual

- El frontend Lit inicializa `Api` en `packages/mc-frontend/src/components/core/mc-app/mc-app.js`. Su implementación está en `packages/mc-frontend/src/components/api/api.js`.
- El backend configura Express y Socket.IO sobre el mismo servidor HTTP en `packages/mc-back/src/server/mc.js`; escucha en el puerto `3000`. El frontend de desarrollo se sirve en el puerto `8000`.
- Las rutas REST se centralizan en `packages/mc-endpoints/endpoints.js` y los eventos compartidos en `packages/mc-endpoints/events.js`. Frontend y backend deben importar `ENDPOINTS`, `EVENTS` y `REFRESH_EVENTS` desde la entrada principal `mc-endpoints`, sin mantener copias locales ni usar subrutas del paquete.
- Las partidas se guardan en memoria en `Mc.matches` (`packages/mc-back/src/server/mc.js`); el cliente envía el nombre de la partida en la cabecera HTTP `match`.

## REST: configuración y acciones

`Api.get()` y `Api.post()` envían peticiones HTTP con `fetch` y JSON. `McRest` analiza el JSON, busca la partida usando la cabecera `match` y delega en los handlers de `packages/mc-back/src/server/rest/`.

Rutas REST registradas actualmente:

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/get-heroes-list` | Obtener la lista de héroes |
| `GET` | `/get-scenarios-list` | Obtener la lista de escenarios |
| `POST` | `/create-match` | Crear y guardar una partida |
| `POST` | `/create-player` | Añadir un jugador |
| `POST` | `/create-scenario` | Añadir un escenario |
| `POST` | `/init-match` | Inicializar el motor y la partida |
| `POST` | `/player-flip` | Cambiar la identidad del jugador |
| `POST` | `/play-card` | Jugar una carta |
| `POST` | `/resolve-ability` | Resolver una capacidad |

La configuración inicial llama a estas rutas en secuencia desde `components/api/config-match.js` y `pages/mc-create-match-page/mc-create-match-page.js`. Las acciones de cambiar identidad, jugar carta y resolver capacidad también usan REST. El fin de turno, en cambio, usa Socket.IO.

`Api.request()` resuelve las rutas REST (que empiezan por `/`) contra `httpHost` con `new URL()`. Por ejemplo, `/create-match` produce `http://localhost:3000/create-match`, la misma ruta que registra Express.

## Socket.IO: eventos, respuestas y actualizaciones

El cliente abre la conexión Socket.IO con `ws://localhost:3000` al inicializar `Api`. Se usa para:

- **Fin de turno:** el frontend emite `end-turn`; el motor espera ese evento para continuar la fase.
- **Diálogos interactivos:** el backend emite `open-dialog`; el frontend presenta el diálogo y devuelve la selección mediante `dialog-response`.
- **Actualizaciones de estado:** el backend emite eventos como `match-refresh`, `player-refresh`, `player-zone-refresh`, `scenario-refresh`, `scenario-zone-refresh`, `hand-refresh`, `deck-refresh` y `card-refresh`. El frontend los escucha desde `mc-match-page` y actualiza el estado que Lit vuelve a renderizar.

Los nombres de estos eventos y sus payloads forman parte del contrato de `packages/mc-endpoints/events.js`. Al añadir o cambiar un evento, actualiza ese paquete y el listener/emisor correspondiente.

## Flujo y responsabilidades

1. El backend es la autoridad del estado de juego: las acciones se validan y ejecutan en los handlers/modelos del backend y el motor aplica triggers y efectos.
2. Las respuestas REST inicializan la partida y devuelven objetos serializados. Para los cambios durante el juego, comprueba el evento `*-refresh` correspondiente; no asumas que cada componente actualiza su estado a partir de la respuesta REST.
3. Los eventos del DOM de los componentes Lit llegan a `mc-match-page`, que llama a las APIs del frontend. Las actualizaciones Socket.IO se integran en `match` y se propagan a la interfaz.
4. No asumas que Socket.IO difunde a todos los jugadores: actualmente `Mc` guarda una única conexión en `this.socket` y `McSocket.send()` emite a esa conexión, no a una sala ni a todos los sockets.

No uses como contrato rutas genéricas como `/match/:name/action` ni eventos como `player:action`: no son los mecanismos implementados actualmente. Antes de documentar un transporte o evento nuevo, verifica emisor, receptor, payload y actualización visible en el frontend.
