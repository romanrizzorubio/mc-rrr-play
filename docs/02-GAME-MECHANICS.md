# Mecánicas de Juego

## Conceptos Fundamentales

### Partida (Match)
Una **partida** es una sesión de juego completa entre uno o más jugadores enfrentándose a un villano en un escenario específico.

**Componentes de una partida:**
- Jugadores (1 o más)
- Villano (enemigo principal)
- Escenario (modificadores y reglas adicionales)
- Zona de juego compartida
- Recursos y contadores de aceleración

### Jugador (Player)
Cada jugador controla:
- Un **Superhéroe** específico
- Una **Baraja** de cartas personal
- Una **Mano** de cartas
- **Recursos** (física, mental)
- **Daño y amenaza acumulados**

### Superhéroe
Cada superhéroe tiene:
- Puntos de vida (HP)
- Recursos disponibles
- Cartas de preparación inicial
- Forma alterada (si aplica)
- Habilidades únicas

### Cartas

#### Tipos de Cartas
1. **Personajes (Heroes)**
   - El superhéroe controlado por el jugador
   - Puede cambiar entre formas (alterada/héroe)
   - Gana recursos cada turno

2. **Eventos**
   - Acciones de un solo uso
   - Se juegan desde la mano
   - Efectos inmediatos

3. **Aliados**
   - Personajes aliados en la zona de juego
   - Permanecen hasta ser derrotados
   - Generan recursos o efectos

4. **Mejoramientos**
   - Se adjuntan a personajes
   - Proporcionan bonificaciones permanentes
   - Persisten durante la partida

### Zona de Juego (Play Area)
La zona de juego contiene:
- **Zona del Jugador**: cartas controladas por cada jugador
- **Zona del Escenario**: amenazas y cartas del villano
- **Zona de Encuentro**: enemigos activos (minions, villano)

## Sistema de Recursos

### Recursos Básicos
Los jugadores generan dos tipos de recursos cada turno:

1. **Física** (Physical)
   - Usada para atacar
   - Se gasta en activaciones de ataque
   - Máximo de 1 por superhéroe (por defecto)

2. **Mental** (Mental)
   - Usada para defensas y efectos
   - Se gasta en activaciones de defensa
   - Máximo de 1 por superhéroe (por defecto)

### Límites de Recursos
- Los recursos no se acumulan entre turnos
- Cada turno comienza con nuevos recursos
- Las cartas pueden aumentar la generación de recursos

## Sistema de Daño y Amenaza

### Daño
- Los personajes tienen un contador de **daño**
- Cuando el daño iguala o supera la salud (**HP**), el personaje es derrotado
- Cuando un superhéroe es derrotado, el jugador pierde

### Amenaza
- Los villanos y minions acumulan **amenaza**
- La amenaza representa el progreso del villano
- Si la amenaza alcanza el límite de escape, el villano gana

### Aceleración
- Mecanismo especial para acelerar la derrota del villano
- Se activa con ciertos efectos
- Aumenta la amenaza del villano

## Fases del Turno

### Player Phase (Fase del Jugador)

#### 1. Phase de Preparación (Setup)
- Cada jugador gana sus recursos asignados (1 Física + 1 Mental por defecto)
- Las cartas se resetean (**exhausted cards become ready**)
- Los jugadores pueden ahora ejecutar acciones

#### 2. Fase de Planificación (Player Actions)
Cada jugador (en orden de turnos) puede:
- Jugar cartas desde su mano (pagan costo)
- Ejecutar acciones de cartas en juego
- Atacar enemigos (gasta Física)
- Defenderse contra ataques (gasta Mental)
- Contraarrestar amenaza (gasta Mental)
- El jugador continúa hasta que pase su turno

#### 3. Fin de Player Phase
- Se descartan cartas por encima del límite de mano
- Se roban cartas hasta alcanzar el tamaño de mano
- Todas las cartas exhausted se resetean

### Villain Phase (Fase del Villano)

#### 1. Paso de Amenaza (Threat Step)
- Se coloca amenaza igual a los **acceleration icons/tokens** en el esquema principal
- Los esquemas pueden tener efectos "when revealed"

#### 2. Paso de Activación (Activation Step)
- **Villano ataca**: El villano ataca a CADA jugador (una vez por jugador)
  - Si el jugador está en forma Héroe → Ataque al héroe
  - Si el jugador está en forma Alter-Ego → Scheme (intenta generar amenaza)
  - El villano recibe un Boost Card antes de activarse
- **Minions atacan**: Cada minion engage con un jugador lo ataca
  - Mismo comportamiento que el villano
  - Solo minions "villainous" reciben Boost Card

#### 3. Paso de Esquema (Scheme Step)
- Esquemas secundarios pueden generar amenaza
- Se resuelven efectos especiales de esquemas

## Sistema de Triggers

### ¿Qué es un Trigger?
Un **trigger** es una condición que activa un efecto especial:

**Triggers Comunes:**
- `"When this card is played"` - Al jugar la carta
- `"Your hero gets an attack"` - Cuando tu héroe realiza un ataque
- `"Enemy gets an attack"` - Cuando un enemigo ataca
- `"This card is defeated"` - Cuando la carta es derrotada
- `"Attached card gets damage"` - Cuando un personaje adjunto recibe daño

### Resolución de Triggers
1. Se detecta que un trigger se activó
2. Se evalúan todas las cartas con ese trigger
3. Se ejecutan los efectos en orden
4. Se resuelven efectos secundarios

## Sistema de Activaciones

### Tipos de Activaciones

#### Attack (Ataque)
- Requiere recurso **física**
- Causa daño a un enemigo seleccionado
- El atacante debe exhaust (cansarse) para atacar
- Puede tener efectos adicionales
- **Nota**: Solo el atacante puede cambiar el objetivo durante la resolución

#### Defense (Defensa)
- Requiere recurso **mental**
- Solo UN jugador puede defender contra un ataque a la vez
- El defensor reduce el daño usando su valor DEF (Defense)
- El daño restante se aplica al defensor
- Un héroe o aliado debe exhaust para defender
- **Importante**: Otros aliados amigos NO pueden defender mientras alguien ya está defendiendo

#### Thwart (Contraarrestación)
- Requiere recurso **mental**
- REMUEVE amenaza de un esquema (igual al valor THW del personaje)
- Solo se puede usar si el esquema tiene al menos 1 amenaza
- El carácter debe exhaust para contraarrestar
- No es lo mismo que "reducir amenaza generada" - remueve amenaza existente

#### Scheme (Esquema)
- Acelera amenazas especiales
- Genera condiciones especiales
- Afecta la estrategia del juego
- Algunos esquemas son "forced" (obligatorios)

## Sistema de Límites y Máximos

### Límites
Restricciones de cuántas veces se puede jugar algo:
- Por turno
- Por partida
- Durante el juego

### Máximos
Cantidad máxima permitida:
- De recursos generados
- De cartas en juego
- De efectos activos

## Condiciones de Victoria/Derrota

### Victoria
- El villano es derrotado (0 HP)
- Se cumplen objetivos especiales del escenario
- Se alcanza amenaza máxima con preparación

### Derrota
- Cualquier héroe jugador es derrotado
- La amenaza del villano alcanza el máximo
- Se cumplen condiciones de derrota especiales

## Ejemplo de Turno Completo

```
INICIO DE TURNO
├─ Fase de Preparación
│  ├─ Cada jugador gana 1 Física y 1 Mental
│  └─ Las cartas se resetean
│
├─ Fase de Planificación (Jugadores)
│  ├─ Jugador 1: Juega una carta de evento
│  ├─ Jugador 1: Activa ataque con Física (daña al villano)
│  ├─ Jugador 2: Juega un aliado
│  └─ Jugador 2: Activa defensa con Mental
│
├─ Fase de Activación (Enemigos)
│  ├─ Villano ataca (causa daño)
│  ├─ Minion ataca (causa daño)
│  └─ Se genera amenaza
│
└─ Fase de Resolución
   ├─ Se aplica el daño recibido
   ├─ Se actualizan contadores
   └─ FIN DE TURNO
```

## Efectos Especiales Comunes

### Attack Keywords (Palabras Clave de Ataque)

#### Piercing
- **INCORRECTO**: El ataque ignora defensas
- **CORRECTO**: Descarta todos los status cards "Tough" del carácter atacado ANTES de infligir daño
- Esto debilita la defensa pero no la ignora completamente
- Si el ataque no inflige daño, no descarta tough status

#### Overkill
- **INCORRECTO**: El daño extra se convierte en amenaza
- **CORRECTO**: Si un aliado es derrotado, el daño en exceso se inflige al HÉROE de ese jugador
- **CORRECTO**: Si un minion es derrotado, el daño en exceso se inflige al VILLANO
- El daño del overkill cuenta como daño de ataque pero NO constituye un ataque
- Si el daño en exceso es prevenido, no se inflige a héroe/villano

#### Quickstrike
- El enemigo ataca antes de que los jugadores puedan actuar
- Resuelto antes de la fase de planificación

#### Ranged
- El enemigo puede atacar a jugadores aunque no estén engaged
- Jugadores en forma Alter-Ego son especialmente vulnerables

#### Assault
- El enemigo realiza un ataque adicional

### Status Cards (Cartas de Estado)

#### Tough (Resistencia)
- Reduce el daño recibido en 1 punto
- Es descartado DESPUÉS de reducir el daño una vez
- Piercing descarta tough ANTES de infligir daño

#### Stunned (Aturdido)
- El carácter afectado NO puede atacar
- Es descartado al final de la fase después de no poder atacar

#### Confused (Confundido)
- El carácter afectado NO puede contraarrestar (thwart)
- Es descartado al final de la fase después de no poder contraarrestar

### Keyword Effects (Efectos de Palabras Clave)

- **Resilient** - Reduce el daño recibido (diferente a Tough)
- **Stalwart** - Comparte defensa con aliados amigos
- **Guard** - Solo este carácter puede ser atacado
- **Toughness** - Aumenta el valor de Tough status cards

## Mecánicas Avanzadas

### Alternativos de Héroe (Forms)

Algunos héroes pueden cambiar entre dos formas:

#### Forma Héroe
- Forma ofensiva orientada al combate
- Mejor para atacar y generar daño
- Genera recursos de Física adicionales
- Los enemigos ATACAN a esta forma (no pueden scheme)

#### Forma Alter-Ego
- Forma defensiva/civil
- Mejor para recuperación y defensa
- Genera recursos de Mental adicionales
- Los enemigos USAN SCHEME contra esta forma (en lugar de atacar)
- Más vulnerable pero con más opciones defensivas

#### Cambio de Forma
- El héroe puede cambiar usando acción o efecto de carta
- Generalmente exhaust cuando cambian
- Puede generar amenaza como efecto
- Los enemigos no pueden cambiar de forma

### Exhaust (Agotamiento)

**Concepto**: Una carta que ha sido "exhausted" está boca abajo o marcada y no puede actuar.

**Cuándo ocurre:**
- Un héroe/aliado ataca → se exhaust
- Un héroe/aliado defiende → se exhaust
- Un héroe/aliado contraaresta → se exhaust
- Activar ciertos efectos requiere exhaust

**Recuperación:**
- Al final de la Player Phase, todas las cartas exhausted se resetean
- Algunos efectos pueden permitir attackar/defender sin exhaust
- Algunos efectos pueden prevenir el exhaust

### Boost Cards (Cartas de Refuerzo)

**Concepto**: Cartas adicionales del mazo de encuentro que dan poder a los enemigos.

**Cuándo se otorgan:**
- El Villano recibe 1 Boost Card cuando ataca
- Minions "Villainous" reciben 1 Boost Card cuando atacan
- Minions normales NO reciben Boost Cards

**Efecto:**
- Se revela la Boost Card
- Se resuelven sus efectos (normalmente aumentan daño)
- Se descarta después de resolver

### Consequential Damage (Daño Consecuencial)

**Concepto**: Daño que recibe un aliado como castigo por atacar o contraarrestar.

**Cómo funciona:**
- Después que un aliado ataca/contraaresta, recibe daño igual a los iconos de daño consecuencial bajo su ATK/THW
- Este daño se aplica automáticamente
- Si el aliado está stunned/confused, NO recibe este daño (porque no puede actuar)
- Solo se aplica cuando el aliado EXITOSAMENTE ejecuta la acción

### Esquemas (Schemes)

#### Main Scheme (Esquema Principal)
- El esquema que define el objetivo del villano
- Se coloca en el área del villano
- Acumula amenaza cada turno
- Si la amenaza alcanza su límite, los jugadores pierden
- Tiene efectos especiales "When Revealed" y "When Defeated"

#### Side Schemes (Esquemas Secundarios)
- Esquemas que crean complicaciones adicionales
- Pueden ser del encuentro (del villano) o del jugador
- Cada jugador puede controlar máximo 2 side schemes
- Se derrotan cuando su amenaza llega a 0

### Minions (Secuaces)

**Concepto**: Enemigos menores controlados por el villano.

**Características:**
- Tienen sus propios puntos de vida y defensa
- Se "engage" (comprometen) con jugadores específicos
- Solo pueden atacar al jugador con el que están engaged
- Cuando se derrotan, se descartan
- Algunos minions tienen la palabra clave "Villainous"
