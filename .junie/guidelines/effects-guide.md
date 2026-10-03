# Guía de Efectos (Skill)

Esta guía define los efectos disponibles en el motor del juego y proporciona criterios para elegir el efecto adecuado según el texto de la carta.

## Diccionario de Efectos Comunes

| Tipo de Efecto | Uso y Criterio de Selección |
| :--- | :--- |
| `EFFECT_ADD_TRAIT` | Para otorgar rasgos; dentro de un `EFFECT_LASTING`, el motor los quita al expirar. |
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
| `EFFECT_CHAINED` | Para ejecutar múltiples efectos en secuencia. |
| `EFFECT_RESOLVE_SPECIAL_ABILITY` | Selecciona y resuelve capacidades Especiales válidas en las cartas de `locations` que coincidan con `filter`. `resolveAll: true` repite hasta que no queden capacidades válidas; por defecto se resuelve solo una. |
| `EFFECT_LASTING` | Para registrar un efecto hasta un límite temporal y, opcionalmente, ejecutar una limpieza al expirar. |
| `EFFECT_MAY` | Para efectos opcionales ("Puedes..."). |
| `EFFECT_CHOOSE_ABILITY` | Para elegir entre varias opciones de una misma carta. |
| `EFFECT_PAY_PRINTED_COST` | Para pagar el coste impreso de la carta seleccionada con los recursos del jugador actual. |
| `EFFECT_MODIFY_ATTACK_VALUE` | Para modificar el valor de ATQ de forma temporal o permanente. |
| `EFFECT_MODIFY_THWART_VALUE` | Para modificar el valor de Intervención (INT). |
| `EFFECT_PUT_PLAY` | Para "poner en juego" una carta sin pagar su coste. |
| `EFFECT_REVEAL_ENCOUNTER` | Para "mostrar" una carta del mazo de encuentros. |
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

### Modificadores de valores numéricos

- Calcula cada valor bajo demanda con un efecto colector `Get*Effect` (por ejemplo, `GetAttackEffect`, `GetThwartEffect`, `GetDefenseEffect`, `GetHitPointsEffect` y `GetHandSizeEffect`). El colector declara los triggers del cálculo, inicializa un acumulador `modifyX` y obtiene el resultado sumando ese acumulador al valor base.
- El modificador debe resolverse durante el trigger del cálculo correspondiente. Obtén el colector desde `params.effect` y suma allí el cambio (`params.effect.modifyX += delta`); no recorras cartas desde `Match` o `Player`, ni modifiques el valor impreso para aplicar un bonus temporal. En capacidades nuevas, configura `target` para indicar el objetivo y la identidad aplicable; usa `TARGET_EFFECT` solo cuando el propio efecto colector sea el objetivo, no para elegir entre héroe y alter ego.
- Los modificadores aditivos deben acumularse con `+=`; asignar con `=` puede reemplazar otros modificadores. Calcula los valores dinámicos con `this.calculate(params)` cuando se configure `paramsCalc` y valida que el resultado sea finito.
- Declara el alcance mediante `target`: usa `TARGET_YOUR_SUPERHERO` para ambas identidades, `TARGET_HERO` solo para héroe o `TARGET_ALTEREGO` solo para alter ego. No uses listas de identidades ni lógica específica de cada carta para decidir dónde aplica.
- Para bonificaciones de ATQ o INT de un personaje vinculado, usa `TRIGGER_ATTACHED_GET_ATTACK` o `TRIGGER_ATTACHED_GET_THWART` y apunta con `TARGET_EFFECT` al efecto colector del atributo.
- Para aplicar modificadores a todos los personajes de un jugador elegido, usa `TARGET_SELECTED_PLAYER_CHARACTERS` en una cadena cuyo objetivo padre sea `TARGET_ANY_PLAYER`. Envuélvelos en `EFFECT_LASTING` para que la bonificación se limpie al expirar.
- Distingue los valores calculados del estado mutable: los puntos de vida máximos usan `GetHitPointsEffect` y la vida actual es el máximo menos el daño acumulado. El daño y la curación siguen modificando el estado mediante sus efectos; si un valor numérico aún no tiene colector, impleméntalo y añade su trigger antes de incorporar modificadores.

### Modificadores del tamaño de mano

- `Player.getHandSize()` usa `GetHandSizeEffect`; `ModifyHandSizeEffect` acumula el modificador en el efecto colector. Los flujos de robo, mulligan, descarte y serialización deben esperar este cálculo.
- `ModifyHandSizeEffect` usa `TARGET_YOUR_SUPERHERO` por defecto. Configura `TARGET_HERO` o `TARGET_ALTEREGO` explícitamente cuando el bonus solo aplique a una forma.

### Modificadores de vida máxima

- `Player.getHitPoints()` usa `GetHitPointsEffect`; `ModifyHitPointsEffect` acumula en el colector durante el trigger correspondiente. El cálculo se usa también para determinar la vida actual y comprobar derrotas.
- `ModifyHitPointsEffect` usa `TARGET_YOUR_SUPERHERO` por defecto; configura `TARGET_HERO` o `TARGET_ALTEREGO` explícitamente si el modificador solo aplica a una identidad.
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
- Para ejecutar varios efectos en secuencia, envuélvelos en `EFFECT_CHAINED`:

```javascript
effect: {
    type: EFFECT_CHAINED,
    params: {
        matchAll: true,
        effects: [
            {
                type: EFFECT_FLIP,
                params: {target: TARGET_YOUR_SUPERHERO}
            },
            {
                type: EFFECT_FILL_HAND
            }
        ]
    }
}
```

- Usa `matchAll: true` cuando todos los efectos de la cadena sean necesarios y deban poder ejecutarse para habilitar la capacidad.

- `arrow` define los costes de una capacidad y se resuelve antes de `effect`. Para costes compuestos, encadena efectos dentro de `arrow`; declara en `outputParams` los valores del contexto que deban llegar al efecto principal (por ejemplo, `['selectedCard']`). Así, la transferencia de la carta elegida queda explícita en la configuración de la carta, no implícita en el motor de flechas.

- Para seleccionar objetivos, utiliza los selectores documentados en la [Guía de Objetivos](./targets-guide.md).
- Para `TARGET_BY_TITLE`, configura `title` en los parámetros del efecto, no `name`: el selector compara `ability.effect.title` con el nombre de las cartas activas.
- **"Inflige X de daño"**: `EFFECT_DEAL_DAMAGE`.
- **"Quita X de amenaza"**: `EFFECT_REMOVE_THREAT`.
- **"Genera los recursos impresos en una carta"**: usa `EFFECT_GENERATE_RESOURCES_FROM_CARD` con un `target` que resuelva una carta o zona de cartas. Si el objetivo es una zona, especifica `position`; por ejemplo, combina `TARGET_PLAYER_DISCARD` con `TARGET_TOP_CARD` para seleccionar la carta superior del descarte del jugador. Se genera un recurso por cada icono impreso, incluyendo iconos repetidos. Obténlos con `card.card.getPrintedResources()` sin pasar la carta que se está pagando a `getResources(card)`, para no aplicar recursos adicionales condicionales del cuadro de texto de una carta de recurso (véase la regla de recursos impresos en `docs/02-01-FUNDAMENTALS.md`).
- `RESOURCE_ANY` representa un espacio de coste genérico: cada recurso generado, incluido uno universal, puede satisfacerlo. La validación de pago debe priorizar requisitos de recurso específicos antes de consumir espacios `RESOURCE_ANY`.
- **Pago de costes con recursos condicionales**: pasa la carta cuyo coste se paga a `player.spendResources(resources, cardToPay)` y serializa los recursos disponibles con `toObj({card: cardToPay})`. Así se evalúan sus condiciones contra la carta correcta: por ejemplo, **El poder del liderazgo** genera dos recursos al pagar un Aliado de Liderazgo y uno si el Aliado es de otro aspecto. `EFFECT_PAY_PRINTED_COST` debe además aplicar `PayCostEffect` a las cartas y generadores elegidos para completar el pago.
- **"Busca una carta y añádela a tu mano"**: encadena `EFFECT_SEARCH_CARDS` y `EFFECT_MOVE_TO_HAND` dentro de `EFFECT_CHAINED`. `EFFECT_SEARCH_CARDS` recibe `locations` (por ejemplo, `PLACE_DISCARD_PILE` o `PLACE_DECK`) y `filter`; guarda la carta elegida para que `EFFECT_MOVE_TO_HAND` la retire de su zona y la añada a la mano. Si la búsqueda es en el mazo y el texto lo indica, encadena también `EFFECT_SHUFFLE_DECK`. Para tomar la primera carta que cumpla el filtro recorriendo una pila desde arriba, usa `firstMatch: true`: en el descarte, comienza por la última carta añadida y sigue hacia las anteriores; en el mazo, comienza por la primera carta del array. La primera coincidencia se selecciona sin abrir un diálogo.

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
3. **Consistencia**: Siempre prefiere combinar efectos existentes mediante `EFFECT_CHAINED` antes que crear un efecto ultra-específico.
