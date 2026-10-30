# Guía de Comunicación entre Backend y Frontend (Skill)

Consulta esta guía antes de cambiar cómo se comunican la interfaz y el servidor. Describe el contrato actual; para confirmar detalles, revisa las rutas, los eventos y sus consumidores en el código indicado.

## Arquitectura actual

- El frontend Lit inicializa `Api` en `packages/front/mc-frontend/src/components/core/mc-app/mc-app.js`. Su implementación está en `packages/front/mc-frontend/src/components/api/api.js`.
- La carcasa carga el remoto `mc-static` al iniciar; este sirve imágenes, fuentes, favicons y CSS desde `packages/front/mc-static/src/assets/`. El runtime config de la carcasa está en `packages/front/mc-frontend/public/app-config.json`.
- El backend configura Express y Socket.IO sobre el mismo servidor HTTPS en `packages/back/mc-back/src/server/mc.js`; escucha en el puerto `3000`. El frontend de desarrollo se sirve por HTTPS en el puerto `8000`.
- Las rutas REST públicas e internas se centralizan en `packages/core/mc-endpoints/endpoints.js` y los eventos compartidos en `packages/core/mc-endpoints/events.js`. Frontend y servicios deben importar `ENDPOINTS`, `INTERNAL_ENDPOINTS`, `EVENTS` y `REFRESH_EVENTS` desde la entrada principal `mc-endpoints`, sin mantener copias locales ni usar subrutas del paquete.
- Las partidas activas se mantienen en `Mc.matches` y sus instantáneas se persisten en MongoDB mediante `packages/back/mc-data`; incluyen una configuración compacta para reiniciar, sin anidar una segunda instantánea completa del motor. Al iniciar, el backend rehidrata y reanuda las partidas que siguen activas. El cliente envía el nombre de la partida en la cabecera HTTP `match`.
- `packages/core/mc-shared` contiene los identificadores del dominio usados por las configuraciones almacenadas en MongoDB y por el motor. Mantén estables sus valores al cambiar constantes: el contenido persistido usa esos strings.
- El navegador se conecta a APIs HTTPS y Socket.IO WSS para poder enviar la cookie `Secure`; configura certificados válidos en cada servicio y sus orígenes HTTPS en `FRONTEND_ORIGINS`.
- `mc-data` carga automáticamente los registros iniciales que falten al conectar. `npm run start:backend` ejecuta `npm run seed:data` antes de iniciar el backend (también en `start:all` y `docker:up`); el seed reemplaza los documentos del catálogo empaquetado por los valores exportados por sus módulos JavaScript.

## REST: configuración y acciones

`Api.get()`, `Api.post()` y `Api.delete()` envían peticiones HTTP con `fetch` y JSON. Las rutas de catálogo y configuración van a `mc-match-creation-service` (puerto 3001), que sirve el catálogo y reenvía las operaciones de creación a `mc-back` por rutas internas `/internal/...`. El servicio de partidas usa la cabecera `match` para seleccionar el estado en memoria.

Las respuestas de error REST usan JSON con la forma `{error: {message, status}}` y el estado HTTP correspondiente. `McRest` devuelve `404` para rutas desconocidas, conserva estados de error válidos entre `400` y `599` y responde con un mensaje genérico `500` para errores inesperados, que registra en el servidor. `Api.request()` valida el estado y el tipo de contenido, y rechaza la promesa con el mensaje y estado del error para que la interfaz pueda mostrarlo.

`mc-user-service` (puerto 3003) mantiene la cookie de sesión y el campo `users.isAdmin`. Sus rutas de gestión usan `/users` sin un prefijo de URL para administración; todas requieren una sesión y permisos de administrador validados en el backend. Las cuentas autenticadas sin permisos reciben HTTP `403`.

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/me` | Consultar la sesión actual, incluido `isAdmin` |
| `GET` | `/users/search?query=<texto>` | Buscar usuarios activados por nombre o email para añadir amistades |
| `GET` | `/friends` | Listar los amigos de la sesión con `isFriendOf` para indicar si la amistad es recíproca |
| `POST` | `/friends/:id` | Añadir al usuario indicado a la lista asimétrica de amigos |
| `DELETE` | `/friends/:id` | Quitar al usuario indicado de la lista de amigos |
| `GET` | `/users` | Listar cuentas (solo administradores) |
| `GET` | `/users/:id` | Consultar el detalle (solo administradores) |
| `PATCH` | `/users/:id` | Cambiar `{isAdmin:boolean}` de otra cuenta |
| `POST` | `/users/:id/password-reset` | Enviar al usuario un enlace de restablecimiento |
| `POST` | `/users/:id/ban` | Banear la cuenta y revocar sus sesiones |
| `POST` | `/users/:id/unban` | Quitar el baneo |
| `DELETE` | `/users/:id` | Borrado lógico de la cuenta |
| `POST` | `/users/:id/restore` | Restaurar una cuenta borrada lógicamente |
| `DELETE` | `/users/:id/permanent` | Borrado definitivo de una cuenta ya borrada y sus mazos |

Las rutas de amistades y búsqueda requieren sesión, excluyen la cuenta propia de los resultados y no modifican la lista de la otra persona. El backend impide que una cuenta cambie su propio rol, se banee o quite su propio baneo, y protege al último administrador frente a la desactivación o eliminación. Los usuarios borrados lógicamente no pueden iniciar sesión; el borrado definitivo conserva tombstones de mazos para que la restauración del catálogo no los vuelva a importar y elimina referencias de amistad a esa cuenta.

Rutas REST públicas disponibles en `mc-match-creation-service`:

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/get-heroes-list` | Obtener la lista de héroes |
| `GET` | `/get-matches-list` | Listar las partidas persistidas en MongoDB, con el héroe y aspecto de cada jugador |
| `GET` | `/get-scenarios-list` | Obtener la lista de escenarios |
| `POST` | `/create-match` | Crear y guardar una partida |
| `POST` | `/reset-match` | Reiniciar una partida con la configuración de creación conservada |
| `DELETE` | `/delete-match` | Eliminar como creador una partida activa o su instantánea persistida aunque no esté cargada (JSON `{name}`); requiere sesión y es idempotente si ya no existe |
| `POST` | `/create-player` | Añadir un jugador |
| `POST` | `/create-scenario` | Añadir un escenario |
| `POST` | `/init-match` | Inicializar el motor y la partida |
| `POST` | `/player-flip` | Cambiar la identidad del jugador |
| `POST` | `/play-card` | Jugar una carta |
| `POST` | `/resolve-ability` | Resolver una capacidad |

La creación de salas multijugador usa estas rutas de `mc-match-creation-service`:

| Método | Ruta | Uso |
| :--- | :--- | :--- |
| `GET` | `/match-lobbies` | Listar todas las salas en espera, incluidas las completas; usa `ENDPOINTS.MATCH.LOBBIES` |
| `POST` | `/match-lobbies` | Crear sala vacía con `{name,maxPlayers,scenario:{scenario,modularSets},expert}`; los héroes se añaden después en el lobby |
| `GET` | `/match-lobbies/:id` | Consultar los detalles completos de una sala con sesión iniciada |
| `POST` | `/match-lobbies/:id/join` | Inscribir un héroe con `{hero,deckId}`, incluso si la cuenta ya controla otro |
| `POST` | `/match-lobbies/:id/leave` | Retirar todos los héroes de la cuenta de una sala en espera (no disponible para el creador) |
| `POST` | `/match-lobbies/:id/start` | Preparar la partida como creador, con al menos un héroe inscrito, incluso si hay plazas libres o el creador no juega; devuelve `{lobby,matchId,matchName,expert}` sin inicializar |
| `DELETE` | `/match-lobbies/:id` | Eliminar como creador una sala en espera |

El servicio valida la sesión enviando la cabecera `Cookie` a `GET ${AUTH_SERVICE_URL}/me`; por defecto `AUTH_SERVICE_URL` es `https://localhost:3003`. El ID y nombre de cuenta de esa respuesta son la autoridad para las salas; no se aceptan nombres ni IDs de cuenta enviados por el cliente. El inicio usa los registros persistidos de la sala para crear jugadores y escenario mediante `INTERNAL_ENDPOINTS`, y reenvía la cookie al servicio de partidas. Configura `FRONTEND_ORIGINS` como una lista separada por comas cuando la interfaz no se sirve desde `https://localhost:8000` o `https://localhost:8100`.

Las respuestas de sala (incluidas las listas) exponen `{id,name,status,maxPlayers,ownerId,players:[{id,userId,name,hero,heroName,aspect,deckId}],scenarioName,expert,modularSetNames,matchId}`; `matchId` es `null` mientras no se haya reclamado el inicio. `maxPlayers` limita el total de superhéroes, no el de cuentas. Cada puesto tiene un `id` estable y propio; `userId` identifica la cuenta que lo controla y puede repetirse. Los nombres de los puestos de una cuenta con varios héroes llevan sufijos `(1)`, `(2)`, etc.

Los diálogos dirigidos conservan ese nombre de puesto en `targetPlayerName` y pueden incluir `targetHeroName` con el nombre del superhéroe para distinguir las decisiones durante el setup, antes de recibir el tablero completo.

El diálogo `defense` incluye `data.defenders` y, cuando se puede pedir ayuda, `data.players` con los otros puestos elegibles serializados mediante `Player.toTargetObj()`. La respuesta `{defendingPlayerId}` solicita otro puesto; `{defender: {id}}` elige un personaje propio. El backend revalida ambos IDs y dirige la siguiente decisión al puesto solicitado, sin opciones de reenviar la petición. Rechazar devuelve el diálogo al objetivo original sin cambiarlo ni agotar cartas. Aceptar establece un único defensor y cambia el jugador afectado por el ataque, los aumentos y el daño; se conserva intacto el contexto que inició la capacidad.

Los eventos `card-refresh` de cartas controladas por un jugador incluyen `playerId` del controlador actual, que puede diferir del propietario original. El cliente usa ese puesto para actualizar la carta: los IDs impresos de cartas compartidas entre mazos pueden coincidir y no bastan por sí solos para localizarla entre todos los héroes. Las cartas controladas por el escenario no incluyen ese campo.

Los IDs de instancia de las cartas son únicos dentro de la partida: todas las instancias de `MatchFactory` comparten el contador persistido `match.copyIndexesByCardId`, sin modificar los IDs impresos. Al restaurar instantáneas antiguas, `RestoreCardIdentities` reconstruye ese contador, normaliza IDs duplicados y recupera el registro de disparadores conservando las referencias a cartas y jugadores. Una selección antigua que solo conserve un ID ambiguo produce un error explícito, en vez de elegir la carta de otro héroe.

El inicio prepara el match y persiste su ID/nombre en estado `starting`, pero no ejecuta `/init-match`. La interfaz debe cargar `mc-match`, unirse a Socket.IO con `join-match` usando el nombre devuelto y después llamar al `/init-match` existente; así puede recibir y contestar los diálogos de setup. Los reintentos de `/start` devuelven la misma identidad/configuración y no reconstruyen una sala ya preparada. La sala permanece bloqueada para unirse, salir o eliminarse hasta que termina la inicialización.

Si el creador no controla ningún héroe, establece el nombre de partida en `Api` y solicita `/init-match` sin unirse a Socket.IO ni emitir `match-resumed`: permanece en el lobby y los invitados reciben sus propios diálogos al conectarse. Al volver a una sala en `starting`, el organizador reintenta `/start` antes de inicializar para asegurar que su configuración está completa. La reclamación atómica de inicio exige `players.0`, evitando iniciar una sala vacía si el último invitado sale concurrentemente. Los resúmenes de `/get-matches-list` incluyen también las partidas del creador aunque no juegue; esto no le concede permisos para unirse al tablero o actuar por otros héroes.

`/play-card` recibe `player` y `cardId`, y acepta `targetId` opcional cuando se juega una carta arrastrándola sobre un objetivo legal, incluido el ID de otro jugador para cartas que pueden asignarse a cualquier jugador. La serialización de la mano expone los IDs de jugadores elegibles aparte de los objetivos de carta para que el frontend ofrezca las zonas de drop correctas. El backend debe volver a resolver y validar ese ID con el estado actual, y conservar el objetivo seleccionado durante el pago y la resolución de sus efectos; no debe confiar en un objeto de carta enviado por el cliente. La selección por clic se resuelve en un diálogo dirigido al jugador que juega la carta.

`mc-back` expone las operaciones de creación mediante las rutas `INTERNAL_ENDPOINTS` con prefijo `/internal/`; las acciones de juego continúan registradas directamente en ese servicio.

Las acciones REST de juego y los eventos Socket.IO validan la cookie contra `/me`. El backend asocia la cuenta autenticada con el `userId` serializado del jugador, limita `join-match` a miembros de esa partida, `end-turn` al puesto activo, y las respuestas de diálogo a la cuenta que controla el puesto indicado por `targetPlayer` cuando existe ese destino. Las acciones envían el `id` del puesto en `player`, no la identidad de la cuenta compartida por varios héroes. `GET /get-matches-list` también requiere una sesión válida y solo devuelve las partidas en las que participa la cuenta autenticada o que ha creado.

La lista de partidas incluye `creatorUserId` cuando está registrado y `scenarioName` con el nombre del catálogo (por ejemplo, **Rino**); `scenario` conserva el identificador interno `rhino`. El botón **Eliminar partida** solo se ofrece al creador, tanto en salas en espera como en partidas iniciadas, y pide confirmación. `/delete-match` comprueba el creador registrado en memoria o en la instantánea persistida y rechaza otras cuentas con HTTP `403`; nunca toma el ID del creador del cuerpo de la petición.

Las instantáneas de partida también incluyen `creatorUserId`. **Reiniciar partida** solo aparece para esa cuenta, tanto en el listado como en el tablero. `/reset-match` autentica la cookie y comprueba el creador registrado antes de cancelar diálogos, detener la partida o reconstruirla; rechaza las demás cuentas con HTTP `403`, sin aceptar identidades del cuerpo. El reinicio conserva el creador y la sala de la partida original.

El lobby usa `GET /get-matches-list` para mostrar las partidas, `DELETE /delete-match` para eliminarlas y `POST /reset-match` para reiniciarlas con la configuración de creación guardada. Antes de iniciar o reiniciar una partida, la carcasa carga `mc-match`, que registra los diálogos que el backend puede solicitar durante el setup. Cada partida tiene un `id` estable para su ruta `/match/:id`; el nombre continúa identificando las salas internas y se envía en la cabecera `match` para las acciones existentes. Al reanudar una partida, el cliente se une por Socket.IO y recibe su estado por `match-refresh`. Las acciones de cambiar identidad, jugar carta y resolver capacidad siguen usando REST; el fin de turno usa Socket.IO.

`Api.request()` dirige las rutas de catálogo/creación a `services.matchCreation`, las rutas de mazos a `services.deck` y las acciones de juego a `services.match`, configuradas en `packages/front/mc-frontend/public/app-config.json`. Por defecto, `/create-match` produce `https://localhost:3001/create-match`; el Socket.IO del servicio de partidas usa `wss://localhost:3000`.

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

El cliente abre la conexión Socket.IO con `wss://localhost:3000` al inicializar `Api`. Se usa para:

- **Fin de turno:** el frontend emite `end-turn`; el motor espera ese evento para continuar la fase.
- **Diálogos interactivos:** el backend emite `open-dialog`; el frontend presenta el diálogo y devuelve la selección mediante `dialog-response`. Los diálogos que piden una decisión se dirigen al jugador que debe resolverla (por defecto, quien activa la capacidad); si un efecto pide decisiones a varios jugadores, cada diálogo se dirige al jugador correspondiente. `targetPlayer` identifica el puesto y `targetUserId`, calculado por el servidor a partir de ese puesto, identifica su cuenta controladora incluso antes de la primera instantánea. La cuenta puede responder por cualquiera de sus héroes sin tenerlo seleccionado; sus diálogos simultáneos se ponen en cola sin perder el `requestId`. Los diálogos para pagar costes se dirigen al jugador que debe elegir los recursos. Las demás conexiones esperan sin ver la selección privada. El payload puede incluir `closeOnResponse: true` para cerrar de inmediato el diálogo de selección mientras el backend termina de resolver el último paso, sin esperar al acknowledgement. Mientras una petición `play-card` siga pendiente, la mano se deshabilita y vuelve a habilitarse al terminar para evitar jugadas concurrentes.
- **Revelaciones públicas:** `Engine.openPublicDialog(params, player)` envía `showToAll: true` y `targetPlayer` (el jugador inicial si no se proporciona otro). Todos ven la carta y el nombre del responsable, pero solo su cuenta autenticada puede responder. Los observadores reciben `readOnly`, sin callback, mano ni botones; no pueden cerrar con Escape. `dialog-complete` cierra el diálogo en todos los clientes por su `requestId`. Un cierre o acknowledgement anterior nunca debe cerrar el siguiente diálogo, tampoco tras reconectar. No uses este contrato para selecciones o pagos privados.
- **Avisos de activación:** comparten el contrato público de un único respondedor, también al omitir la activación por un estado. En ataques, `targetPlayer` es el propietario del objetivo original; en ejecuciones del Plan es el jugador de esa activación. No atribuyas el aviso al jugador que inició una capacidad contra otro jugador ni al defensor elegido después.
- **Mulligan de preparación:** cada diálogo de mulligan incluye `targetPlayer` y `targetUserId` para que solo lo muestre y responda la cuenta correspondiente. Si controla varios héroes, sus mulligans se presentan uno a uno y el aviso de espera se oculta mientras queda alguno propio pendiente. Tras esperar a que terminen todos los mulligans, el backend emite `mulligan-complete` (`EVENTS.MATCH.MULLIGAN_COMPLETE`) para que los clientes quiten el aviso de espera. El cliente identifica esa señal con la partida conectada (`api.match`) o pendiente, ya que puede llegar antes de la primera instantánea; una instantánea ya inicializada también elimina una espera de mulligan que haya quedado abierta tras una reconexión. El modal se controla mediante la propiedad `.open` y no contiene botones.
- **Actualizaciones de estado:** el backend emite eventos como `match-refresh`, `player-refresh`, `player-zone-refresh`, `scenario-refresh`, `scenario-zone-refresh`, `hand-refresh`, `deck-refresh` y `card-refresh`. El frontend los escucha desde `mc-match-page` y actualiza el estado que Lit vuelve a renderizar. `hand-refresh` envía `{playerId,hand}` para actualizar el puesto propietario, aunque no esté seleccionado; en las instantáneas completas, `player.hand` sigue siendo un array. Cada zona de jugador expone el ID estable `player-zone:<id del puesto>` tanto en `player.gameZone` como en `player-zone-refresh`.
- **Unión y reconexión:** el frontend emite `join-match` con el nombre de la partida. El backend valida la partida y une el socket a su sala. Cuando el setup ha terminado, devuelve una instantánea completa mediante `match-refresh`; durante el setup, vuelve a emitir los diálogos pendientes. Al reconectar, el frontend vuelve a unirse y resincroniza la partida.
- **Confirmaciones:** los eventos de fin de turno y respuesta de diálogo incluyen el nombre de la partida y usan acknowledgements de Socket.IO. El frontend muestra los errores o expiraciones en lugar de dejar la acción sin respuesta.
- **Reanudación desde el lobby:** `/get-matches-list` devuelve resúmenes de `Mc.matches`; al seleccionar una partida, el frontend vuelve a unirse a su sala y la instantánea `match-refresh` restaura el tablero. Las partidas se cargan desde MongoDB y sobreviven a reinicios del backend.

Los nombres de estos eventos y sus payloads forman parte del contrato de `packages/core/mc-endpoints/events.js`. Al añadir o cambiar un evento, actualiza ese paquete y el listener/emisor correspondiente.

Los diálogos locales, sin `requestId` (menús de acciones, confirmaciones y selección de cartas para jugar), se cierran por defecto antes de invocar su callback. Este puede esperar una petición REST que a su vez necesite diálogos del servidor: dejar el menú abierto bloquearía esos diálogos en la cola. `closeOnResponse: false` permite conservar explícitamente un diálogo local; los diálogos del servidor mantienen su cierre por acknowledgement o `dialog-complete`, salvo que incluyan `closeOnResponse: true`. El cierre y los errores de un callback anterior nunca deben retirar la siguiente decisión.

Las capacidades que permiten elegir un jugador ofrecen los puestos de héroe elegibles, aunque compartan `userId`; la cuenta responsable elige quién recibe el efecto. No conviertas `TARGET_YOU` en una elección ni `TARGET_ALL_PLAYERS` en un único beneficiario: conserva la semántica del selector.

## Flujo y responsabilidades

1. El backend es la autoridad del estado de juego: las acciones se validan y ejecutan en los handlers/modelos del backend y el motor aplica triggers y efectos.
   Una solicitud de acción aceptada permite únicamente capacidades de Acción y eventos de Acción, no opciones del turno propio (cambio voluntario de identidad, atributos básicos o jugar permanentes normalmente). `player-turn-permissions.js` aplica esta distinción en los comandos del modelo y en la disponibilidad serializada; no debe usarse para impedir cambios o jugadas causados por efectos legales.
2. Las respuestas REST inicializan la partida y devuelven objetos serializados. Para los cambios durante el juego, comprueba el evento `*-refresh` correspondiente; no asumas que cada componente actualiza su estado a partir de la respuesta REST.
3. Los eventos del DOM de los componentes Lit llegan a `mc-match-page`, que llama a las APIs del frontend. Las actualizaciones Socket.IO se integran en `match` y se propagan a la interfaz.
4. El backend enruta las actualizaciones por salas `mc-match:<nombre>`. Los clientes solo reciben eventos de las partidas a las que se han unido; no vuelvas a guardar un único socket global en `Mc`.

No uses como contrato rutas genéricas como `/match/:name/action` ni eventos como `player:action`: no son los mecanismos implementados actualmente. Antes de documentar un transporte o evento nuevo, verifica emisor, receptor, payload y actualización visible en el frontend.
