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
- Una **Mano** de cartas (limitada por tamaño de mano)
- **Sistema de Recursos** (4 tipos: Energy, Mental, Physical, Wild)
- **Daño** acumulado en su héroe
- **Obligaciones** (si las consigue)

### Superhéroe (Hero)
Cada superhéroe tiene:
- Puntos de vida (HP)
- Cartas de preparación inicial
- Dos Formas: Héroe y Alter-Ego (cada una con atributos diferentes)
  - **Forma Héroe**: Atributo de Ataque (ATK), Defensa (DEF), Intervención (INT)
  - **Forma Alter-Ego**: Atributo de Recuperación (REC) y otros atributos según el héroe
- Capacidades únicas por identidad

### Cartas

#### Tipos de Cartas
1. **Personajes (Heroes)**
   - El superhéroe controlado por el jugador
   - Puede cambiar entre formas (Héroe/Alter-Ego)
   - Genera recursos descartando cartas de su mano

2. **Eventos**
   - Acciones de un solo uso
   - Se juegan desde la mano (descartando cartas para generar los recursos impresos en las cartas descartadas)
   - Efectos inmediatos

3. **Aliados**
   - Personajes aliados en la zona de juego
   - Permanecen hasta ser derrotados
   - Generan recursos o efectos

4. **Mejoras**
   - Se adjuntan a personajes
   - Proporcionan bonificaciones permanentes
   - Persisten durante la partida

5. **Apoyos (Support)**
   - Se juegan en la zona de juego
   - Proporcionan efectos continuos o capacidades
   - Pueden ser activados por el jugador
   - Persisten hasta ser removidos o destruidos

### Zona de Juego (Play Area)
La zona de juego contiene:
- **Zona del Jugador**: cartas controladas por cada jugador, incluyendo Héroe/Alter-Ego, Aliados, Mejoras y Apoyos. Los Esbirros enemigos también se enfrentan aquí cuando están engaged con el jugador.
- **Zona del Escenario**: cartas centrales de amenaza y contratiempos del villano (Schemes, cartas de Aceleración, Boost Card)

## Sistema de Recursos

En Marvel Champions, los jugadores:
1. Generan recursos descartando cartas de su mano o usando capacidades de recurso
2. La esquina inferior izquierda de cada carta muestra los recursos que genera al descartarse
3. Los recursos se usan INMEDIATAMENTE para pagar costos
4. El exceso de recursos se PIERDE (no se acumula)

### Los CUATRO Tipos de Recursos

Marvel Champions tiene **4 tipos de recursos**:

#### 1. **Energy (Energía)** 
- Recurso específico
- Se genera descartando cartas
- Algunos costos requieren específicamente Energía

#### 2. **Mental**
- Recurso específico
- Se genera descartando cartas
- Algunos costos requieren específicamente Mental

#### 3. **Physical (Física)**
- Recurso específico
- Se genera descartando cartas
- Algunos costos requieren específicamente Física

#### 4. **Wild (Comodín)** ⭐
- **ESPECIAL**: Puede usarse como CUALQUIER tipo de recurso
- Cuando se genera, el jugador elige qué tipo es
- Máxima flexibilidad para pagar costos
- Si una carta genera 3 Wild, cada uno puede ser un tipo diferente

### Cómo Funcionan los Costos

**Hay dos tipos de costos:**

#### Costos Genéricos
- Ejemplo: "Cost: 3" o "Spend 3 resources"
- Aceptan CUALQUIER tipo de recurso
- Puedes mezclar: 1 Energía + 1 Mental + 1 Física

#### Costos Específicos
- Ejemplo: "Spend 2 [Physical]" o "Spend 1 [Mental] →"
- Requieren el tipo ESPECÍFICO indicado
- No puedes sustituir Energía por Física
- PERO el Wild puede contar como el tipo requerido

### Múltiples Costos en Una Carta

Algunas cartas tienen MÚLTIPLES costos:

**Ejemplo:**
- Costo para jugar: 2 recursos (genéricos)
- Costo de capacidad: 1 [Physical] específicamente
- Total: 2 genéricos + 1 Física

**Pago Simultáneo:**
- Todos los costos se pagan al mismo tiempo
- El jugador distribuye sus recursos entre los costos
- Ejemplo: Si generas 4 recursos totales, puedes usar 2 para jugar + 1 Physical para la capacidad

### Reglas Clave de Recursos

1. **Sin Límite Superior de Generación**
   - Un jugador puede descartar cuantas cartas necesite
   - La limitación es el tamaño de mano (hand size)

2. **Exceso Se Pierde**
   - Si necesitas 3 recursos y generas 5, pierdes 2
   - Los extras NO se guardan para costos futuros
   - Los extras NO se acumulan para el siguiente turno

3. **Tamaño de Mano es la Limitación Principal**
   - No hay un máximo de cartas a jugar por turno
   - El tamaño de mano determina cuántos recursos están disponibles
   - Al final del turno, se roba hasta el tamaño de mano

4. **Recursos Son Para Jugar Cartas**
   - Attack (ATK), Defense (DEF) e Intervención (INT) NO cuestan recursos
   - Usan los atributos del héroe (ataque, defensa, intervención) y requieren agotar al personaje
   - Lo que cuesta recursos es JUGAR CARTAS
   - Ejemplo: Jugar un evento "Deal 2 damage" cuesta 2 recursos

### Ciclo de Recursos en Un Turno

```
INICIO DEL TURNO
├─ Jugador tiene tamaño de mano de cartas en mano
├─ Cada carta muestra qué recursos genera
└─ Estos son los recursos disponibles

DURANTE EL TURNO
├─ Decide jugar una carta (ej: costo 3)
├─ Descarta cartas que generen 3+ recursos
├─ Juega la carta con los recursos generados
├─ Luego puede jugar otra carta
└─ Repite hasta que decide pasar (sin límite de cartas por turno)

FIN DEL TURNO
├─ Si tiene más cartas que tamaño de mano, descarta
├─ Roba hasta alcanzar tamaño de mano
├─ El ciclo reinicia con nuevas cartas
```

### Comparativa: Costos Genéricos vs Específicos

```
GENÉRICO (Cualquier tipo acepta):
├─ "Cost: 2" → acepta [Energy][Energy]
├─ "Cost: 2" → acepta [Mental][Physical]
└─ "Cost: 2" → acepta [Wild][Energy]

ESPECÍFICO (Debe ser el tipo indicado):
├─ "Spend 2 [Physical]" → SOLO [Physical][Physical]
├─ "Spend 1 [Mental]" → SOLO [Mental]
└─ "Spend 1 [Physical] →" → SOLO [Physical]

WILD como Comodín:
├─ "Spend 2 [Physical]" → Acepta [Physical][Wild]
├─ "Cost: 2" → [Wild][Wild] cuenta como cualquier tipo
└─ Wild es FLEXIBLE cuando se genera
```

## Sistema de Daño y Amenaza

### Daño
- Los personajes tienen un contador de **daño**
- Cuando el daño iguala o supera la salud (**HP**), el personaje es derrotado
- Cuando un superhéroe es derrotado, el jugador pierde

### Amenaza
- Los villanos y Esbirros acumulan **amenaza**
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
- Se descartan cartas por encima del tamaño de mano
- Se roban cartas hasta alcanzar el tamaño de mano
- Todas las cartas exhausted se resetean

### Villain Phase (Fase del Villano)

#### 1. Paso de Amenaza (Threat Step)
- Se coloca amenaza igual a los **acceleration icons/tokens** en el plan principal
- Los planes pueden tener efectos "when revealed"

#### 2. Paso de Activación (Activation Step)
Durante este paso, el villano y los esbirros se activan contra los jugadores. Una activación de enemigo puede ser un **ataque** o un **plan**. Siempre que un enemigo ataca o ejecuta el plan, se considera que se ha activado.

- **Activación del Villano**: Durante el paso dos de la fase del villano, el villano se activa una vez por jugador, en orden de jugador.
  - Si la identidad del jugador que resuelve la activación está en forma de **Héroe**, el villano inicia un **ataque** contra esa identidad.
  - Si la identidad está en forma de **Alter-ego**, el villano inicia la ejecución del **plan**.
  - Cada vez que el villano se activa, da al villano una **carta de aumento (boost card)** del mazo de encuentros para esa activación.
- **Activación de Esbirros**: Durante el paso dos de la fase del villano, cada esbirro enfrentado (engaged) con un jugador se activa contra ese jugador.
  - Si la identidad del jugador enfrentado está en forma de **Héroe**, el esbirro inicia un **ataque** contra esa identidad.
  - Si la identidad está en forma de **Alter-ego**, el esbirro inicia la ejecución del **plan**.
  - Si un esbirro que se está activando deja el juego, su activación termina inmediatamente y no se resuelven más pasos de esa activación.

**Resolución de Múltiples Activaciones Simultáneas**:
Si múltiples enemigos se activan contra ti simultáneamente, resuelve primero la activación del villano (si la hay) en el orden que elijas, seguida de las activaciones de los esbirros en el orden que elijas.

#### 3. Paso de Plan (Scheme Step)
- Planes secundarios pueden generar amenaza
- Se resuelven efectos especiales de planes

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

### ACTIVATION (Activación)
Existen dos tipos de activaciones de enemigo: una activación de **ataque** y una activación de **plan**. Siempre que un enemigo ataca o ejecuta el plan, se considera que se ha activado.

Algunas habilidades de cartas también pueden hacer que los enemigos ataquen o ejecuten el plan. Estas también se consideran activaciones.

**Orden de Resolución**:
Si múltiples enemigos se activan contra ti simultáneamente, resuelve primero la activación del villano (si la hay) en el orden que elijas, seguida de las activaciones de los esbirros en el orden que elijas.

### Reglas de Resolución de Activaciones
- **Finalización**: Un efecto que inicia una activación de enemigo se considera resuelto después de que dicha activación se haya resuelto por completo.
- **Activaciones Anidadas**: Si un efecto inicia una activación durante la resolución de otra activación, la nueva activación se resuelve después de que la activación actual haya terminado de resolverse.
  - Si se inician múltiples activaciones de esta manera, el primer jugador decide el orden en que se resuelven.
  - Todas las habilidades disparadas por la activación inicial se resuelven antes de que se inicien las activaciones subsiguientes.
- **Interrupción**: Si un esbirro que se está activando deja el juego, su activación termina inmediatamente y no se resuelven más pasos de esa activación.

### Tipos de Activaciones
Existen activaciones tanto para jugadores como para enemigos:

#### Attack (Ataque)
- **Jugadores**:
  - Usa el atributo de ataque (ATK) del personaje.
  - No requiere recursos para atacar.
  - El personaje debe agotarse (exhaust) al inicio de la acción.
  - Causa daño a un enemigo seleccionado.
  - **Nota**: Solo el atacante puede cambiar el objetivo durante la resolución.
- **Enemigos**:
  - Se inicia si la identidad del jugador está en forma de **Héroe**.
  - El villano recibe una carta de aumento (boost) para su ataque.

#### Scheme (Plan)
- **Enemigos**:
  - Se inicia si la identidad del jugador está en forma de **Alter-ego**.
  - El enemigo genera amenaza en el plan principal.
- **General**:
  - Acelera amenazas especiales y genera condiciones especiales.
  - Algunos planes son "forced" (obligatorios).

#### Defense (Defensa)
- Usa el atributo de defensa (DEF) del personaje.
- No requiere recursos para defender.
- El personaje debe agotarse (exhaust) al inicio de la acción.
- Solo UN jugador puede defender contra un ataque a la vez.
- El defensor reduce el daño usando su valor DEF (Defense).
- **Importante**: Otros aliados amigos NO pueden defender mientras alguien ya está defendiendo.

#### Intervención (INT)
- Usa el atributo de intervención (INT) del personaje.
- No requiere recursos para intervenir.
- El personaje debe agotarse (exhaust) al inicio de la acción.
- REMUEVE amenaza de un plan (igual al valor INT del personaje).


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
- **CORRECTO**: Si un Esbirro es derrotado, el daño en exceso se inflige al VILLANO
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
- El carácter afectado NO puede intervenir (INT)
- Es descartado al final de la fase después de no poder intervenir

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
- Tiene atributos de Ataque (ATK), Defensa (DEF) e Intervención (INT)
- Mejor para atacar enemigos y remover amenaza
- Los enemigos EJECUTAN EL PLAN contra esta forma (no pueden atacar)

#### Forma Alter-Ego
- Forma defensiva/civil
- Tiene atributo de Recuperación (REC) en lugar de ataque/defensa/intervención
- Mejor para recuperar vida (heal)
- Los enemigos EJECUTAN EL PLAN contra esta forma (en lugar de atacar)
- No puede atacar, defender ni intervenir mientras está en esta forma

#### Cambio de Forma
- El héroe puede cambiar de forma una vez por turno durante su fase.
- Cambiar de forma no agota (exhaust) al personaje por sí mismo, a menos que un efecto lo indique.
- Los enemigos no pueden cambiar de forma.

### Exhaust (Agotamiento)

**Concepto**: Una carta que ha sido "exhausted" está boca abajo o marcada y no puede actuar.

**Cuándo ocurre:**
- Un héroe/aliado ataca → se exhaust
- Un héroe/aliado defiende → se exhaust
- Un héroe/aliado interviene → se exhaust
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

**Concepto**: Daño que recibe un aliado como castigo por atacar o intervenir.

**Cómo funciona:**
- Después que un aliado ataca/interviene, recibe daño igual a los iconos de daño consecuencial bajo su ATK/INT
- Este daño se aplica automáticamente
- Si el aliado está stunned/confused, NO recibe este daño (porque no puede actuar)
- Solo se aplica cuando el aliado EXITOSAMENTE ejecuta la acción

### Planes (Schemes)

#### Main Scheme (Plan Principal)
- El plan que define el objetivo del villano
- Se coloca en el área del villano
- Acumula amenaza cada turno
- Si la amenaza alcanza su límite, los jugadores pierden
- Tiene efectos especiales "When Revealed" y "When Defeated"

#### Side Schemes (Planes Secundarios)
- Planes que crean complicaciones adicionales
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
- Algunos Esbirros tienen la palabra clave "Villainous"
