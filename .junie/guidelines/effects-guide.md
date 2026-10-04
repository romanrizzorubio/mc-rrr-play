# Guía de Efectos (Skill)

Esta guía define los efectos disponibles en el motor del juego y proporciona criterios para elegir el efecto adecuado según el texto de la carta.

## Diccionario de Efectos Comunes

| Tipo de Efecto | Uso y Criterio de Selección |
| :--- | :--- |
| `EFFECT_ADD_TRAIT` | Para otorgar rasgos; dentro de un `EFFECT_LASTING`, el motor los quita al expirar. |
| `EFFECT_CANCEL_ENCOUNTER` | Cancela perfidias por defecto; usa `type: CARD_TYPE_ANY` para cancelar cualquier carta de encuentro. |
| `EFFECT_DEAL_DAMAGE` | Cuando una carta "inflige daño" (deal damage). Es el efecto estándar de ataque. |
| `EFFECT_TAKE_DAMAGE` | Cuando un personaje "sufre daño" (take damage). Se usa para daño directo o costes. |
| `EFFECT_HEAL` | Para "curar" (heal) puntos de vida. |
| `EFFECT_MOVE_DAMAGE` | Para "mover daño" de un personaje a otro. |
| `EFFECT_PREVENT_DAMAGE` | Para "prevenir" o "evitar" daño que se va a recibir. |
| `EFFECT_REMOVE_THREAT` | Para "quitar amenaza" de planes; usa `TARGET_SCHEME` para un plan o `TARGET_ALL_SCHEMES` para todos los planes con amenaza. |
| `EFFECT_REMOVE_TRAIT` | Para quitar de un personaje uno o varios rasgos adquiridos. |
| `EFFECT_PLACE_THREAT` | Para "colocar amenaza" en planes. |
| `EFFECT_DRAW_CARD` | Para "robar cartas" del mazo. |
| `EFFECT_DISCARD_HAND` | Para "descartar cartas" de la mano. |
| `EFFECT_DISCARD_GAME` | Para "descartar" cartas que ya están en juego (mejoras, apoyos, etc.). |
| `EFFECT_DISCARD_FROM_DECK` | Para "descartar" cartas directamente desde la parte superior del mazo. |
| `EFFECT_EXHAUST` | Para "agotar" una carta. |
| `EFFECT_READY` | Para "preparar" una carta agotada. |
| `EFFECT_STUN` | Para aplicar el estado "aturdido". |
| `EFFECT_CONFUSE` | Para aplicar el estado "confundido". |
| `EFFECT_TOUGH` | Para aplicar el estado "duro". |
| `EFFECT_FLIP` | Para "dar la vuelta" a la carta de identidad (cambiar de Héroe a Alter ego o viceversa). |
| `EFFECT_SEARCH_CARDS` | Para "buscar" cartas en el mazo o pila de descartes. `requireMatch: true` deshabilita la capacidad si no hay cartas que cumplan `filter` en las `locations` de los jugadores indicados por `players`; `distinctNames: true` muestra todas las cartas válidas y deshabilita las del mismo nombre mientras una esté seleccionada. |
| `EFFECT_GENERATE_RESOURCES_FROM_CARD` | Para generar un recurso por cada icono de recurso impreso en una carta seleccionada mediante `params.target` y, opcionalmente, `params.position`. |
| `EFFECT_MOVE_TO_HAND` | Frecuentemente encadenado con búsquedas para "añadir a la mano". |
| `EFFECT_SHUFFLE_DECK` | Para "barajar" el mazo. |
| `EFFECT_CHAINED` | Para pasos que se resuelven en orden o cuando un paso necesita el resultado de otro. No implica por sí solo la condición estricta de "Luego". |
| `EFFECT_SIMULTANEOUS` | Para efectos independientes conectados por "y" que las reglas mandan resolver simultáneamente. Prepara interrupciones y diálogos del grupo antes de aplicarlo, sin ventanas de respuesta entre sus efectos; después resuelve las respuestas. En `arrow`, todos los costes son obligatorios. |
| `EFFECT_RESOLVE_SPECIAL_ABILITY` | Selecciona y resuelve capacidades Especiales válidas en las cartas de `locations` que coincidan con `filter`. `resolveAll: true` repite hasta que no queden capacidades válidas; por defecto se resuelve solo una. |
| `EFFECT_LASTING` | Para registrar un efecto hasta un límite temporal y, opcionalmente, ejecutar una limpieza al expirar. |
| `EFFECT_MAY` | Para efectos opcionales ("Puedes..."). |
| `EFFECT_CHOOSE_ABILITY` | Para elegir entre varias opciones de una misma carta. |
| `EFFECT_PAY_PRINTED_COST` | Para pagar el coste impreso de la carta seleccionada con los recursos del jugador actual. |
| `EFFECT_MODIFY_ATTACK_VALUE` | Para modificar el valor de ATQ de forma temporal o permanente. |
| `EFFECT_MODIFY_DEFENSE_VALUE` | Para modificar DEF durante su cálculo dinámico. |
| `EFFECT_MODIFY_THWART_VALUE` | Para modificar el valor de Intervención (INT). |
| `EFFECT_PUT_PLAY` | Para "poner en juego" una carta sin pagar su coste. |
| `EFFECT_REVEAL_ENCOUNTER` | Para revelar una carta de encuentro de un origen. Por defecto toma la primera ya entregada al jugador (`PLACE_PLAYER_ENCOUNTERS`); `from: PLACE_ENCOUNTER_DECK` toma la carta superior del mazo. |
| `EFFECT_SURGE` | Para aplicar la palabra clave "Oleada". |

`EFFECT_LASTING` ejecuta inmediatamente `effect` cuando no se indica `triggerType`. Las mutaciones reversibles registran su limpieza en la duración y se revierten automáticamente al expirar; `endEffect` queda para limpiezas personalizadas. Los valores `TIME_*` se resuelven mediante `TIME_TRIGGER_MAP`; los triggers explícitos en `until` se conservan.

## Diccionario de Capacidades Comunes

| Tipo de Capacidad | Uso y Criterio de Selección |
| :--- | :--- |
| `ABILITY_WHEN_REVEALED` | "Cuando se muestre esta carta". Es la capacidad estándar para Perfidias y Obligaciones. |
| `ABILITY_WHEN_REVEALED_HERO` | "Cuando se muestre esta carta" pero el efecto solo ocurre si estás en forma de **Héroe**. |
| `ABILITY_WHEN_REVEALED_ALTEREGO` | "Cuando se muestre esta carta" pero el efecto solo ocurre si estás en forma de **Alter ego**. |
| `ABILITY_WHEN_DEFEATED` | "Cuando se derrote esta carta". Común en Esbirros y Planes Secundarios. |
| `ABILITY_CONSTANT` | Habilidades pasivas o permanentes que no requieren activación manual (ej. Killmonger). |
| `ABILITY_HERO_ACTION` | "Acción de Héroe". Requiere activación por parte del jugador en fase de Héroe. |
| `ABILITY_ALTEREGO_ACTION` | "Acción de Alter ego". |
| `ABILITY_RESPONSE` | "Respuesta". Se dispara después de que ocurra una condición específica. |
| `ABILITY_FORCED_RESPONSE` | "Respuesta obligada". Igual que la anterior pero el jugador DEBE ejecutarla. |
| `ABILITY_INTERRUPT` | "Interrupción". Se dispara justo antes de que ocurra una condición. |
| `ABILITY_FORCED_INTERRUPT` | "Interrupción obligada". |
| `ABILITY_SPECIAL` | Para capacidades genéricas que no encajan en las anteriores o efectos de "Especial" (estrella). |
| `ABILITY_OPTION` | Se usa dentro de una lista `options` (ej. en `EFFECT_CHOOSE_ABILITY`) para definir elecciones. |
| `ABILITY_BOOST` | Para efectos que ocurren cuando la carta se muestra como carta de Aumento (Boost). |

### Ventanas de respuesta y condiciones

- `ABILITY_RESPONSE` se evalúa en la ventana `PRIORITY_RESPONSE` del trigger que acaba de ocurrir. Coloca ese trigger en la ventana de fin del efecto (`getTriggersEnds`) cuando la respuesta dependa del estado final del efecto; `getTriggersInit` ocurre antes de ejecutar el efecto y `triggerInit` procesa constantes e interrupciones, no respuestas.
- Las condiciones de una capacidad se comprueban contra el payload del trigger. Usa `effect.<propiedad>` para consultar el efecto que acaba de resolverse; todas las claves de `condition` deben cumplirse. No uses `activation.<propiedad>` salvo que el payload realmente incluya ese campo.
- Para una respuesta que requiere que un héroe haya defendido un ataque, usa `TRIGGER_VILLAIN_ATTACKS_YOU` en `EnemyAttackEffect.getTriggersEnds()`; ese mismo trigger en `getTriggersInit()` corresponde a la ventana previa de interrupciones. Comprueba el estado con `{'effect.isDefended': true, 'effect.defender.isHero': true}`: `isDefended` y el defensor se actualizan durante la resolución del ataque.
- Resuelve primero las respuestas obligadas de cada ataque (incluida represalia) y solo después sus respuestas opcionales. Un ataque iniciado al resolver una respuesta es una instancia independiente: vincula represalia al atacante y objetivo de ese efecto, no al `PlayCardEffect` ni al contexto heredado del ataque anterior.
- Para el ataque del villano, resuelve esas respuestas obligadas antes de abrir la ventana de `ABILITY_RESPONSE` de `TRIGGER_VILLAIN_ATTACKS_YOU`. La represalia debe ser válida para cualquier personaje defensor en juego, no solo para enemigos.
- La opción para ocultar un aviso informativo solo se ofrece cuando hay una única capacidad obligada/constante sin elección de orden. Guarda la preferencia en `Match`, identificada por carta, capacidad, trigger y prioridad; no la compartas con otras capacidades ni con diálogos interactivos.
- Añade pruebas que cubran la ventana posterior a la resolución y que descarten la respuesta cuando el ataque no lo defendió un héroe.

### Modificadores de valores numéricos

- Calcula cada valor bajo demanda con un efecto colector `Get*Effect` (por ejemplo, `GetAttackEffect`, `GetThwartEffect`, `GetDefenseEffect`, `GetHitPointsEffect` y `GetHandSizeEffect`). El colector declara los triggers del cálculo, inicializa un acumulador `modifyX` y obtiene el resultado sumando ese acumulador al valor base.
- Para los atributos visibles del personaje, el flujo es `CharacterGameCard.getEffectiveStats()` → `getAttackValue()`, `getThwartValue()` o `getDefenseValue()` → el `Get*Effect` correspondiente. El cálculo es asíncrono y la serialización de héroes y aliados debe esperar su resultado para que la etiqueta muestre el mismo valor efectivo que usa el motor.
- Los colectores de combate calculan:

| Atributo | Colector | Resultado |
| :--- | :--- | :--- |
| ATQ | `GetAttackEffect` | `selectedTarget.attack + modifyAttack` |
| INT | `GetThwartEffect` | `selectedTarget.thwart + modifyThwart`, salvo que INT sea `null` |
| DEF | `GetDefenseEffect` | `selectedTarget.defense + modifyDefense` |

- `GetAttackEffect` procesa `TRIGGER_YOUR_HERO_GET_ATTACK` y `TRIGGER_ATTACHED_GET_ATTACK`; `GetThwartEffect` procesa `TRIGGER_YOUR_HERO_GET_THWART`, `TRIGGER_THIS_GET_THWART` y `TRIGGER_ATTACHED_GET_THWART`; `GetDefenseEffect` procesa `TRIGGER_CONDITION_GET_DEFENSE` y `TRIGGER_YOUR_HERO_GET_DEFENSE`. Usa el trigger que corresponda para limitar cuándo aplica la bonificación; los triggers `TRIGGER_YOUR_HERO_GET_*` se limitan al héroe del jugador que controla la carta.
- Para una bonificación dinámica, apunta con `target: TARGET_EFFECT` al colector disponible en `params.effect`. `EFFECT_MODIFY_ATTACK_VALUE`, `EFFECT_MODIFY_THWART_VALUE` y `EFFECT_MODIFY_DEFENSE_VALUE` acumulan el cambio en `modifyAttack`, `modifyThwart` o `modifyDefense`; no cambies el atributo impreso ni una propiedad persistente del personaje para representar un modificador que solo aplica durante el cálculo.
- Si una capacidad inflige daño igual al ATQ de su personaje, configura `paramsCalc.formula: CALC_ATTACK` en `EFFECT_DEAL_DAMAGE` y apunta `paramsCalc.target` al personaje. `DealDamageEffect` resuelve sus parámetros antes de ejecutarse y delega el cálculo a `Calc`, que obtiene el ATQ con `CharacterGameCard.getAttackValue()` y aplica `plus`, `multiply` y `max`. Como `CALC_ATTACK` procesa triggers asíncronos, quien consuma el resultado de `Calc` debe esperarlo.
- Mantén las clases generales (`Ability`, `Effect` base y factorías) libres de ramas para tipos de efectos o cartas concretos. Usa hooks polimórficos genéricos en la infraestructura base y coloca la preparación específica de parámetros en la clase del efecto correspondiente; las fórmulas compartidas pertenecen a `Calc`.
- El modificador debe resolverse durante el trigger del cálculo correspondiente. Obtén el colector desde `params.effect` y suma allí el cambio (`params.effect.modifyX += delta`); no recorras cartas desde `Match` o `Player`, ni modifiques el valor impreso para aplicar un bonus temporal. En capacidades nuevas, configura `target` para indicar el objetivo y la identidad aplicable; usa `TARGET_EFFECT` solo cuando el propio efecto colector sea el objetivo, no para elegir entre héroe y alter ego.
- Los modificadores aditivos deben acumularse con `+=`; asignar con `=` puede reemplazar otros modificadores. Calcula los valores dinámicos con `this.calculate(params)` cuando se configure `paramsCalc` y valida que el resultado sea finito.
- `CALC_IF` elige `ifTrue` o `ifFalse` según la veracidad de `paramsCalc.target`; úsalo para calcular un único valor dinámico cuando una capacidad cambia la cantidad sin crear efectos separados.
- Declara el alcance mediante `target`: usa `TARGET_YOUR_SUPERHERO` para ambas identidades del jugador actual, `TARGET_YOUR_HERO` para su héroe, `TARGET_HERO` para el héroe de cualquier jugador o `TARGET_ALTEREGO` para su alter ego. No uses listas de identidades ni lógica específica de cada carta para decidir dónde aplica.
- Para bonificaciones de ATQ o INT de un personaje vinculado, usa `TRIGGER_ATTACHED_GET_ATTACK` o `TRIGGER_ATTACHED_GET_THWART` y apunta con `TARGET_EFFECT` al efecto colector del atributo.
- Para aplicar modificadores a todos los personajes de un jugador elegido, usa `TARGET_SELECTED_PLAYER_CHARACTERS` en una cadena cuyo objetivo padre sea `TARGET_ANY_PLAYER`. Envuélvelos en `EFFECT_LASTING` para que la bonificación se limpie al expirar.
- Distingue los valores calculados del estado mutable: los puntos de vida máximos usan `GetHitPointsEffect` y la vida actual es el máximo menos el daño acumulado. El daño y la curación siguen modificando el estado mediante sus efectos; si un valor numérico aún no tiene colector, impleméntalo y añade su trigger antes de incorporar modificadores.

### Modificadores del tamaño de mano

- `Player.getHandSize()` usa `GetHandSizeEffect`; `ModifyHandSizeEffect` acumula el modificador en el efecto colector. Los flujos de robo, mulligan, descarte y serialización deben esperar este cálculo.
- `ModifyHandSizeEffect` usa `TARGET_YOUR_SUPERHERO` por defecto. Configura `TARGET_YOUR_HERO` o `TARGET_ALTEREGO` para limitarlo a una forma del jugador actual, o `TARGET_HERO` para aplicarlo al héroe de cualquier jugador.

### Modificadores de vida máxima

- `Player.getHitPoints()` usa `GetHitPointsEffect`; `ModifyHitPointsEffect` acumula en el colector durante el trigger correspondiente. El cálculo se usa también para determinar la vida actual y comprobar derrotas.
- `ModifyHitPointsEffect` usa `TARGET_YOUR_SUPERHERO` por defecto; configura `TARGET_YOUR_HERO` o `TARGET_ALTEREGO` para limitarlo a una identidad del jugador actual, o `TARGET_HERO` si debe aplicarse al héroe de cualquier jugador.
- El daño acumulado sigue siendo estado separado: `vida actual = vida máxima calculada - daño`.

## Reglas de Atributos Dinámicos (Valores X)

- **Atributos como X**: Cuando un valor (Ataque, Intervención, Defensa, Planificación o Recuperación) sea **X**, el atributo debe definirse directamente con la lógica de cálculo (usando un objeto compatible con `Calc`). El motor ha sido modificado en `CharacterGameCard.js` para detectar si un atributo es un objeto y evaluarlo dinámicamente, permitiendo además la suma de modificadores externos (accesorios, etc.) sobre el resultado calculado.
- **Cálculo de "Todo" (CALC_ALL)**: Para efectos que afecten a la totalidad de un valor (ej: "cura TODO el daño", "quita TODA la amenaza"), se debe usar la constante `CALC_ALL` en el objeto de cálculo. Esto permite al motor determinar dinámicamente la cantidad necesaria basándose en el estado actual del objetivo.

## Reglas para Accesorios (Attachments)

- **Vinculación Constante**: Si una carta indica a quién debe vincularse (ej: "Vincula esta carta al Villano"), NO debe implementarse como una habilidad "Cuando se muestre" (`ABILITY_WHEN_REVEALED`). En su lugar, debe definirse directamente en la propiedad `attach` dentro del objeto `params` de la carta (ej: `attach: TARGET_VILLAIN`). Esto asegura que la vinculación sea una regla constante de la carta que no pueda ser cancelada por efectos que anulan el "Cuando se muestre".
- **Oleada en Accesorios**: Si un accesorio tiene una condición de **Oleada** (u otro efecto) si no puede vincularse (ej: "Si no hay esbirros en juego, esta carta gana Oleada"), esta lógica debe integrarse dentro de la propiedad `attach` como un efecto en el campo `ifNot`. El motor ha sido modificado para que `ifNot` acepte cualquier objeto de efecto genérico.

## Mapeo de Acciones a Efectos

### Estructura de efectos en capacidades

- `params.effect` debe describir un solo efecto; no asignes un array directamente (`effect: [...]`). `EffectsFactory.parseEffect` convierte ese array en otro array, pero una capacidad necesita una instancia de efecto con `canRun`.
- Antes de configurar el efecto, clasifica los conectores y la puntuación del texto:

| Marca | Regla del juego | Configuración |
| :--- | :--- | :--- |
| `.` | Separa frases que se resuelven en el orden escrito. El punto no hace que una frase dependa del éxito completo de la anterior. | Usa `EFFECT_CHAINED` para conservar el orden, sin añadir una condición de éxito que el texto no indique. |
| `y` / `and` entre efectos | Los efectos independientes se resuelven simultáneamente; cada uno se intenta resolver lo más completamente posible. | Usa `EFFECT_SIMULTANEOUS`. Una `y` que solo une sustantivos u objetivos no crea efectos separados. |
| `,` | La coma no es por sí sola un operador de tiempo, simultaneidad ni dependencia. | No elijas `EFFECT_CHAINED` o `EFFECT_SIMULTANEOUS` por la coma: identifica las cláusulas y los conectores con significado de reglas. |
| **Luego** (`Then`) | El texto posterior solo se intenta si el texto anterior se resolvió por completo; si se cumple esa condición, el texto posterior debe intentarse. | Pon `thenEffect` en el efecto que representa todo el texto previo. Si ese texto es un grupo, cuélgalo del `EFFECT_CHAINED` o `EFFECT_SIMULTANEOUS` que lo contiene. |
| **En vez de eso** (`Instead`) | Reemplaza el efecto o suceso indicado; no se resuelve además del efecto reemplazado. | Modela una sustitución/cancelación adecuada, no dos efectos incondicionales en una cadena ni un grupo simultáneo. |
| **Adicional** (`Additional`) | Modifica otro efecto y se resuelve simultáneamente bajo las mismas condiciones. | Incorpora el valor adicional al efecto modificado cuando corresponda; no lo conviertas automáticamente en una segunda instancia, por ejemplo, de daño. |
| **En caso contrario** (`Otherwise`) | Abre una rama cuando la condición o el efecto precedente no se cumple o no puede resolverse, con el alcance que determinan la frase y el punto y coma. | Usa una condición/`effectNot`; no lo confundas con **Luego** (que exige resolución completa) ni con **En vez de eso** (que reemplaza un efecto). |

- Si la traducción, una lista con comas o la estructura gramatical no deja claro dónde empieza y termina cada efecto, revisa el texto de referencia y las reglas; pregunta antes de escoger entre cadena y grupo simultáneo.
- Para varios efectos en frases secuenciales sin "Luego", envuélvelos en `EFFECT_CHAINED`. Mantén el orden escrito, pero no uses `matchAll` para introducir una dependencia que no aparezca en el texto.
- Configura **Luego** con `thenEffect`, no con `matchAll`. `matchAll: true` exige que todos los hijos puedan ejecutarse para habilitar la cadena y hace que la ejecución se detenga si uno no se resuelve por completo; úsalo solo cuando esa restricción se desprenda de las reglas, no por la mera presencia de varios efectos.
- En un grupo `EFFECT_SIMULTANEOUS`, mantén independientes los efectos hijos. Si un hijo necesita el resultado de otro (por ejemplo, una carta elegida, un conteo descartado o una cantidad calculada por un paso previo), usa la composición secuencial o un único efecto calculado; no simules una dependencia como si fuera "y".

- `arrow` define los costes de una capacidad y se resuelve antes de `effect`. Para costes compuestos, usa `EFFECT_SIMULTANEOUS`; las cadenas existentes dentro de `arrow` se interpretan automáticamente como simultáneas, excepto las cadenas dentro de un `thenEffect`, que mantienen su orden. Declara en `outputParams` los valores del contexto que deban llegar al efecto principal (por ejemplo, `['selectedCard']`). Así, la transferencia de la carta elegida queda explícita en la configuración de la carta, no implícita en el motor de flechas.
- El motor prepara primero las interrupciones de todos los efectos de coste. Recoge las selecciones de pago antes de aplicar cualquier coste; si quedan varios diálogos, pregunta cuál responder a continuación y reserva las cartas y generadores ya seleccionados. Después aplica todos los costes, resuelve sus respuestas y finalmente el efecto principal. Cancelar un diálogo descarta las selecciones antes de ejecutar los costes, por lo que no requiere deshacer sus efectos; la capacidad se vuelve a ofrecer. Si una interrupción impide pagar algún coste, aborta la capacidad sin volver a ofrecerla.

- Para seleccionar objetivos, utiliza los selectores documentados en la [Guía de Objetivos](./targets-guide.md).
- Para `TARGET_BY_TITLE`, configura `title` en los parámetros del efecto, no `name`: el selector compara `ability.effect.title` con el nombre de las cartas activas.
- **"Inflige X de daño"**: `EFFECT_DEAL_DAMAGE`.
- **"Quita X de amenaza"**: `EFFECT_REMOVE_THREAT`.
- **"Genera los recursos impresos en una carta"**: usa `EFFECT_GENERATE_RESOURCES_FROM_CARD` con un `target` que resuelva una carta o zona de cartas. Si el objetivo es una zona, especifica `position`; por ejemplo, combina `TARGET_PLAYER_DISCARD` con `TARGET_TOP_CARD` para seleccionar la carta superior del descarte del jugador. Se genera un recurso por cada icono impreso, incluyendo iconos repetidos. Obténlos con `card.card.getPrintedResources()` sin pasar la carta que se está pagando a `getResources(card)`, para no aplicar recursos adicionales condicionales del cuadro de texto de una carta de recurso (véase la regla de recursos impresos en `docs/02-01-FUNDAMENTALS.md`).
- `RESOURCE_ANY` representa un espacio de coste genérico: cada recurso generado, incluido uno universal, puede satisfacerlo. La validación de pago debe priorizar requisitos de recurso específicos antes de consumir espacios `RESOURCE_ANY`.
- **Pago de costes con recursos condicionales**: pasa la carta cuyo coste se paga a `player.spendResources(resources, cardToPay)` y serializa los recursos disponibles con `toObj({card: cardToPay})`. Así se evalúan sus condiciones contra la carta correcta: por ejemplo, **El poder del liderazgo** genera dos recursos al pagar un Aliado de Liderazgo y uno si el Aliado es de otro aspecto. `EFFECT_PAY_PRINTED_COST` debe además aplicar `PayCostEffect` a las cartas y generadores elegidos para completar el pago.
- **"Busca una carta, muévela a otra zona y baraja"**: esta secuencia depende de la carta elegida y debe permanecer en `EFFECT_CHAINED`, no convertirse a `EFFECT_SIMULTANEOUS`. Encadena `EFFECT_SEARCH_CARDS`, el efecto de movimiento correspondiente (`EFFECT_MOVE_TO_HAND`, `EFFECT_MOVE_TO_DECK`, etc.) y, cuando corresponda, `EFFECT_SHUFFLE_DECK`. `EFFECT_SEARCH_CARDS` recibe `locations` (por ejemplo, `PLACE_DISCARD_PILE` o `PLACE_DECK`) y `filter`; guarda la carta elegida para que el efecto de movimiento la retire de su zona y la traslade. Para tomar la primera carta que cumpla el filtro recorriendo una pila desde arriba, usa `firstMatch: true`: en el descarte, comienza por la última carta añadida y sigue hacia las anteriores; en el mazo, comienza por la primera carta del array. La primera coincidencia se selecciona sin abrir un diálogo.

```javascript
{
    type: EFFECT_CHAINED,
    params: {
        matchAll: true,
        effects: [
            {
                type: EFFECT_SEARCH_CARDS,
                params: {
                    locations: [PLACE_DISCARD_PILE],
                    firstMatch: true,
                    filter: {
                        type: CARD_TYPE_UPGRADE,
                        traits: TRAIT_TECH
                    }
                }
            },
            {
                type: EFFECT_MOVE_TO_HAND
            }
        ]
    }
}
```

- Todas las claves de `params.filter` y `params.condition` deben coincidir (AND); si la propiedad comprobada es una lista, el valor indicado puede coincidir con cualquiera de sus elementos.
- **"Elige una opción:"**: `EFFECT_CHOOSE_ABILITY` con `options` de tipo `ABILITY_OPTION`.
- **"Puedes..."**: `EFFECT_MAY`.
- **Efectos al entrar en juego**:
    - **Perfidias y cartas con "Cuando se muestre"**: Usa siempre `ABILITY_WHEN_REVEALED` (o sus variantes por identidad).
    - **Obligaciones SIN "Cuando se muestre"**: Usa `ABILITY_CONSTANT` con `trigger: TRIGGER_INSTANT` dentro del array `abilities` en `params`. Además, el objeto `params` debe incluir `triggerInstant: true`. Este es un patrón específico del motor para gestionar la entrada de obligaciones que no tienen un efecto de revelación estándar.
- **"No puede ser objetivo"**: Usa `validation` en una `ABILITY_CONSTANT` (ver Guía de Traducción).
- **Filtrado de Objetos (Filtros)**: Evita usar selectores de objetivo ultra-específicos si el efecto admite `filter` o `condition`. Filtra por tipo con la propiedad `type` y su constante (`type: CARD_TYPE_UPGRADE`), y por rasgos con `traits` (`traits: TRAIT_TECH`). Cuando un efecto tenga un campo de control documentado, usa `TARGET_YOU` en vez del literal `'you'`.
- **Cualquier jugador vs Cada jugador**:
    - Si el texto dice "cualquier jugador" (o si eliges uno): Usa `TARGET_ANY_PLAYER`.
    - Si el texto dice "cada jugador" (o todos): Usa `TARGET_ALL_PLAYERS`. Esto asegura que el motor ejecute el efecto secuencialmente para todos los participantes.

## Instrucciones de Mantenimiento

1. **Auto-actualización**: Si al implementar una carta se identifica una necesidad que no cubren los efectos actuales, se debe investigar en `packages/mc-back/src/effects` si existe un archivo `.js` que corresponda. Si existe pero no está en esta guía, **DEBE** añadirse inmediatamente.
2. **Creación de Nuevos Efectos**: Si la funcionalidad es genuinamente nueva, se debe crear el archivo del efecto en `packages/mc-back/src/effects`, registrar el identificador en `packages/mc-shared/constants` (o donde corresponda) y en `EffectsFactory.js`.
3. **Consistencia**: Combina efectos secuenciales mediante `EFFECT_CHAINED` y efectos por lote mediante `EFFECT_SIMULTANEOUS`, en lugar de crear efectos ultra-específicos.
