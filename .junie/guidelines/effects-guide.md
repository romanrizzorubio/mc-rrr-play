# Guía de Efectos (Skill)

Esta guía define los efectos disponibles en el motor del juego y proporciona criterios para elegir el efecto adecuado según el texto de la carta.

## Diccionario de Efectos Comunes

| Tipo de Efecto | Uso y Criterio de Selección |
| :--- | :--- |
| `EFFECT_DEAL_DAMAGE` | Cuando una carta "inflige daño" (deal damage). Es el efecto estándar de ataque. |
| `EFFECT_TAKE_DAMAGE` | Cuando un personaje "sufre daño" (take damage). Se usa para daño directo o costes. |
| `EFFECT_HEAL` | Para "curar" (heal) puntos de vida. |
| `EFFECT_MOVE_DAMAGE` | Para "mover daño" de un personaje a otro. |
| `EFFECT_PREVENT_DAMAGE` | Para "prevenir" o "evitar" daño que se va a recibir. |
| `EFFECT_REMOVE_THREAT` | Para "quitar amenaza" de planes. |
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
| `EFFECT_SEARCH_CARDS` | Para "buscar" cartas en el mazo o pila de descartes. |
| `EFFECT_MOVE_TO_HAND` | Frecuentemente encadenado con búsquedas para "añadir a la mano". |
| `EFFECT_SHUFFLE_DECK` | Para "barajar" el mazo. |
| `EFFECT_CHAINED` | Para ejecutar múltiples efectos en secuencia. |
| `EFFECT_MAY` | Para efectos opcionales ("Puedes..."). |
| `EFFECT_CHOOSE_ABILITY` | Para elegir entre varias opciones de una misma carta. |
| `EFFECT_MODIFY_ATTACK_VALUE` | Para modificar el valor de ATQ de forma temporal o permanente. |
| `EFFECT_MODIFY_THWART_VALUE` | Para modificar el valor de Intervención (INT). |
| `EFFECT_PUT_PLAY` | Para "poner en juego" una carta sin pagar su coste. |
| `EFFECT_REVEAL_ENCOUNTER` | Para "mostrar" una carta del mazo de encuentros. |
| `EFFECT_SURGE` | Para aplicar la palabra clave "Oleada". |

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

- **"Inflige X de daño"**: `EFFECT_DEAL_DAMAGE`.
- **"Quita X de amenaza"**: `EFFECT_REMOVE_THREAT`.
- **"Busca en tu mazo..."**: `EFFECT_SEARCH_CARDS` + `EFFECT_CHAINED` + `EFFECT_MOVE_TO_HAND` + `EFFECT_SHUFFLE_DECK`.
- **"Elige una opción:"**: `EFFECT_CHOOSE_ABILITY` con `options` de tipo `ABILITY_OPTION`.
- **"Puedes..."**: `EFFECT_MAY`.
- **Efectos al entrar en juego**:
    - **Perfidias y cartas con "Cuando se muestre"**: Usa siempre `ABILITY_WHEN_REVEALED` (o sus variantes por identidad).
    - **Obligaciones SIN "Cuando se muestre"**: Usa `ABILITY_CONSTANT` con `trigger: TRIGGER_INSTANT` dentro del array `abilities` en `params`. Además, el objeto `params` debe incluir `triggerInstant: true`. Este es un patrón específico del motor para gestionar la entrada de obligaciones que no tienen un efecto de revelación estándar.
- **"No puede ser objetivo"**: Usa `validation` en una `ABILITY_CONSTANT` (ver Guía de Traducción).
- **Filtrado de Objetos (Filtros)**: Evita usar selectores de objetivo ultra-específicos (como `TARGET_UPGRADE_YOU_CONTROL`) si el motor permite el uso de un campo `filter`. Es preferible definir el objetivo de forma genérica (ej: omitiendo `target` si el efecto asume cartas, o usando `TARGET_CARDS` si existe) y detallar las condiciones en un objeto `filter` (ej: `filter: { type: CARD_TYPE_UPGRADE, control: TARGET_YOU }`). **STRICTLY DO NOT** use string literals like `'you'` for control; use the constant `TARGET_YOU` instead. Esto hace que la lógica de la carta sea más clara y fácil de procesar para el motor.
- **Cualquier jugador vs Cada jugador**:
    - Si el texto dice "cualquier jugador" (o si eliges uno): Usa `TARGET_ANY_PLAYER`.
    - Si el texto dice "cada jugador" (o todos): Usa `TARGET_ALL_PLAYERS`. Esto asegura que el motor ejecute el efecto secuencialmente para todos los participantes.

## Instrucciones de Mantenimiento

1. **Auto-actualización**: Si al implementar una carta se identifica una necesidad que no cubren los efectos actuales, se debe investigar en `packages/mc-back/src/effects` si existe un archivo `.js` que corresponda. Si existe pero no está en esta guía, **DEBE** añadirse inmediatamente.
2. **Creación de Nuevos Efectos**: Si la funcionalidad es genuinamente nueva, se debe crear el archivo del efecto en `src/effects`, registrar la constante en `src/constants/back-cards.js` (o donde corresponda) y en `EffectsFactory.js`.
3. **Consistencia**: Siempre prefiere combinar efectos existentes mediante `EFFECT_CHAINED` antes que crear un efecto ultra-específico.
