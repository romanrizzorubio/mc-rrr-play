# Características Funcionales del Usuario

## Cuentas

Para ver la pestaña **Partidas**, consultar partidas iniciadas, crear salas o unirte a ellas necesitas una cuenta. Sin sesión, la página principal lleva a **Mazos** y la navegación solo muestra esa pestaña; al iniciar sesión vuelve a aparecer **Partidas**. En la esquina superior derecha se muestra el usuario conectado, con enlaces a **Mi usuario** y **Cerrar sesión**; si no hay sesión, se ofrece **Iniciar sesión**.

La pestaña activa corresponde siempre a la página actual: Partidas incluye sus lobbies y Mazos incluye la creación y edición de mazos; Usuarios incluye el listado y sus detalles de administración. Las páginas de cuenta y las rutas desconocidas no seleccionan ninguna pestaña, tampoco sin sesión. La selección se mantiene al navegar mediante enlaces, volver o avanzar en el navegador y cambiar de sesión.

Desde el inicio de sesión se puede recuperar la contraseña o crear una cuenta. El registro solicita email y nombre visible; el email no puede repetirse. Se envía un enlace de activación al correo y, desde ese enlace, se elige y confirma una contraseña. Al activarla, la cuenta inicia sesión automáticamente. Las cuentas sin activar no pueden iniciar sesión.

Las contraseñas deben tener entre 10 y 128 caracteres y cumplir al menos tres de estas condiciones: minúsculas, mayúsculas, números y símbolos. El formulario permite mostrar u ocultar lo escrito. En **Mi usuario** se puede cambiar el nombre visible y acceder al cambio de contraseña; el email identifica la cuenta y no se modifica desde el perfil.

Cada vista de `mc-users` tiene una página y una ruta propias: inicio de sesión `/login`, alta `/register`, activación `/activate`, recuperación `/forgot-password`, restablecimiento `/reset-password`, perfil `/profile` y cambio de contraseña `/change-password`.

En **Mi usuario** también se muestra la lista de amigos con su nombre, email y si esa persona te ha añadido a su propia lista. La amistad es asimétrica: puedes buscar usuarios activados por nombre o email y añadirlos o dejar de ser amigo sin modificar la lista de la otra persona.

Los administradores ven la pestaña **Usuarios**, con el listado en `/users` y el detalle en `/users/:id`. El listado se puede filtrar por nombre o email y se abre el detalle al seleccionar cualquier parte de una fila. Desde el detalle pueden enviar un enlace de restablecimiento de contraseña, banear o quitar el baneo, y cambiar el campo de administrador de otra cuenta. No se puede cambiar el propio rol de administrador ni banear o quitar el baneo de la propia cuenta. No se puede borrar, por ninguna de las opciones de borrado, al único administrador restante. El baneo y el borrado lógico revocan las sesiones y bloquean el acceso. Las cuentas eliminadas lógicamente se pueden restaurar o borrar definitivamente; el borrado definitivo exige confirmación en un diálogo y elimina también los mazos de esa cuenta. Los mazos conservados durante el borrado lógico muestran **Usuario eliminado** como creador. Todas las operaciones de gestión se autorizan también en el backend: un usuario sin permisos recibe HTTP 403 aunque intente llamar directamente a la API.

## Gestión de Partidas

### Partidas Creadas y Reanudación

**¿Qué permite?**
Ver las salas que esperan jugadores y, con sesión iniciada, consultar las partidas en las que participas o que has creado, volver a una sala y retomar el estado guardado, o iniciar una partida nueva. El servicio exige sesión para listar partidas iniciadas y filtra el resultado según la cuenta autenticada; las salas que esperan jugadores siguen siendo públicas, incluso cuando están completas. Sin sesión, la sección de partidas iniciadas indica que debes iniciar sesión y ofrece un enlace directo a esa página.

**Pasos:**
1. Abrir "Partidas".
2. Elegir una sala en espera para inscribirse o una partida iniciada para reanudarla.
3. En una sala, seleccionar superhéroe y mazo; la identidad del jugador se obtiene de la sesión.
4. El creador puede eliminar la sala mientras espera; los demás inscritos pueden abandonarla antes del inicio.
5. Para volver a empezar una partida iniciada con la misma configuración, presionar "Reiniciar partida" y confirmar.

Para empezar otra, presionar **Nueva partida**. El asistente tiene dos pasos: primero se indican el nombre de la sala y un máximo de 1 a 4 superhéroes; después se configura escenario, modo experto y conjuntos modulares. **Crear partida** abre directamente el lobby vacío, sin elegir héroe ni mazo durante el asistente. Allí el creador y los invitados añaden sus propios héroes con el mismo selector de mazos legales, filtros por nombre y aspecto y la opción Precon. Cada inscripción usa la identidad de la cuenta autenticada, sin introducir otro nombre de jugador.

El creador también puede organizar e iniciar una partida sin jugar: no ocupa una plaza y todos los héroes pueden pertenecer a invitados. Es necesario inscribir al menos un superhéroe para iniciar; los diálogos de preparación se resuelven por las cuentas que controlan esos héroes. El organizador permanece en el lobby, sin unirse al tablero ni responder decisiones ajenas. En su listado de partidas iniciadas dispone de **Ver sala** y **Eliminar partida**.

Una cuenta puede controlar varios superhéroes: mientras haya plazas, incluso después de inscribirse, el selector de la sala permite **Añadir otro héroe** con su propio mazo. Se pueden combinar varias cuentas y varios héroes por cuenta; el límite se aplica al total de superhéroes, y no se puede repetir héroe. Si una cuenta lleva varios, sus nombres aparecen como **Nombre (1)**, **Nombre (2)**, etc. Cada uno conserva su mano, tablero, turnos y decisiones independientes. Abandonar la sala como invitado retira todos los héroes de esa cuenta.

La sala muestra escenario, dificultad, conjuntos modulares y jugadores inscritos con su superhéroe, aspecto y nombre del mazo seleccionado en la misma línea. El creador puede iniciar la partida aunque queden plazas libres o eliminar la sala mientras espera. Los demás usuarios pueden elegir superhéroe y mazo para apuntarse, o abandonar la sala antes de que comience. El precon está seleccionado por defecto; **Cambiar mazo** abre la lista completa de mazos legales del héroe, con filas coloreadas por aspecto y filtros por nombre y aspecto; cada mazo muestra nombre, aspecto, número de cartas y creador. Desde esa lista se puede crear un mazo para el héroe elegido; al guardarlo se vuelve a la sala con el nuevo mazo seleccionado si es legal para jugar. La vista **Partidas** permite consultar las salas abiertas en una tabla compacta con su nombre, escenario, dificultad y plazas ocupadas; **Ver partida** abre el detalle de la sala.

Durante la creación se puede activar **Modo Experto**. Al hacerlo, la partida usa las etapas expertas del villano y añade el conjunto Experto al mazo de encuentros, manteniendo también el conjunto Normal.

**Resultado:**
- El creador y cada jugador se identifican mediante su cuenta, no mediante un nombre de jugador elegido manualmente.
- El nombre del perfil es solo visual y puede repetirse; los tableros, turnos y solicitudes de acción usan un identificador estable por superhéroe, asociado a la cuenta que lo controla.
- Las salas limitan las inscripciones al máximo de superhéroes indicado y no permiten repetir superhéroe.
- La partida puede comenzar antes de alcanzar ese máximo; al iniciarse, todos los inscritos se conectan a la misma sesión de juego.
- Las partidas inicializadas recuperan el tablero completo.
- El lobby muestra el superhéroe, el aspecto o los aspectos y el nombre del mazo elegido para cada jugador.
- Si el setup de una partida continúa en el backend, se vuelven a mostrar los diálogos pendientes.
- Las partidas se conservan en MongoDB y pueden reanudarse tras reiniciar el backend.
- Al reiniciarlas se conserva su identificador y la configuración original de jugadores, escenario, conjuntos modulares y dificultad.

## Configuración de Partida

### Seleccionar Superhéroe

**¿Qué permite?**
Elegir cuál superhéroe controlará durante la partida.

La lista de superhéroes aparece en orden alfabético; Black Panther se muestra como Pantera Negra.

**Información Mostrada:**
- Nombre del Superhéroe
- Puntos de vida
- Atributos y capacidades exclusivas de la identidad de Héroe (ATK, DEF, INT)
- Atributos y capacidades exclusivas de la identidad de Alter-Ego (REC)
- Cartas iniciales y preparación (Setup)
- Imagen ilustrativa de ambas identidades
- Capacidades especiales de cada identidad

**Disponibilidad:**
Los Superhéroes disponibles dependen de:
- Cartas instaladas en el sistema
- Configuración de la partida
- Selecciones de otros jugadores (sin duplicados)

Al añadir un superhéroe en el lobby se puede seleccionar uno de sus mazos guardados que cumpla las reglas. El mazo preconstruido del héroe aparece seleccionado por defecto.

### Editar Mazos

La página principal de **Mazos** muestra todos los mazos creados con su nombre, superhéroe, aspecto o aspectos, creador y número total de cartas; cada fila usa el color de su aspecto y, si el mazo es multiaspecto, un degradado con los colores de los aspectos seleccionados. Las columnas de nombre, héroe, aspecto, creador y cartas permiten ordenar el listado. El campo de búsqueda filtra por nombre, y los selectores permiten filtrar por héroe, aspecto y creador; con sesión, también se puede mostrar todos los mazos, solo los propios o solo los favoritos. Se pueden marcar como favoritos los mazos de otros creadores; cada favorito se guarda para la cuenta autenticada. Sin iniciar sesión, el listado y el contenido de cada mazo se pueden consultar en modo de solo lectura; para clonar o gestionar mazos se ofrece un enlace directo al inicio de sesión. Con sesión iniciada, solo el creador puede editar o eliminar su mazo; los demás usuarios pueden consultarlo, marcarlo como favorito o clonarlo. **Clonar** está disponible en el detalle para cualquier usuario con sesión, incluido el creador: crea una copia con el nombre **Clon de [nombre del mazo]**, el mismo héroe, aspecto y cartas, asignada al usuario que la clona, y abre esa copia para editarla. Solo los administradores ven **Guardar copia en el catálogo** y **Restaurar del repositorio**; el servicio también rechaza esas operaciones con HTTP 403 para cualquier cuenta que no sea administradora. El detalle del mazo muestra también quién lo creó. **Crear mazo** muestra una cuadrícula alfabética con la carta de héroe y su nombre debajo; al seleccionar uno se inicia un mazo editable vacío, sin aspecto preseleccionado.

Cada vista tiene su propia ruta: `/decks` muestra el listado, `/decks/create` permite elegir héroe, `/decks/edit` abre el editor de un mazo nuevo y `/decks/edit/:id` permite consultar o editar un mazo guardado según la sesión y su creador. Al guardar por primera vez o clonar, la ruta del editor se actualiza para incluir el identificador asignado al mazo. El servicio permite lecturas públicas, requiere una sesión válida para crear, clonar y marcar favoritos; solo el creador puede modificar o eliminar su mazo. La restauración del repositorio tampoco sobrescribe ni elimina mazos de otros creadores. Los mazos nuevos importados quedan atribuidos a la cuenta que solicita la restauración; no hay una cuenta predeterminada.

Los filtros y el orden del listado se conservan en la URL mediante `name`, `hero`, `aspect`, `creator`, `scope`, `sort` y `direction`; los valores predeterminados se omiten. El botón **Limpiar filtros** restablece los filtros y sus parámetros de URL sin cambiar el orden seleccionado. Por ejemplo, `/decks?hero=spider-man&aspect=justice&sort=size&direction=desc` enlaza a los mazos de ese héroe y aspecto ordenados por tamaño descendente.

En el editor se utiliza todo el ancho disponible y los listados crecen según su contenido, sin scroll interno. Los botones **Guardar** y **Cerrar** aparecen juntos en la cabecera del editor y se repiten como **Guardar** y **Cancelar** entre los paneles del mazo actual y las cartas disponibles, junto al recuento del mazo actual. El panel intermedio muestra la composición, en este orden: cartas de héroe, básicas, de cada aspecto seleccionado y permanentes; omite los grupos sin cartas y cuenta las permanentes por separado de su origen. En pantallas amplias, el mazo actual organiza Recursos y Mejoras en la primera columna, Aliados y Apoyos en la segunda y Eventos en la tercera; las columnas se apilan sin huecos verticales entre grupos de distinta altura. En pantallas más estrechas se adaptan a dos o una columna. Cada tipo muestra su cantidad de cartas e indica si cada carta es fija del héroe, básica o de un aspecto cuyo nombre se muestra sin prefijo; las cartas fijas no se pueden modificar. Al pulsar una fila editable se solicita confirmación para quitar la carta. Pulsar una imagen abre una vista ampliada. Debajo, una tabla de cartas disponibles permite buscar, filtrar por tipo, aspecto y rasgo, y elegir cuántas copias añadir; si aún no se ha elegido aspecto muestra cartas de todos los aspectos y básicas. Al añadir la primera carta de aspecto, este queda seleccionado automáticamente y se ocultan los demás aspectos. Para héroes con más de un aspecto, el filtro ofrece cada aspecto seleccionado por separado. Sus cabeceras de Carta, Tipo, Aspecto, Rasgos, Coste y Copias ordenan el listado. El coste aparece en su propia columna. Ambos listados muestran los recursos de cada carta y el mazo actual conserva el coste junto a cada carta. Las cantidades respetan el límite general de 3 copias por título, las restricciones de máximo indicadas en cada carta, la unicidad y el máximo de 50 cartas.

En el listado de mazos, **Guardar copia en el catálogo** sincroniza MongoDB con el fichero físico `packages/back/mc-data/seed/catalog/decks.json`, sin necesidad de hacer un commit. **Restaurar del repositorio** combina ese snapshot con los datos locales: para cada ID conserva el evento más reciente, comparando `updatedAt` para mazos y `deletedAt` para borrados explícitos. No elimina mazos que solo existan localmente; los cambios y borrados del snapshot solo se aplican a mazos cuyo creador es el usuario autenticado, para preservar la propiedad. Los mazos nuevos importados se asignan a la cuenta que ejecuta la restauración.

Al crear o editar un mazo asociado a un superhéroe, se aplican estas reglas:

- Cada mazo usa el número de aspectos definido por su héroe y puede incluir cartas básicas. Si el héroe exige equilibrar sus aspectos, el validador comprueba que el mazo contenga la misma cantidad de cartas de cada uno.
- Las cartas específicas del superhéroe son fijas: el editor las incluye al calcular el tamaño, pero no las guarda ni permite modificarlas.
- El mazo persistido contiene únicamente el identificador de cada carta editable y su número de copias.
- El editor aplica el tamaño permitido de 40 a 50 cartas, el máximo de tres copias por título no único y las restricciones de unicidad.
- Se pueden guardar borradores incompletos. Solo los mazos legales aparecen como opciones al crear una partida.

### Seleccionar Escenario

**¿Qué permite?**
Elegir el villano y escenario contra el que jugarán.

**Información del Escenario:**
- Nombre del villano
- Nivel de dificultad
- Capacidades del villano
- Cartas de encuentro
- Modificadores especiales

**Dificultades:**
- **Fácil** - Menos amenaza, menos esbirros (minions)
- **Normal** - Valores balanceados
- **Difícil** - Más amenaza, más esbirros (minions), enemigos más fuertes
- **Experto** - Máxima dificultad, cambios de reglas

### Elegir Conjuntos Modulares

Al crear una partida, las listas de conjuntos modulares muestran a la izquierda los disponibles en orden alfabético y a la derecha los seleccionados para la partida. Los conjuntos modulares configurados por el escenario aparecen seleccionados por defecto. Se pueden añadir o quitar conjuntos antes de crear la partida; los conjuntos estándar del escenario se conservan automáticamente.

## Jugabilidad

### Pantalla Principal del Juego

La pantalla se divide en varias áreas:

**Tablero Central (Board)**
- Muestra villano y esbirros (minions)
- Contador de amenaza del villano
- Contador de vida del villano
- Efectos activos en juego

**Zona del Jugador (Player Area)**
- Superhéroe con contador de vida
- Spiderwoman muestra sobre su carta una bolita por cada aspecto distinto jugado durante la ronda; las bolitas desaparecen al terminarla
- Cartas en juego (aliados, mejoramientos)
- Contador de recursos (4 tipos: Energy, Mental, Physical, Wild)
- Estado y efectos activos

**Mano (Hand)**
- Cartas disponibles para jugar (sin límite de cartas jugables por turno)
- Costo de cada carta
- Requisitos para jugar
- Se puede abrir y cerrar también mientras se espera a otro jugador; solo las cartas quedan deshabilitadas. Al abrirla, el panel cubre los controles del tablero que quedan detrás.

**Panel de Estado (Status Panel)**
- Turno actual
- La barra superior sitúa las acciones de partida a la izquierda y la cuenta a la derecha, cerca de los extremos. En el centro muestra un texto destacado con el estado actual: turno propio, turno de otro jugador, fase del villano, decisiones pendientes, peticiones de acción, espera del mulligan, conexión o final de partida. En pantallas estrechas el estado ocupa una segunda fila.
- La zona de juego y las filas del listado no se resaltan por el turno ni muestran etiquetas de turno. El turno actual se indica únicamente en el estado central de la barra superior. Pedir una acción no cambia el jugador en turno.
- Fase actual
- Información de todos los jugadores
- Contador de aceleración

El listado **Jugadores** permite cambiar entre los héroes que controla tu cuenta. Solo se muestra el tablero y la mano del héroe propio seleccionado, tanto durante su turno como durante el de otro héroe o la fase del villano. Cambiar de vista no cambia el turno ni concede acciones fuera de las permitidas. Las decisiones dirigidas a cualquiera de tus héroes siguen llegando a tu cuenta; durante la preparación, sus mulligans se presentan uno a uno. Con un único jugador y superhéroe no aparece el listado.

Al comenzar cada fase de jugadores, si controlas varios héroes se muestra automáticamente el jugador inicial si pertenece a tu cuenta; en otro caso, el primer héroe propio superviviente en el orden desde el jugador inicial. Esta selección se realiza una sola vez al entrar en la fase: después puedes cambiar de vista manualmente sin que las actualizaciones normales la reemplacen. Cuando termina el turno del héroe propio seleccionado, la vista pasa al siguiente héroe de tu cuenta que aún tenga su turno pendiente, siguiendo ese mismo orden y omitiendo héroes derrotados. Esto también funciona si entre ambos debe jugar otra cuenta: solo cambia el tablero visible, no el turno real. Si todos tus héroes han terminado, se conserva la última vista.

**Pilas de descartes**
- Haz clic en una pila para consultar sus cartas, desde la carta superior hacia abajo.
- Si tu descarte contiene cartas que puedes jugar desde ahí, la pila aparece resaltada y las cartas jugables también se resaltan en el diálogo.
- Al descartar varias cartas desde la parte superior de un mazo, se muestran antes de continuar con la resolución del efecto.
- En el diálogo para elegir el orden, puedes marcar que no vuelva a preguntarse; la preferencia se guarda en esa partida y se mantiene al reanudarla. Cada partida nueva empieza con esta opción desactivada.

Durante la partida se oculta la navegación principal y aparece **Salir de la partida**. Solo el creador dispone de **Reiniciar partida**, tanto en el tablero como en el listado; el servidor también comprueba su sesión y rechaza el reinicio por otros jugadores. Reiniciar pide confirmación y vuelve a iniciar la partida con la misma configuración; salir vuelve a la lista sin eliminarla.

En el listado, el creador puede pulsar **Eliminar partida** tanto en una sala en espera como en una partida iniciada. Se solicita confirmación porque el borrado es definitivo; los invitados no disponen de este botón y el servidor también impide que eliminen partidas ajenas. Los escenarios se muestran por su nombre del catálogo, como **Rino**, sin cambiar sus identificadores internos.

### Ejecutar Acciones

Al hacer clic en el Superhéroe se muestran sus acciones; las que no tengan un objetivo válido o hayan superado su límite aparecen deshabilitadas. Durante tu turno, haz doble clic en el Superhéroe para activar **Finalizar turno**; se mantiene la confirmación habitual cuando corresponde.

Al activar cualquier capacidad que requiere elegir un jugador, si hay varios jugadores elegibles se muestra un diálogo dirigido a quien la activa con la carta de superhéroe de cada uno, en su identidad actual. Esto incluye la Mansión de los Vengadores, Comandante y la asignación de cartas a otros jugadores. Al pulsar una carta se selecciona a ese jugador; si solo hay uno elegible, se selecciona automáticamente.

La respuesta de **Maria Hill** al entrar en juego no elige un jugador: si su controlador la activa, cada jugador roba una carta de su propio mazo, sin diálogo de selección de objetivo.

Cuando una capacidad afecta a **todos** los objetivos de un grupo, se aplica a todos los que cumplan sus restricciones, sin pedir que elijas uno. Si afecta a **uno cualquiera**, solo se ofrecen los objetivos elegibles y se elige uno, automáticamente si solo queda una opción. Esto se aplica también a aliados, personajes, enemigos, planes, apoyos y mazos; una cantidad de objetivos indicada expresamente mantiene su selección correspondiente.

Al agotar **Helitransporte**, elige al jugador beneficiario con ese mismo diálogo. La reducción de coste de 1 se aplica a la siguiente carta que juegue ese jugador durante la fase; las cartas de los demás no la aplican ni la consumen. Si no se usa, expira al terminar la fase.

Al seleccionar una capacidad que permite mirar un mazo sin especificar uno concreto, el tablero queda cubierto por un velo y cada mazo disponible muestra un icono de ojo destacado. Pulsa uno de esos ojos para elegir el mazo y resolver la capacidad; al pulsar en cualquier otro lugar se cancela sin resolverla.

Al hacer clic en un enemigo se puede iniciar un ataque básico con el superhéroe; al hacer clic en un plan, una intervención básica. Si no hay otras acciones disponibles, aparece una confirmación cuyo título pregunta por el ataque o la intervención; muestra las cartas del superhéroe y del objetivo, sin etiquetas ni subtítulo. Se puede marcar **No volver a mostrar este diálogo durante esta partida**. Si el enemigo o plan tiene otras acciones disponibles, aparece un menú y la activación básica figura primero. Un enemigo o plan que no sea un objetivo legal para esa activación no ofrece la opción ni responde al clic de activación.

También puedes arrastrar tu superhéroe, un aliado, una mejora o un apoyo con una acción disponible hasta un objetivo válido en juego. Mientras arrastras, los objetivos legales se marcan con un halo verde difuminado. Las imágenes de las demás cartas, incluidas las de la mano, los mazos y los descartes, aparecen cubiertas por un velo sin oscurecer el resto del panel; el personaje arrastrado permanece visible. Al soltar un personaje se propone un ataque o intervención básicos; al soltar una mejora o apoyo se resuelve su acción sobre el objetivo elegido.

Las capacidades de mejoras o apoyos que pagan recursos también aceptan arrastrar una carta de recurso de la mano o un generador de recursos válido hasta la carta de la capacidad. El pago se valida y se resuelve directamente, sin abrir el diálogo de pago.

#### Jugar una Carta

**Requiere:**
- Carta en la mano
- Suficientes recursos (para cartas de costo)
- Cumplir condiciones especiales (si aplica)

También puedes arrastrar una carta jugable de la mano. Los apoyos, aliados y mejoras sin vínculo especial resaltan tu zona de juego; las mejoras vinculadas y los eventos resaltan sus objetivos válidos, mientras las demás cartas quedan atenuadas. Si un evento no tiene objetivos de carta disponibles, puedes soltarlo en tu zona de juego. Las cartas que permiten elegir a qué jugador asignarse resaltan tu zona si eres elegible y las filas de jugadores válidos: al soltarlas en una de esas zonas, se asignan al jugador correspondiente. Al hacer clic en una carta de este tipo, se abre un diálogo para elegir entre los superhéroes elegibles; al arrastrarla sobre una zona válida, el destino queda seleccionado directamente. Los diálogos necesarios para pagar o resolver la carta se mantienen en ambos flujos.

**Pasos:**
1. Hacer clic en la carta o arrastrarla hasta la zona de juego o un objetivo resaltado
2. Seleccionar destino (si aplica)
3. Confirmar acción
4. Efecto se resuelve automáticamente

**Resultado:**
- Carta se mueve a zona de juego
- Se gastan recursos
- Se desencadenan triggers
- Efectos se aplican
- Si la jugada se cancela por falta de un objetivo válido o por no poder pagar un coste, la carta vuelve a la mano

#### Atacar a un Enemigo

**Requiere:**
- Elegir qué enemigo atacar (si hay múltiples)
- No cuesta recursos (usa el atributo de ataque del Superhéroe)
- El personaje que ataca debe agotarse

**Cómo:**
1. Seleccionar personaje atacante
2. Presionar "Atacar"
3. El personaje se agota (costo de la acción)
4. Seleccionar enemigo objetivo
5. Sistema calcula daño usando el atributo de ataque
6. Daño se aplica automáticamente

**Efectos Especiales:**
- **Overkill** - Si el objetivo es derrotado, el daño extra se inflige al Superhéroe o Villano
- **Piercing** - Descarta Tough status card ANTES de infligir daño
- **Unstoppable** - No puede reducirse

#### Defender

El diálogo permite elegir un defensor propio o **Pedir a otro héroe que defienda**. A la derecha aparece una lista con miniaturas pequeñas, como el listado de jugadores, de los otros superhéroes que dispongan de algún personaje que pueda defender ese ataque, también si los controla tu misma cuenta. Al pulsar uno, su controlador recibe el diálogo con sus personajes: si elige defensor, ese personaje y su jugador pasan a recibir el ataque; si rechaza, vuelve la elección al objetivo original. No se puede sustituir un defensor ya establecido por otro jugador.

La defensa básica agota el personaje: un héroe resta su DEF y un aliado recibe el daño sin restar DEF. En alter ego solo se puede defender con aliados preparados. El daño por Brutalidad de un aliado va al superhéroe de su controlador; si una capacidad de aumento retira al aliado antes del daño, el ataque queda sin defender contra ese mismo jugador.

**Requiere:**
- Un ataque entrante
- No cuesta recursos (usa el atributo de defensa del Superhéroe)
- El personaje que defiende debe agotarse

**Cómo:**
1. Cuando enemigo ataca, se muestra opción "Defender"
2. Seleccionar personaje para defender
3. El personaje se agota (costo de la acción)
4. Sistema suma defensa usando el atributo de defensa
5. Daño se reduce por cantidad defendida

#### Intervención (INT)

**Requiere:**
- Un plan con amenaza
- No cuesta recursos (usa el atributo de intervención del Superhéroe)
- El personaje que interviene debe agotarse

**Cómo:**
1. Seleccionar personaje
2. Presionar "Contraarrestar"
3. El personaje se agota (costo de la acción)
4. Se reduce amenaza usando el atributo de intervención

**Diferencia con Defensa:**
- Afecta la amenaza del villano, no el daño
- Puede ser ejecutado por otros jugadores
- Efectos especiales diferentes

### Gestión de Recursos

**¿Cómo Se Generan?**
- Descartando cartas de la mano (generando los recursos impresos en las cartas descartadas)
- Usando capacidades de recurso
- La esquina inferior izquierda de cada carta muestra qué recursos genera al descartarse
- Ejemplo: Una carta descartada genera 1 Mental + 1 Wild

**Los 4 Tipos de Recursos:**
- **Energy**: Recurso específico para ciertos costos
- **Mental**: Recurso específico para ciertos costos
- **Physical**: Recurso específico para ciertos costos
- **Wild**: Comodín que puede contar como cualquier tipo

**¿Para Qué Se Usan?**
- **SOLO para jugar cartas** (eventos, aliados, mejoramientos, apoyos)
- **NO cuestan recursos**: Atacar (ATK), Defender (DEF), Intervenir (INT)
- Estos últimos usan los atributos del Superhéroe (ataque, defensa, intervención) y requieren agotar al personaje

**Reglas Clave:**
- Los recursos se usan INMEDIATAMENTE
- El exceso se PIERDE (no se acumula)
- El tamaño de mano es tu limitante
- Puedes generar infinitos recursos mientras tengas cartas en mano

**Visualización:**
- Iconos claramente diferenciados
- Mostrados en la zona del jugador
- Contador en tiempo real
- Al pagar, los recursos universales se asignan automáticamente a los requisitos específicos pendientes y, después, a los tipos de recurso que activan bonificaciones de la carta (como Arremetida o Golpe contundente). Si una bonificación exige pagar todo con un único tipo de recurso, los universales restantes se asignan a ese tipo; puedes cambiar la asignación haciendo clic en el icono, incluso cuando el pago permite elegir unidades concretas.

## Sistema de Turno

### Estructura Automática

El sistema gestiona automáticamente:
- Distribución de recursos
- Límites de acciones
- Transición entre fases
- Resolución de triggers

Al finalizar el turno, se pide confirmación si el superhéroe o algún aliado está preparado, o si hay cartas jugables en la mano. El diálogo indica cuál es el motivo; las cartas que no se pueden jugar no activan el aviso. «Sí, finalizar el turno» avanza la partida; «No, seguir jugando» mantiene el turno.

### Fases del Turno

**Fase de Preparación**
- Mensaje: "Tu turno comienza"
- Recursos se regeneran automáticamente
- Cartas se resetean

**Fase de Planificación**
- Puedes jugar cartas (sin límite máximo de cartas por turno)
- Puedes ejecutar activaciones
- Continúa hasta presionar "Fin de Turno"

Al terminar todos los turnos, el cierre de fase incluye a todos los jugadores en orden de jugador inicial, no solo al último que actuó. Los jugadores con cartas reciben su diálogo de descarte; una mano vacía no necesita ese diálogo. Cada jugador repone hasta su tamaño de mano actual y prepara sus cartas antes de continuar con el villano.

**Fase de Activación (Enemigos)**
- Primero se coloca la amenaza del Plan principal, incluidos los iconos y fichas de aceleración.
- Desde el jugador inicial, el villano se activa contra cada jugador: ataca si está en Héroe y ejecuta el Plan si está en Alter ego. Después se activan los esbirros de ese jugador, antes de pasar al siguiente jugador.
- Todos ven el aviso de activación, pero solo el jugador contra el que se activa el enemigo puede interactuar y cerrarlo. Los demás lo ven sin botones y se cierra para todos al confirmar el jugador afectado, también si la activación se omite por Aturdimiento o Confusión.
- Si hay varios esbirros, el jugador enfrentado elige su orden en un diálogo privado. Los esbirros que se enfrenten durante este grupo de activaciones también se activan.
- El sistema muestra los aumentos, sus iconos y capacidades. Las defensas y las capacidades de interrupción o respuesta conservan sus ventanas de elección.
- Se reparte una carta de encuentro a cada jugador. Cada icono de riesgo añade una sola carta adicional en total, repartida en orden desde el jugador inicial, también si las zonas del escenario están separadas.
- El diálogo de encuentros repartidos muestra el nombre de cada jugador, debajo un único dorso de Encuentros y el número de cartas recibidas. Las identidades de las cartas permanecen ocultas y se conservan los avisos de cartas adicionales por riesgo.
- Cada jugador revela sus encuentros en orden de reparto. Las cartas adicionales recibidas durante este paso también se resuelven antes de terminarlo.
- Al mostrar una carta de Encuentros, todos ven el diálogo con el nombre del jugador que la muestra. Solo ese jugador puede interactuar o cerrarlo; los demás no ven botones. Al cerrarlo, desaparece para todos.
- Los jugadores eliminados no reciben activaciones ni encuentros. Sus esbirros pasan al siguiente superviviente de su zona, conservando su estado; una zona separada sin supervivientes sigue las reglas de reunión del escenario.
- El marcador inicial pasa al siguiente superviviente una sola vez al final de la fase; comenzar o reanudar la siguiente ronda no vuelve a moverlo.
- Los efectos de final de fase se resuelven al terminar la fase completa, no al acabar un grupo de esbirros o un paso numerado. Si la partida termina, no se continúa con las activaciones, encuentros ni pasos restantes.

**Fase de Resolución**
- Efectos pendientes se resuelven
- Daño y amenaza se aplican
- Condición de victoria/derrota se verifica

## Información Disponible

### Ver Estado de Enemigos

En cualquier momento puedes:
- Hacer clic en un enemigo
- Ver sus puntos de vida
- Ver sus capacidades
- Ver sus efectos activos

### Ver Estado de Aliados

Puedes ver:
- Cartas que has jugado
- Puntos de vida de aliados
- Mejoramientos adjuntos
- Efectos activos

### Ver Historial de Juego

Se muestra un registro de:
- Últimas acciones ejecutadas
- Daño infligido/recibido
- Cartas jugadas
- Cambios importantes

## Finalización

### Victoria

**Condiciones:**
- Villano derrotado (0 HP)
- Se cumplen objetivos especiales

**Pantalla de Victoria:**
- Mensaje de felicitación
- Estadísticas del juego
- Opción de jugar de nuevo

### Derrota

**Condiciones:**
- Cualquier jugador derrotado
- Amenaza alcanza máximo

**Pantalla de Derrota:**
- Causa de la derrota
- Análisis de qué salió mal
- Opción de reintentrar
- Opción de otra partida

## Características Avanzadas

### Ver Cartas Jugadas

Puedes visualizar:
- Todas las cartas en zona de juego
- Cartas en descarte
- Cartas en baraja de encuentro
- Estadísticas de cada carta

### Modo Multiplayer

**Comunicación:**
- Ver el tablero del villano y el estado sincronizado de las mesas de jugadores en tiempo real
- Consultar las mesas de otros jugadores en modo de solo lectura y volver a la propia con **Ver mi mesa**
- La mesa propia permanece visible aunque se pidan acciones a otro jugador. Sus descartes solo se consultan en su mesa, sin duplicarse en la esquina del tablero.
- El listado de jugadores queda junto a la zona propia, alineado por abajo con el mazo y el superhéroe.
- Al pulsar una vez la fila de otro superhéroe de tu cuenta, se muestra directamente su mesa y su mano; no hace falta abrir primero el acordeón ni cambia el turno activo.
- Ver quién tiene la ficha de jugador inicial
- Información de sus manos oculta
- Contador de cartas en mano
- Estado de sus recursos

**Coordinación:**
- Los turnos alternan entre los jugadores inscritos y se indica quién tiene el jugador inicial.
- Durante su turno, un jugador puede pedir a otro que realice una acción; el destinatario puede aceptar o rechazar.
- Mientras una solicitud está pendiente se muestra a quién se espera. Si se acepta, el jugador solicitado puede activar capacidades de **Acción** (también eventos de Acción, respetando su identidad, costes y condiciones) y avisa cuando termina.
- Al aceptar, su panel de jugadores muestra únicamente **He terminado**, sin el texto explicativo de las restricciones.
- La solicitud no concede un turno completo: no permite cambiar voluntariamente de identidad, usar atributos básicos del superhéroe o de aliados, ni jugar normalmente aliados, apoyos, mejoras o planes secundarios. Estas opciones se deshabilitan y el servidor rechaza los intentos de usarlas.
- Los cambios de identidad y la puesta en juego de cartas causados por una capacidad legal siguen permitidos; un cambio de identidad por efecto no consume el cambio voluntario del turno.
- Si una ventana de respuesta del motor está dirigida a otro jugador, se indica que se está esperando su respuesta.
- El servidor valida la identidad de la cuenta en las operaciones REST y Socket.IO; la interfaz también oculta acciones no disponibles para el jugador local.

### Efectos Visuales

El sistema muestra visualmente:
- Animaciones de ataques
- Aplicación de daño
- Cambios de estado
- Efectos especiales
- Triggers activándose

## Accesibilidad

### Información Clara

- Iconos estandarizados
- Explicaciones al pasar mouse
- Tooltips con reglas
- Panel de ayuda

### Controles Intuitivos

- Drag & drop para cartas
- Botones claramente marcados
- Atajos de teclado (si aplicable)
- Navegación consistente

### Modo Ayuda

- Tutorial al primer juego
- Explicaciones de reglas
- Guía de atajos
- Glossario de términos
