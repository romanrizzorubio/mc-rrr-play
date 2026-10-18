# Guía de Comunicación entre Backend y Frontend (Skill)

Consulta esta guía antes de cambiar cómo se comunican la interfaz y el servidor. Describe el contrato actual; para confirmar detalles, revisa las rutas, los eventos y sus consumidores en el código indicado.

## Arquitectura actual

- El frontend Lit inicializa `Api` en `packages/front/mc-frontend/src/components/core/mc-app/mc-app.js`. Su implementación está en `packages/front/mc-frontend/src/components/api/api.js`.
- La carcasa carga el remoto `mc-static` al iniciar; este sirve imágenes, fuentes, favicons y CSS desde `packages/front/mc-static/src/assets/`. El runtime config de la carcasa está en `packages/front/mc-frontend/public/app-config.json`.
- El backend configura Express y Socket.IO sobre el mismo servidor HTTP en `packages/back/mc-back/src/server/mc.js`; escucha en el puerto `3000`. El frontend de desarrollo se sirve en el puerto `8000`.
- Las rutas REST públicas e internas se centralizan en `packages/core/mc-endpoints/endpoints.js` y los eventos compartidos en `packages/core/mc-endpoints/events.js`. Frontend y servicios deben importar `ENDPOINTS`, `INTERNAL_ENDPOINTS`, `EVENTS` y `REFRESH_EVENTS` desde la entrada principal `mc-endpoints`, sin mantener copias locales ni usar subrutas del paquete.
- Las partidas activas se mantienen en `Mc.matches` y sus instantáneas se persisten en MongoDB mediante `packages/back/mc-data`; incluyen una configuración compacta para reiniciar, sin anidar una segunda instantánea completa del motor. Al iniciar, el backend rehidrata y reanuda las partidas que siguen activas. El cliente envía el nombre de la partida en la cabecera HTTP `match`.
- `packages/core/mc-shared` contiene los identificadores del dominio usados por las configuraciones almacenadas en MongoDB y por el motor. Mantén estables sus valores al cambiar constantes: el contenido persistido usa esos strings.
- `mc-data` carga automáticamente los registros iniciales que falten al conectar. `npm run start:backend` ejecuta `npm run seed:data` antes de iniciar el backend (también en `start:all` y `docker:up`); el seed reemplaza los documentos del catálogo empaquetado por los valores exportados por sus módulos JavaScript.

## REST: configuración y acciones

`Api.get()`, `Api.post()` y `Api.delete()` envían peticiones HTTP con `fetch` y JSON. Las rutas de catálogo y configuración van a `mc-match-creation-service` (puerto 3001), que sirve el catálogo y reenvía las operaciones de creación a `mc-back` por rutas internas `/internal/...`. El servicio de partidas usa la cabecera `match` para seleccionar el estado en memoria.

Las respuestas de error REST usan JSON con la forma `{error: {message, status}}` y el estado HTTP correspondiente. `McRest` devuelve `404` para rutas desconocidas, conserva estados de error válidos entre `400` y `599` y responde con un mensaje genérico `500` para errores inesperados, que registra en el servidor. `Api.request()` valida el estado y el tipo de contenido, y rechaza la promesa con el mensaje y estado del error para que la interfaz pueda mostrarlo.

Rutas REST públicas disponibles en `mc-match-creation-service`:

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/get-heroes-list` | Obtener la lista de héroes |
| `GET` | `/get-matches-list` | Listar las partidas persistidas en MongoDB, con el héroe y aspecto de cada jugador |
| `GET` | `/get-scenarios-list` | Obtener la lista de escenarios |
| `POST` | `/create-match` | Crear y guardar una partida |
| `POST` | `/reset-match` | Reiniciar una partida con la configuración de creación conservada |
| `DELETE` | `/delete-match` | Eliminar por nombre una partida activa o su instantánea persistida aunque no esté cargada (JSON `{name}`); la operación es idempotente si ya no existe |
| `POST` | `/create-player` | Añadir un jugador |
| `POST` | `/create-scenario` | Añadir un escenario |
| `POST` | `/init-match` | Inicializar el motor y la partida |
| `POST` | `/player-flip` | Cambiar la identidad del jugador |
| `POST` | `/play-card` | Jugar una carta |
| `POST` | `/resolve-ability` | Resolver una capacidad |

`/play-card` recibe `player` y `cardId`, y acepta `targetId` opcional cuando se juega una carta arrastrándola sobre un objetivo legal. El backend debe volver a resolver y validar ese ID con el estado actual, y conservar el objetivo seleccionado durante el pago y la resolución de sus efectos; no debe confiar en un objeto de carta enviado por el cliente.

`mc-back` expone las operaciones de creación mediante las rutas `INTERNAL_ENDPOINTS` con prefijo `/internal/`; las acciones de juego continúan registradas directamente en ese servicio.

El lobby usa `GET /get-matches-list` para mostrar las partidas, `DELETE /delete-match` para eliminarlas y `POST /reset-match` para reiniciarlas con la configuración de creación guardada. Antes de iniciar o reiniciar una partida, la carcasa carga `mc-match`, que registra los diálogos que el backend puede solicitar durante el setup. Cada partida tiene un `id` estable para su ruta `/match/:id`; el nombre continúa identificando las salas internas y se envía en la cabecera `match` para las acciones existentes. Al reanudar una partida, el cliente se une por Socket.IO y recibe su estado por `match-refresh`. Las acciones de cambiar identidad, jugar carta y resolver capacidad siguen usando REST; el fin de turno usa Socket.IO.

`Api.request()` dirige las rutas de catálogo/creación a `services.matchCreation`, las rutas de mazos a `services.deck` y las acciones de juego a `services.match`, configuradas en `packages/front/mc-frontend/public/app-config.json`. Por defecto, `/create-match` produce `http://localhost:3001/create-match`; el Socket.IO del servicio de partidas usa `ws://localhost:3000`.

Las rutas de construcción y persistencia de mazos usan `services.deck` y el servicio `mc-deck-service` (puerto `3002`):

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/deck-heroes-list` | Obtener los superhéroes disponibles para el editor, incluida la imagen de su carta de héroe |
| `GET` | `/deck-catalog?hero=<id>` | Obtener las cartas y reglas de construcción de un superhéroe |
| `GET` | `/decks` | Listar todos los mazos con nombre del héroe y validación para el catálogo principal |
| `GET` | `/decks?legal=true` | Listar todos los mazos legales |
| `GET` | `/decks?hero=<id>` | Listar mazos y borradores del editor |
| `GET` | `/decks?hero=<id>&legal=true` | Listar solo mazos legales para crear una partida |
| `GET` | `/decks/<id>` | Consultar un mazo guardado |
| `POST` | `/decks` | Crear o actualizar un mazo |
| `DELETE` | `/decks/<id>` | Eliminar un mazo |
| `POST` | `/decks/save-repository` | Guardar el backup físico de mazos en el catálogo |
| `POST` | `/decks/restore-repository` | Restaurar los eventos de mazos del snapshot versionado |

Los mazos guardan únicamente referencias `{id, count}` a cartas editables, además del héroe, el aspecto y sus metadatos. Las cartas fijas específicas del héroe se cargan desde el catálogo al crear el jugador. El cliente solo ofrece mazos legales al iniciar una partida; los borradores permanecen disponibles para editarse.

## Socket.IO: eventos, respuestas y actualizaciones

El cliente abre la conexión Socket.IO con `ws://localhost:3000` al inicializar `Api`. Se usa para:

- **Fin de turno:** el frontend emite `end-turn`; el motor espera ese evento para continuar la fase.
- **Diálogos interactivos:** el backend emite `open-dialog`; el frontend presenta el diálogo y devuelve la selección mediante `dialog-response`. El payload puede incluir `closeOnResponse: true` para cerrar de inmediato el diálogo de selección mientras el backend termina de resolver el último paso, sin esperar al acknowledgement. Mientras una petición `play-card` siga pendiente, la mano se deshabilita y vuelve a habilitarse al terminar para evitar jugadas concurrentes.
- **Actualizaciones de estado:** el backend emite eventos como `match-refresh`, `player-refresh`, `player-zone-refresh`, `scenario-refresh`, `scenario-zone-refresh`, `hand-refresh`, `deck-refresh` y `card-refresh`. El frontend los escucha desde `mc-match-page` y actualiza el estado que Lit vuelve a renderizar.
- **Unión y reconexión:** el frontend emite `join-match` con el nombre de la partida. El backend valida la partida y une el socket a su sala. Cuando el setup ha terminado, devuelve una instantánea completa mediante `match-refresh`; durante el setup, vuelve a emitir los diálogos pendientes. Al reconectar, el frontend vuelve a unirse y resincroniza la partida.
- **Confirmaciones:** los eventos de fin de turno y respuesta de diálogo incluyen el nombre de la partida y usan acknowledgements de Socket.IO. El frontend muestra los errores o expiraciones en lugar de dejar la acción sin respuesta.
- **Reanudación desde el lobby:** `/get-matches-list` devuelve resúmenes de `Mc.matches`; al seleccionar una partida, el frontend vuelve a unirse a su sala y la instantánea `match-refresh` restaura el tablero. Las partidas se cargan desde MongoDB y sobreviven a reinicios del backend.

Los nombres de estos eventos y sus payloads forman parte del contrato de `packages/core/mc-endpoints/events.js`. Al añadir o cambiar un evento, actualiza ese paquete y el listener/emisor correspondiente.

## Flujo y responsabilidades

1. El backend es la autoridad del estado de juego: las acciones se validan y ejecutan en los handlers/modelos del backend y el motor aplica triggers y efectos.
2. Las respuestas REST inicializan la partida y devuelven objetos serializados. Para los cambios durante el juego, comprueba el evento `*-refresh` correspondiente; no asumas que cada componente actualiza su estado a partir de la respuesta REST.
3. Los eventos del DOM de los componentes Lit llegan a `mc-match-page`, que llama a las APIs del frontend. Las actualizaciones Socket.IO se integran en `match` y se propagan a la interfaz.
4. El backend enruta las actualizaciones por salas `mc-match:<nombre>`. Los clientes solo reciben eventos de las partidas a las que se han unido; no vuelvas a guardar un único socket global en `Mc`.

No uses como contrato rutas genéricas como `/match/:name/action` ni eventos como `player:action`: no son los mecanismos implementados actualmente. Antes de documentar un transporte o evento nuevo, verifica emisor, receptor, payload y actualización visible en el frontend.
