# Características Funcionales del Usuario

## Gestión de Partidas

### Partidas Creadas y Reanudación

**¿Qué permite?**
Ver las partidas que siguen en el backend, volver a una sala y retomar el estado guardado, o iniciar una partida nueva.

**Pasos:**
1. Abrir "Partidas".
2. Seleccionar una partida disponible.
3. Elegir el jugador que se va a controlar y presionar "Continuar partida".
4. Para borrar una partida, incluso si su setup sigue en curso, presionar "Eliminar partida" y confirmar.

Para empezar otra, presionar "Nueva partida", elegir nombre, jugador, superhéroe y escenario, y después "Crear partida".

Durante la creación se puede activar **Modo Experto**. Al hacerlo, la partida usa las etapas expertas del villano y añade el conjunto Experto al mazo de encuentros, manteniendo también el conjunto Normal.

**Resultado:**
- Las partidas inicializadas recuperan el tablero completo.
- El lobby muestra el superhéroe y el aspecto del mazo elegido para cada jugador.
- Si el setup de una partida continúa en el backend, se vuelven a mostrar los diálogos pendientes.
- Las partidas se conservan en MongoDB y pueden reanudarse tras reiniciar el backend.
- Al eliminarlas desde el lobby, dejan de estar disponibles y se borran de MongoDB.

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

Al crear una partida, junto al superhéroe se puede seleccionar uno de sus mazos guardados que cumpla las reglas. El mazo preconstruido del héroe aparece seleccionado por defecto.

### Editar Mazos

La página principal de **Mazos** muestra todos los mazos creados con su nombre, superhéroe, aspecto y número total de cartas; cada fila usa el color de su aspecto. Las columnas de nombre, héroe, aspecto y cartas permiten ordenar el listado. También permite filtrar por nombre, héroe o aspecto; al seleccionar una fila se edita el mazo y el botón **Eliminar** de la fila lo borra. **Crear mazo** muestra una cuadrícula alfabética con la carta de héroe y su nombre debajo; al seleccionar uno se inicia un mazo editable vacío, sin aspecto preseleccionado.

Cada vista tiene su propia ruta: `/decks` muestra el listado, `/decks/create` permite elegir héroe, `/decks/edit` abre el editor de un mazo nuevo y `/decks/edit/:id` edita un mazo guardado. Al guardar por primera vez, la ruta del editor se actualiza para incluir el identificador asignado al mazo.

En el editor se utiliza todo el ancho disponible y los listados crecen según su contenido, sin scroll interno. En pantallas amplias, el mazo actual organiza Recursos y Mejoras en la primera columna, Aliados y Apoyos en la segunda y Eventos en la tercera; las columnas se apilan sin huecos verticales entre grupos de distinta altura. En pantallas más estrechas se adaptan a dos o una columna. Cada tipo muestra su cantidad de cartas e indica si cada carta es fija del héroe, básica o de un aspecto cuyo nombre se muestra sin prefijo; las cartas fijas no se pueden modificar. Al pulsar una fila editable se solicita confirmación para quitar la carta. Pulsar una imagen abre una vista ampliada. Debajo, una tabla de cartas disponibles permite buscar, filtrar por tipo, aspecto y rasgo, y elegir cuántas copias añadir; si aún no se ha elegido aspecto muestra cartas de todos los aspectos y básicas. Al añadir la primera carta de aspecto, este queda seleccionado automáticamente y se ocultan los demás aspectos. Sus cabeceras de Carta, Tipo, Aspecto, Rasgos, Coste y Copias ordenan el listado. El coste aparece en su propia columna. Ambos listados muestran los recursos de cada carta y el mazo actual conserva el coste junto a cada carta. Las cantidades respetan el límite general de 3 copias por título, las restricciones de máximo indicadas en cada carta, la unicidad y el máximo de 50 cartas.

En el listado de mazos, **Guardar copia en el catálogo** sincroniza MongoDB con el fichero físico `packages/back/mc-data/seed/catalog/decks.json`, sin necesidad de hacer un commit. **Restaurar del repositorio** combina ese snapshot con los datos locales: para cada ID conserva el evento más reciente, comparando `updatedAt` para mazos y `deletedAt` para borrados explícitos. No elimina mazos que solo existan localmente; los borrados guardados en el snapshot sí se aplican y quedan registrados para que esos mazos no reaparezcan en futuras restauraciones.

Al crear o editar un mazo asociado a un superhéroe, se aplican estas reglas:

- Cada mazo usa un único aspecto y puede incluir cartas básicas.
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
- **Estándar** - Valores balanceados
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
- Cartas en juego (aliados, mejoramientos)
- Contador de recursos (4 tipos: Energy, Mental, Physical, Wild)
- Estado y efectos activos

**Mano (Hand)**
- Cartas disponibles para jugar (sin límite de cartas jugables por turno)
- Costo de cada carta
- Requisitos para jugar

**Panel de Estado (Status Panel)**
- Turno actual
- Fase actual
- Información de todos los jugadores
- Contador de aceleración

**Pilas de descartes**
- Haz clic en una pila para consultar sus cartas, desde la carta superior hacia abajo.
- Al descartar varias cartas desde la parte superior de un mazo, se muestran antes de continuar con la resolución del efecto.
- En el diálogo para elegir el orden, puedes marcar que no vuelva a preguntarse; la preferencia se guarda en esa partida y se mantiene al reanudarla. Cada partida nueva empieza con esta opción desactivada.

### Ejecutar Acciones

Al hacer clic en el Superhéroe se muestran sus acciones; las que no tengan un objetivo válido o hayan superado su límite aparecen deshabilitadas.

#### Jugar una Carta

**Requiere:**
- Carta en la mano
- Suficientes recursos (para cartas de costo)
- Cumplir condiciones especiales (si aplica)

**Pasos:**
1. Hacer clic en la carta
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
- Al pagar, los recursos universales se asignan automáticamente a los requisitos específicos pendientes; puedes cambiar la asignación haciendo clic en el icono.

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

**Fase de Activación (Enemigos)**
- No es interactiva
- Enemigos atacan o ejecutan el plan automáticamente
- Sistema muestra acciones, incluyendo la revelación de cartas de aumento, sus iconos y capacidades inmediatas
- Se muestra el estado de los esbirros enfrentados (enfrentado/engaged) con cada jugador

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
- Ver acciones de otros jugadores
- Información de sus manos oculta
- Contador de cartas en mano
- Estado de sus recursos

**Coordinación:**
- Turnos alternados entre jugadores
- Pueden sugerir acciones (si implementado)
- Estado sincronizado en tiempo real

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
