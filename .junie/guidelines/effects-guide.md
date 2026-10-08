# Guía de Efectos (Skill)

Esta guía define los efectos disponibles en el motor del juego y proporciona criterios para elegir el efecto adecuado según el texto de la carta.

## Diccionario de Efectos Comunes

| Tipo de Efecto | Uso y Criterio de Selección |
| :--- | :--- |
| `EFFECT_ADD_TRAIT` | Para otorgar rasgos; dentro de un `EFFECT_LASTING`, el motor los quita al expirar. |
| `EFFECT_ADD_KEYWORD` | Para otorgar una palabra clave a una carta. El modificador dura mientras la carta fuente permanezca en juego o, dentro de `EFFECT_LASTING`, mientras dure ese efecto. Usa `keyword` como objeto (por ejemplo, `{retaliate: 1}`). |
| `EFFECT_ADD_ADDITIONAL_COST` | Dentro de una capacidad constante activada por `TRIGGER_ABILITY_COST`, añade un efecto de coste a la capacidad que se está iniciando. Usa `sourceCardOnly` y `abilityCondition` para limitar qué capacidades reciben el coste; `cost` debe ser un único efecto. En un ataque básico de un aliado, el coste adicional se compone con el coste base de agotarlo y no modifica el coste impreso de jugarlo. |
| `EFFECT_CHANGE_ATTACK_TARGETS` | Sustituye los objetivos del ataque de enemigo actual por los indicados por `target`. |
| `EFFECT_CANCEL_ATTACK` | Cancela la activación de ataque del contexto actual (`params.attack.effect`); en efectos anidados, no uses `TARGET_EFFECT`, que puede señalar al efecto contenedor. |
| `EFFECT_CANCEL_ENCOUNTER` | Cancela perfidias por defecto; usa `type: CARD_TYPE_ANY` para cancelar cualquier carta de encuentro. |
| `EFFECT_CANNOT_TARGET` | Solo dentro de `validation` de una capacidad constante. Excluye objetivos según `effectTypes` o `effectCategories` (por ejemplo, `EFFECT_CATEGORY_DAMAGE`); `condition` busca una carta en juego, `targetCondition` limita las cartas afectadas y `effectCondition` evalúa el efecto o su fuente. No se resuelve como efecto normal. |
| `EFFECT_DEAL_DAMAGE` | Cuando una carta "inflige daño" (deal damage). Es el efecto estándar de ataque. Para seleccionar varios objetivos, configura `multipleTarget: true`; `selectCount` o `targetCountCalc` determina cuántos se eligen. Usa `targetCountCalc` cuando el recuento solo esté disponible después de pagar un coste. |
| `EFFECT_DEAL_ENCOUNTER` | Reparte una carta del mazo de Encuentros al jugador objetivo, boca abajo. |
| `EFFECT_DEAL_BOOST` | Añade una carta de aumento a la activación de enemigo actual. Debe conservar el contexto de esa activación; no la resuelvas como una activación independiente. |
| `EFFECT_PUT_FACEDOWN_CARD_IN_PLAY` | Toma la carta superior del mazo del jugador o los jugadores indicados, dispara `TRIGGER_FACEDOWN_CARD` con la carta como parámetro y la pone en juego con su tipo convertido por el entorno. Usa `players: TARGET_ALL_PLAYERS` para afectar a cada jugador. |
| `EFFECT_CONVERT_FACEDOWN_CARD` | Convierte la carta recibida en el parámetro `card` en el tipo configurado. El entorno proporciona `cardType` y `cardParams` con solo los valores conocidos; los datos impresos originales se mantienen privados para restaurar la misma carta cuando abandone el juego. |
| `EFFECT_TAKE_DAMAGE` | Cuando un personaje "sufre daño" (take damage). Se usa para daño directo o costes. |
| `EFFECT_HEAL` | Para "curar" (heal) puntos de vida. Con `paramsCalc`, una cantidad calculada de 0 hace que el efecto no pueda resolverse y habilita `ifNot`; usa `allowNoDamage: true` cuando resolver una curación de 0 sea válido. |
| `EFFECT_SET_LIFE` | Para fijar la vida restante de personajes a un valor concreto, no para curar una cantidad de daño. Calcula el daño desde los puntos de vida máximos efectivos y establece el daño para dejar el valor de vida indicado. |
| `EFFECT_PREVENT_DEFEAT` | Durante una interrupción de derrota, reemplaza esa derrota antes de que se resuelvan sus efectos. |
| `EFFECT_MOVE_DAMAGE` | Para "mover daño" de un personaje a otro. |
| `EFFECT_PREVENT_DAMAGE` | Para "prevenir" o "evitar" daño que se va a recibir. |
| `EFFECT_REMOVE_THREAT` | Para "quitar amenaza" de planes; usa `TARGET_SCHEME` para un plan o `TARGET_ALL_SCHEMES` para todos los planes con amenaza. |
| `EFFECT_REMOVE_TRAIT` | Para quitar de un personaje uno o varios rasgos adquiridos. |
| `EFFECT_PLACE_THREAT` | Para "colocar amenaza" en planes; acepta los selectores múltiples `TARGET_ALL_*` para aplicarla a todos sus resultados. |
| `EFFECT_DRAW_CARD` | Para "robar cartas" del mazo. |
| `EFFECT_DISCARD_HAND` | Para "descartar cartas" de la mano. |
| `EFFECT_DISCARD_GAME` | Para "descartar" cartas que ya están en juego (mejoras, apoyos, etc.). |
| `EFFECT_DISCARD_FROM_DECK` | Para "descartar" cartas directamente desde la parte superior del mazo. Toma solo las cartas disponibles, las descarta juntas y en orden, y conserva esas cartas en `cards` para cálculos posteriores. Acepta un recuento dinámico mediante `paramsCalc` y `players: TARGET_ALL_PLAYERS` para afectar a cada jugador. Si el mazo queda vacío, se cicla el descarte después del lote; el efecto no continúa descartando del mazo nuevo. |
| `EFFECT_DISCARD_UNTIL` | Descarta del mazo objetivo hasta la primera carta que cumpla `condition`, la deja en el descarte y la guarda en `selectedCard` para los siguientes efectos encadenados; no la revela. |
| `EFFECT_EXHAUST` | Para "agotar" una carta; usa `TARGET_ALL_ALLIES` para agotar todos los aliados en juego o `TARGET_ALL_ALLIES_YOU_CONTROL` para agotar solo los que controla el jugador actual. |
| `EFFECT_REQUIRE_DEFENDER` | Durante un ataque, si hay defensores que cumplen `condition`, solo ofrece esos defensores y obliga a elegir uno; no se puede continuar sin defender. Si ninguno cumple la condición, el ataque continúa con las opciones de defensa normales y puede quedar sin defender según las reglas habituales. |
| `EFFECT_READY` | Para "preparar" una carta agotada. |
| `EFFECT_STUN` | Para aplicar el estado "aturdido". |
| `EFFECT_CONFUSE` | Para aplicar el estado "confundido". |
| `EFFECT_TOUGH` | Para aplicar el estado "duro". |
| `EFFECT_FLIP` | Para "dar la vuelta" a la carta de identidad (cambiar de Héroe a Alter ego o viceversa). |
| `EFFECT_SEARCH_CARDS` | Para "buscar" cartas en las ubicaciones indicadas por `locations`, incluidos los mazos y pilas de descartes de jugador y de encuentros. Por defecto permite elegir entre todas las coincidencias; `firstMatch: true` selecciona solo la primera según el orden de búsqueda y `reverseLocations` invierte el orden de las cartas en las ubicaciones indicadas para esa selección. `requireMatch: true` deshabilita la capacidad si no hay cartas que cumplan `filter`; sus campos admiten comparaciones calculadas como `{operator: '<=', paramsCalc: {...}, defaultValue: 0}`, evaluadas para cada carta. `onlyPlayable: true` también exige que cada resultado supere `card.canPlay` en modo de comprobación, sin abrir diálogos. `distinctNames: true` muestra todas las cartas válidas y deshabilita las cartas del mismo nombre mientras una esté seleccionada. `showCancel: true` muestra una opción para cancelar la selección y evita que continúe la cadena del efecto. |
| `EFFECT_GENERATE_RESOURCES_FROM_CARD` | Para generar un recurso por cada icono de recurso impreso en una carta seleccionada mediante `params.target` y, opcionalmente, `params.position`. |
| `EFFECT_MOVE_TO_HAND` | Frecuentemente encadenado con búsquedas para "añadir a la mano". |
| `EFFECT_SHUFFLE_DECK` | Para "barajar" el mazo. |
| `EFFECT_CHAINED` | Para pasos que se resuelven en orden o cuando un paso necesita el resultado de otro. Si un hijo no puede ejecutarse, lo omite y continúa con los siguientes. Los costes requieren que todos sus hijos se resuelvan; un `thenEffect` solo se ejecuta si todos los hijos previos se resolvieron por completo. Estas condiciones se detectan automáticamente, sin `matchAll`. Conserva el contexto de capacidad y, si `thenEffect` usa el mismo `target`, reutiliza el objetivo ya seleccionado. |
| `EFFECT_CANNOT` | Para una capacidad constante que prohíbe una acción comprobada por una restricción. `restriction` nombra la clave de `params.restrictions` que debe pasar a `false`; `sourceIn` puede limitarla a cuando la carta fuente aparece en la lista resuelta desde esa ruta de parámetros. Usa `EFFECT_CANNOT_TARGET` cuando la prohibición deba invalidar objetivos. |
| `EFFECT_FOR_EACH` | Repite `effect` en el orden devuelto por `target`. Usa `condition` para filtrar los objetivos y `exclude` con una ruta o lista de rutas sobre los parámetros de ejecución para omitir objetivos coincidentes; `*` expande listas. Mantiene el contexto correspondiente en cada resolución y no debe ramificarse por selectores `TARGET_*` concretos. |
| `EFFECT_SIMULTANEOUS` | Para efectos independientes conectados por "y" que las reglas mandan resolver simultáneamente. Prepara interrupciones y diálogos del grupo antes de aplicarlo, sin ventanas de respuesta entre sus efectos; después resuelve las respuestas. En `arrow`, todos los costes son obligatorios. |
| `EFFECT_CHOOSE` | Ofrece solo opciones que puedan resolverse al menos parcialmente. Da a cada opción un `title` claro en los parámetros del efecto para que el usuario sepa qué va a elegir. Si queda una, resuélvela directamente; abre el selector solo si quedan varias. Usa `players: TARGET_ALL_PLAYERS` para que cada jugador elija, en orden, con su propio contexto. |
| `EFFECT_SPEND` | Como efecto, puede resolverse parcialmente: debe haber al menos un requisito pagable y se pagan tantos requisitos como permitan los recursos disponibles. Como coste, todos los requisitos deben pagarse. |
| `EFFECT_RESOLVE_SPECIAL_ABILITY` | Selecciona y resuelve capacidades Especiales válidas en las cartas de `locations` que coincidan con `filter`. `resolveAll: true` repite hasta que no queden capacidades válidas; por defecto se resuelve solo una. |
| `EFFECT_LASTING` | Para registrar un efecto hasta un límite temporal y, opcionalmente, ejecutar una limpieza al expirar. |
| `EFFECT_MAY` | Para efectos opcionales ("Puedes..."). |
| `EFFECT_CHOOSE_ABILITY` | Para elegir entre varias opciones de una misma carta. |
| `EFFECT_PAY_PRINTED_COST` | Para pagar el coste impreso de la carta seleccionada con los recursos del jugador actual. |
| `EFFECT_MODIFY_ATTACK_VALUE` | Para modificar el valor de ATQ de forma temporal o permanente. |
| `EFFECT_MODIFY_ATTACK_CONSEQUENCIAL` | Para modificar el daño derivado que sufre un aliado después de atacar; resuelve el valor mediante `GetAttackConsequencialEffect`, igual que los modificadores de ATQ usan `GetAttackEffect`. |
| `EFFECT_MODIFY_DEFENSE_VALUE` | Para modificar DEF durante su cálculo dinámico. |
| `EFFECT_MODIFY_THWART_VALUE` | Para modificar el valor de Intervención (INT). |
| `EFFECT_PUT_PLAY` | Para "poner en juego" una carta sin pagar su coste. `requirePlayable: true` comprueba las restricciones normales de juego de una carta de jugador antes de ponerla en juego. |
| `EFFECT_ENGAGE` | Para poner un esbirro en juego enfrentado al jugador objetivo. |
| `EFFECT_SEVERAL_ATTACKS` | Resuelve ataques de varios enemigos; `attackTarget` usa un selector `TARGET_*` para elegir a quién ataca cada enemigo. Por ejemplo, `TARGET_ENGAGED` selecciona al jugador enfrentado al enemigo. Configura `enemiesCondition` para filtrar los enemigos antes de resolver sus ataques. |
| `EFFECT_REVEAL_ENCOUNTER` | Para revelar una carta de encuentro de un origen. Por defecto toma la primera ya entregada al jugador (`PLACE_PLAYER_ENCOUNTERS`); `from: PLACE_ENCOUNTER_DECK` toma la carta superior del mazo. |
| `EFFECT_SURGE` | Para aplicar la palabra clave "Oleada". |

### Cálculos antes de serializar el estado

- En los métodos `toObjWith...`, completa primero los cálculos que puedan activar efectos o modificar el modelo y toma la instantánea serializada después. No conserves un `toObj()` anterior a cálculos asíncronos como `getEffectiveTraits()`: una capacidad constante puede añadir un rasgo durante ese cálculo.
- Las actualizaciones incrementales y las instantáneas completas deben publicar el mismo estado calculado. Al cambiar de identidad, evita que un refresco parcial anterior al cálculo llegue después y sobrescriba el estado completo.
- Añade una prueba de regresión para la primera actualización tras la acción o el cambio de identidad; no basta con comprobar que una recarga posterior muestre el estado correcto.

### Exclusión genérica de objetivos con `EFFECT_FOR_EACH`

`condition.exclude` acepta una ruta o una lista de rutas que se resuelven contra los parámetros de ejecución del efecto. Las rutas pueden consultar resultados de efectos anteriores en un `EFFECT_CHAINED`; usa `*` para expandir listas y apunta a los objetos objetivo para que el motor los compare por identidad o `id`.

```js
condition: {
    exclude: [
        'effects.0.attacks.*.selectedTarget',
        'effects.0.attacks.*.defender.owner',
    ],
}
```

Prefiere este filtro declarativo a añadir propiedades especiales por carta, callbacks o métodos de filtrado específicos en `ForEachEffect`. No ramifiques el efecto según un selector concreto como `TARGET_ALL_PLAYERS`: pásalo al resolvedor estándar, conserva el orden que devuelva y aplica únicamente los filtros configurados. Sin filtro, devuelve los objetivos resueltos sin reordenarlos.

### Pruebas de rutas sobre el contexto del efecto

- Cuando una configuración lea rutas del contexto de ejecución (`paramsCalc`, `targetCountCalc`, `condition`, `effectCondition`, `condition.exclude`, `sourceIn` u otra equivalente), añade una prueba de regresión que invoque la capacidad o el efecto con la misma forma de contexto que usa el motor.
- Comprueba que la ruta obtiene el valor esperado y que ese valor produce el resultado correcto del efecto. No basta con comprobar la cadena configurada ni con probar `path()` sobre un objeto construido sin el contexto real del efecto.
- Si la ruta depende de un coste, una selección anterior o un resultado de `EFFECT_CHAINED`, reproduce ese flujo o pasa el resultado en la misma rama y nivel donde el motor lo expone. Incluye valores representativos (por ejemplo, dos objetivos seleccionados) y los casos vacíos o ausentes que deban manejarse.

### Referencias a un objetivo previo

«Ese/a» identifica el objetivo concreto indicado antes en el texto. Configura la cadena y los efectos dependientes para reutilizar ese mismo objetivo; no vuelvas a abrir una selección independiente. Si no existe un objetivo válido para el efecto inicial, no debe resolverse el efecto que depende de «ese/a».

`multipleTarget: true` evita la preselección de un solo objetivo antes de pagar costes. El efecto realiza su selección durante la resolución; usa un recuento dinámico cuando el número de objetivos dependa de cartas u otros resultados del coste.

`EFFECT_LASTING` ejecuta inmediatamente `effect` cuando no se indica `triggerType`. Las mutaciones reversibles registran su limpieza en la duración y se revierten automáticamente al expirar; `endEffect` queda para limpiezas personalizadas. Los valores `TIME_*` se resuelven mediante `TIME_TRIGGER_MAP`; los triggers explícitos en `until` se conservan.

### Opciones y pagos parciales

- Evalúa cada opción de `EFFECT_CHOOSE` por separado según si su efecto puede resolverse al menos en parte; no descartes opciones parcialmente válidas porque otra opción pueda resolverse por completo.
- Si solo queda una opción válida, resuélvela sin pedir una selección. Si quedan varias, muestra únicamente esas opciones.
- `EFFECT_EXHAUST` puede resolver una selección múltiple parcialmente cuando al menos uno de los objetivos puede agotarse; los objetivos ya agotados no impiden agotar los demás.
- Cuando `EFFECT_SPEND` sea un efecto, habilítalo si se puede pagar al menos uno de sus requisitos. Al confirmar, exige la mayor cantidad de requisitos que pueda satisfacerse con los recursos disponibles y marca el efecto como parcialmente resuelto si quedan requisitos pendientes.
- No uses pagos parciales para costes de flecha ni otros costes. Esos pagos deben satisfacer todos los requisitos.
- Si `EFFECT_SPEND` es una opción seleccionable de `EFFECT_CHOOSE`, permite cancelar el diálogo de pago y vuelve a mostrar las opciones sin resolver la opción cancelada.

### Resolución de varias cartas de aumento

- Resuelve todas las cartas de aumento de una activación, una por una y en el orden en que se repartieron. Cada icono de aumento de cada carta contribuye al total de esa activación; las capacidades de aumento también se resuelven individualmente.
- Una carta adicional modifica la activación existente: no reemplaza su carta normal ni inicia otra activación. Acumula los valores de todas las cartas antes de calcular el ATQ o la PLA final.
- Añade una prueba con al menos dos cartas de valores conocidos que compruebe tanto la suma total como el daño o la amenaza resultante. No deduzcas los valores de las imágenes; usa el dato estructurado `boost` del catálogo.
- Si la interfaz revela varias cartas, deben permanecer boca abajo hasta su turno y mostrarse de izquierda a derecha. Conserva visibles los iconos y la indicación de capacidad de aumento de cada carta revelada, muestra la suma acumulada de los iconos ya revelados y no continúes la activación hasta resolverlas todas.

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
- `TRIGGER_THIS_SCHEME` se dispara al final de la activación de Plan del enemigo que lo inició.
- Las condiciones de una capacidad se comprueban contra el payload del trigger. Usa `effect.<propiedad>` para consultar el efecto que acaba de resolverse; todas las claves de `condition` deben cumplirse. Para exigir que cada elemento de una lista cumpla una condición, usa `{every: {...}}` en la clave que apunta a la lista. No uses `activation.<propiedad>` salvo que el payload realmente incluya ese campo.
- Para una respuesta posterior a que un personaje vinculado sufra daño efectivo, usa `TRIGGER_ATTACHED_TAKES_DAMAGE`; no se activa si todo el daño a ese personaje fue evitado o absorbido por Duro.
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

- `GetAttackEffect` procesa `TRIGGER_CHARACTER_GET_ATTACK`, `TRIGGER_YOUR_HERO_GET_ATTACK` y `TRIGGER_ATTACHED_GET_ATTACK`; `GetThwartEffect` procesa `TRIGGER_YOUR_HERO_GET_THWART`, `TRIGGER_THIS_GET_THWART` y `TRIGGER_ATTACHED_GET_THWART`; `GetDefenseEffect` procesa `TRIGGER_CONDITION_GET_DEFENSE` y `TRIGGER_YOUR_HERO_GET_DEFENSE`. Usa el trigger que corresponda para limitar cuándo aplica la bonificación; los triggers `TRIGGER_YOUR_HERO_GET_*` se limitan al héroe del jugador que controla la carta.
- Para una bonificación dinámica, apunta con `target: TARGET_EFFECT` al colector disponible en `params.effect`. `EFFECT_MODIFY_ATTACK_VALUE`, `EFFECT_MODIFY_THWART_VALUE` y `EFFECT_MODIFY_DEFENSE_VALUE` acumulan el cambio en `modifyAttack`, `modifyThwart` o `modifyDefense`; no cambies el atributo impreso ni una propiedad persistente del personaje para representar un modificador que solo aplica durante el cálculo.
- Si una capacidad inflige daño igual al ATQ de su personaje, configura `paramsCalc.formula: CALC_ATTACK` en `EFFECT_DEAL_DAMAGE` y apunta `paramsCalc.target` al personaje. `DealDamageEffect` resuelve sus parámetros antes de ejecutarse y delega el cálculo a `Calc`, que obtiene el ATQ con `CharacterGameCard.getAttackValue()` y aplica `plus`, `multiply` y `max`. Como `CALC_ATTACK` procesa triggers asíncronos, quien consuma el resultado de `Calc` debe esperarlo.
- Mantén las clases generales (`Ability`, `Effect` base y factorías) libres de ramas para tipos de efectos o cartas concretos. Usa hooks polimórficos genéricos en la infraestructura base y coloca la preparación específica de parámetros en la clase del efecto correspondiente; las fórmulas compartidas pertenecen a `Calc`.
- El modificador debe resolverse durante el trigger del cálculo correspondiente. Obtén el colector desde `params.effect` y suma allí el cambio (`params.effect.modifyX += delta`); no recorras cartas desde `Match` o `Player`, ni modifiques el valor impreso para aplicar un bonus temporal. En capacidades nuevas, configura `target` para indicar el objetivo y la identidad aplicable; usa `TARGET_EFFECT` solo cuando el propio efecto colector sea el objetivo, no para elegir entre héroe y alter ego.
- Los modificadores aditivos deben acumularse con `+=`; asignar con `=` puede reemplazar otros modificadores. Calcula los valores dinámicos con `this.calculate(params)` cuando se configure `paramsCalc` y valida que el resultado sea finito.
- `CALC_IF` elige `ifTrue` o `ifFalse` según la veracidad de `paramsCalc.target`; úsalo para calcular un único valor dinámico cuando una capacidad cambia la cantidad sin crear efectos separados.
- Declara el alcance mediante `target`: usa `TARGET_YOUR_SUPERHERO` para ambas identidades del jugador actual, `TARGET_YOUR_HERO` para su héroe, `TARGET_HERO` para el héroe de cualquier jugador o `TARGET_ALTEREGO` para su alter ego. No uses listas de identidades ni lógica específica de cada carta para decidir dónde aplica.
- Si el texto de una carta nombra al personaje que recibe una bonificación o palabra clave, resuelve ese personaje por `name`/identidad con un selector y `condition`; `TARGET_ALL_CHARACTERS` y `TARGET_ALL_FRIENDLY_CHARACTERS` comparan el `name` actual y el `mainName` estable. Si coincide el `mainName` de un superhéroe con varias caras, el objetivo resuelto es la cara cuyo nombre se indicó, no ambas, y el modificador solo aplica a esa cara. No infieras el objetivo a partir del controlador de la carta. Usa `TARGET_YOUR_SUPERHERO` para ambas caras solo si el texto dice "tu superhéroe". Para modificadores numéricos calculados, condiciona el trigger del colector al `name` del objetivo real en `effect.selectedTarget`, usando solo triggers que admita el colector.
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
- **Atributo igual a vida restante**: Para un aliado o esbirro cuyo atributo X sea igual a su vida restante, configura el atributo con `{formula: CALC_DAMAGE, target: TARGET_CARD, invert: true}`. `Calc` calcula `hitPoints - damage`, usando los puntos de vida máximos modificados y el daño acumulado actual. Sin `invert: true`, `CALC_DAMAGE` devuelve el daño acumulado, no la vida restante.
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
- Para varios efectos en frases secuenciales sin "Luego", envuélvelos en `EFFECT_CHAINED`. Mantén el orden escrito y omite los pasos que no puedan resolverse sin bloquear los siguientes.
- `EFFECT_CHAINED` continúa automáticamente después de un hijo que no puede resolverse; no configures `continueIfUnresolved`.
- Configura **Luego** con `thenEffect`. El efecto posterior solo se intenta si todos los efectos previos se resolvieron por completo; no uses una propiedad `matchAll`. Las cadenas usadas para pagar costes exigen que todos los costes puedan pagarse y se resuelvan.
- En un grupo `EFFECT_SIMULTANEOUS`, mantén independientes los efectos hijos. Si un hijo necesita el resultado de otro (por ejemplo, una carta elegida, un conteo descartado o una cantidad calculada por un paso previo), usa la composición secuencial o un único efecto calculado; no simules una dependencia como si fuera "y".

- `arrow` define los costes de una capacidad y se resuelve antes de `effect`. Para costes compuestos, usa `EFFECT_SIMULTANEOUS`; las cadenas existentes dentro de `arrow` se interpretan automáticamente como simultáneas, excepto las cadenas dentro de un `thenEffect`, que mantienen su orden. Declara en `outputParams` los valores del contexto que deban llegar al efecto principal (por ejemplo, `['selectedCard']`). Así, la transferencia de la carta elegida queda explícita en la configuración de la carta, no implícita en el motor de flechas.
- Para costes adicionales que dependen de una capacidad constante, usa `TRIGGER_ABILITY_COST` con `EFFECT_ADD_ADDITIONAL_COST`; no añadas campos de coste específicos a la configuración de la carta ni modifiques permanentemente el coste de la flecha. El coste se añade al pagar la flecha de la capacidad correspondiente, no al pagar el coste impreso de jugar la carta.
- El motor prepara primero las interrupciones de todos los efectos de coste. Recoge las selecciones de pago antes de aplicar cualquier coste; si quedan varios diálogos, pregunta cuál responder a continuación y reserva las cartas y generadores ya seleccionados. Después aplica todos los costes, resuelve sus respuestas y finalmente el efecto principal. Cancelar un diálogo descarta las selecciones antes de ejecutar los costes, por lo que no requiere deshacer sus efectos; la capacidad se vuelve a ofrecer. Si una interrupción impide pagar algún coste, aborta la capacidad sin volver a ofrecerla.
- Si pagar el coste descarta la carta que contiene la capacidad, la capacidad y su efecto principal siguen resolviéndose por completo. Conserva desde el inicio la identidad/controlador que la inició y no lo vuelvas a derivar del `controller` de la carta fuente después de pagar; la carta sí debe abandonar el juego normalmente. Si el efecto necesita después datos que se reinician al salir del juego, guárdalos antes de aplicar el coste.

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
- En toda lista de opciones mostrada al usuario, incluye un texto claro para cada opción: `title` en los parámetros de un efecto de `EFFECT_CHOOSE` y `name` en los parámetros de cada `ABILITY_OPTION` de `EFFECT_CHOOSE_ABILITY`.
- **"Puedes..."**: `EFFECT_MAY`.
- **Efectos al entrar en juego**:
    - **Perfidias y cartas con "Cuando se muestre"**: Usa siempre `ABILITY_WHEN_REVEALED` (o sus variantes por identidad).
    - **Obligaciones SIN "Cuando se muestre"**: Usa `ABILITY_CONSTANT` con `trigger: TRIGGER_INSTANT` dentro del array `abilities` en `params`. Además, el objeto `params` debe incluir `triggerInstant: true`. Este es un patrón específico del motor para gestionar la entrada de obligaciones que no tienen un efecto de revelación estándar.
- **"No puede ser objetivo"**: Usa `validation` en una `ABILITY_CONSTANT` con `EFFECT_CANNOT_TARGET` (ver Guía de Traducción).
- **Filtrado de Objetos (Filtros)**: Evita usar selectores de objetivo ultra-específicos si el efecto admite `filter` o `condition`. Filtra por tipo con la propiedad `type` y su constante (`type: CARD_TYPE_UPGRADE`), y por rasgos con `traits` (`traits: TRAIT_TECH`). Cuando un efecto tenga un campo de control documentado, usa `TARGET_YOU` en vez del literal `'you'`.
- **Cualquier jugador vs Cada jugador**:
    - Si el texto dice "cualquier jugador" (o si eliges uno): Usa `TARGET_ANY_PLAYER`.
    - Si el texto dice "cada jugador" (o todos): Usa `TARGET_ALL_PLAYERS`. Esto asegura que el motor ejecute el efecto secuencialmente para todos los participantes.
    - En `EFFECT_CHOOSE`, configura `players: TARGET_ALL_PLAYERS` para presentar la elección por separado a cada jugador y dirigir cada diálogo al jugador que debe responder.

## Instrucciones de Mantenimiento

1. **Auto-actualización**: Si al implementar una carta se identifica una necesidad que no cubren los efectos actuales, se debe investigar en `packages/mc-back/src/effects` si existe un archivo `.js` que corresponda. Si existe pero no está en esta guía, **DEBE** añadirse inmediatamente.
2. **Creación de Nuevos Efectos**: Si la funcionalidad es genuinamente nueva, se debe crear el archivo del efecto en `packages/mc-back/src/effects`, registrar el identificador en `packages/mc-shared/constants` (o donde corresponda) y en `EffectsFactory.js`.
3. **Consistencia**: Combina efectos secuenciales mediante `EFFECT_CHAINED` y efectos por lote mediante `EFFECT_SIMULTANEOUS`, en lugar de crear efectos ultra-específicos.
