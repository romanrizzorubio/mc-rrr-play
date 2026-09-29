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

## Mapeo de Acciones a Efectos

- **"Inflige X de daño"**: `EFFECT_DEAL_DAMAGE`.
- **"Quita X de amenaza"**: `EFFECT_REMOVE_THREAT`.
- **"Busca en tu mazo..."**: `EFFECT_SEARCH_CARDS` + `EFFECT_CHAINED` + `EFFECT_MOVE_TO_HAND` + `EFFECT_SHUFFLE_DECK`.
- **"Elige una opción:"**: `EFFECT_CHOOSE_ABILITY` con `options` de tipo `ABILITY_OPTION`.
- **"Puedes..."**: `EFFECT_MAY`.
- **"Cuando se muestre esta carta..."**: Usa **`ABILITY_WHEN_REVEALED`** (o sus variantes `ABILITY_WHEN_REVEALED_HERO` / `ABILITY_WHEN_REVEALED_ALTEREGO` si el efecto depende de la forma).
- **"No puede ser objetivo"**: Usa `validation` en una `ABILITY_CONSTANT` (ver Guía de Traducción).

## Instrucciones de Mantenimiento

1. **Auto-actualización**: Si al implementar una carta se identifica una necesidad que no cubren los efectos actuales, se debe investigar en `packages/mc-back/src/effects` si existe un archivo `.js` que corresponda. Si existe pero no está en esta guía, **DEBE** añadirse inmediatamente.
2. **Creación de Nuevos Efectos**: Si la funcionalidad es genuinamente nueva, se debe crear el archivo del efecto en `src/effects`, registrar la constante en `src/constants/back-cards.js` (o donde corresponda) y en `EffectsFactory.js`.
3. **Consistencia**: Siempre prefiere combinar efectos existentes mediante `EFFECT_CHAINED` antes que crear un efecto ultra-específico.
