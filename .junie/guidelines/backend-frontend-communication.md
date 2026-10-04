# Guía de Comunicación entre Backend y Frontend (Skill)

Consulta esta guía antes de cambiar cómo se comunican la interfaz y el servidor. Describe el contrato actual; para confirmar detalles, revisa las rutas, los eventos y sus consumidores en el código indicado.

## Arquitectura actual

- El frontend Lit inicializa `Api` en `packages/mc-frontend/src/components/core/mc-app/mc-app.js`. Su implementación está en `packages/mc-frontend/src/components/api/api.js`.
- El backend configura Express y Socket.IO sobre el mismo servidor HTTP en `packages/mc-back/src/server/mc.js`; escucha en el puerto `3000`. El frontend de desarrollo se sirve en el puerto `8000`.
- Las rutas REST se centralizan en `packages/mc-endpoints/endpoints.js` y los eventos compartidos en `packages/mc-endpoints/events.js`. Frontend y backend deben importar `ENDPOINTS`, `EVENTS` y `REFRESH_EVENTS` desde la entrada principal `mc-endpoints`, sin mantener copias locales ni usar subrutas del paquete.
- Las partidas activas se mantienen en `Mc.matches` y sus instantáneas se persisten en MongoDB mediante `packages/mc-data`; al iniciar, el backend las rehidrata y reanuda las que siguen activas. El cliente envía el nombre de la partida en la cabecera HTTP `match`.
- `packages/mc-shared` contiene los identificadores del dominio usados por las configuraciones almacenadas en MongoDB y por el motor. Mantén estables sus valores al cambiar constantes: el contenido persistido usa esos strings.
- `mc-data` carga automáticamente los registros iniciales que falten al conectar. `npm run start:backend` ejecuta `npm run seed:data` antes de iniciar el backend (también en `start:all` y `docker:up`); el seed reemplaza los documentos del catálogo empaquetado por los valores exportados por sus módulos JavaScript.

## REST: configuración y acciones

`Api.get()`, `Api.post()` y `Api.delete()` envían peticiones HTTP con `fetch` y JSON. `McRest` analiza el JSON, busca la partida usando la cabecera `match` para las acciones de juego y delega en los handlers de `packages/mc-back/src/server/rest/`.

Rutas REST registradas actualmente:

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/get-heroes-list` | Obtener la lista de héroes |
| `GET` | `/get-matches-list` | Listar las partidas persistidas en MongoDB |
| `GET` | `/get-scenarios-list` | Obtener la lista de escenarios |
| `POST` | `/create-match` | Crear y guardar una partida |
| `DELETE` | `/delete-match` | Eliminar una partida activa y su instantánea persistida (JSON `{name}`) |
| `POST` | `/create-player` | Añadir un jugador |
| `POST` | `/create-scenario` | Añadir un escenario |
| `POST` | `/init-match` | Inicializar el motor y la partida |
| `POST` | `/player-flip` | Cambiar la identidad del jugador |
| `POST` | `/play-card` | Jugar una carta |
| `POST` | `/resolve-ability` | Resolver una capacidad |

El lobby usa `GET /get-matches-list` para mostrar las partidas persistidas y `DELETE /delete-match` para eliminarlas. La creación ya no es automática: al elegir "Nueva partida", `components/api/config-match.js` y `pages/mc-create-match-page/mc-create-match-page.js` ejecutan las rutas de configuración en secuencia. Al reanudar una partida, el cliente se une por Socket.IO y recibe su estado por `match-refresh`. Las acciones de cambiar identidad, jugar carta y resolver capacidad siguen usando REST; el fin de turno usa Socket.IO.

`Api.request()` resuelve las rutas REST (que empiezan por `/`) contra `httpHost` con `new URL()`. Por ejemplo, `/create-match` produce `http://localhost:3000/create-match`, la misma ruta que registra Express.

## Socket.IO: eventos, respuestas y actualizaciones

El cliente abre la conexión Socket.IO con `ws://localhost:3000` al inicializar `Api`. Se usa para:

- **Fin de turno:** el frontend emite `end-turn`; el motor espera ese evento para continuar la fase.
- **Diálogos interactivos:** el backend emite `open-dialog`; el frontend presenta el diálogo y devuelve la selección mediante `dialog-response`. El payload puede incluir `closeOnResponse: true` para cerrar de inmediato el diálogo de selección mientras el backend termina de resolver el último paso, sin esperar al acknowledgement. Mientras una petición `play-card` siga pendiente, la mano se deshabilita y vuelve a habilitarse al terminar para evitar jugadas concurrentes.
- **Actualizaciones de estado:** el backend emite eventos como `match-refresh`, `player-refresh`, `player-zone-refresh`, `scenario-refresh`, `scenario-zone-refresh`, `hand-refresh`, `deck-refresh` y `card-refresh`. El frontend los escucha desde `mc-match-page` y actualiza el estado que Lit vuelve a renderizar.
- **Unión y reconexión:** el frontend emite `join-match` con el nombre de la partida. El backend valida la partida y une el socket a su sala. Cuando el setup ha terminado, devuelve una instantánea completa mediante `match-refresh`; durante el setup, vuelve a emitir los diálogos pendientes. Al reconectar, el frontend vuelve a unirse y resincroniza la partida.
- **Confirmaciones:** los eventos de fin de turno y respuesta de diálogo incluyen el nombre de la partida y usan acknowledgements de Socket.IO. El frontend muestra los errores o expiraciones en lugar de dejar la acción sin respuesta.
- **Reanudación desde el lobby:** `/get-matches-list` devuelve resúmenes de `Mc.matches`; al seleccionar una partida, el frontend vuelve a unirse a su sala y la instantánea `match-refresh` restaura el tablero. Las partidas se cargan desde MongoDB y sobreviven a reinicios del backend.

Los nombres de estos eventos y sus payloads forman parte del contrato de `packages/mc-endpoints/events.js`. Al añadir o cambiar un evento, actualiza ese paquete y el listener/emisor correspondiente.

## Flujo y responsabilidades

1. El backend es la autoridad del estado de juego: las acciones se validan y ejecutan en los handlers/modelos del backend y el motor aplica triggers y efectos.
2. Las respuestas REST inicializan la partida y devuelven objetos serializados. Para los cambios durante el juego, comprueba el evento `*-refresh` correspondiente; no asumas que cada componente actualiza su estado a partir de la respuesta REST.
3. Los eventos del DOM de los componentes Lit llegan a `mc-match-page`, que llama a las APIs del frontend. Las actualizaciones Socket.IO se integran en `match` y se propagan a la interfaz.
4. El backend enruta las actualizaciones por salas `mc-match:<nombre>`. Los clientes solo reciben eventos de las partidas a las que se han unido; no vuelvas a guardar un único socket global en `Mc`.

No uses como contrato rutas genéricas como `/match/:name/action` ni eventos como `player:action`: no son los mecanismos implementados actualmente. Antes de documentar un transporte o evento nuevo, verifica emisor, receptor, payload y actualización visible en el frontend.
