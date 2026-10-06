# Guía de Objetivos (Skill)

Esta guía describe los selectores de objetivo disponibles para las capacidades y los efectos del motor.

## Fuente de verdad

- Usa constantes `TARGET_*` importadas desde `mc-shared`; no escribas sus strings directamente en los módulos de catálogo JavaScript.
- Las constantes declaradas en `packages/mc-shared/constants/targets.js` no son necesariamente selectores resolubles. El motor solo reconoce como `params.target` los valores registrados en `targetMap`, compuesto en `packages/mc-back/src/targets/index.js`.
- Cada resolver devuelve una lista de candidatos. Un resultado vacío significa que no hay objetivo disponible.
- Las validaciones de las capacidades constantes se aplican a cada candidato antes de mostrar o resolver objetivos, incluidos los objetivos múltiples y preseleccionados. `EFFECT_CANNOT_TARGET` puede filtrar por tipo/categoría de efecto, presencia de cartas en juego y propiedades de la carta objetivo.
- `TARGET_CARD` es la carta recibida en el contexto de resolución; `TARGET_TRIGGERED_CARD` es la carta del evento que activó la capacidad; `TARGET_THIS` es `ability.card`. No son intercambiables.
- Si `params.target` se omite, `Effect` usa `TARGET_YOU`.
- Un array en `target` combina los resultados de sus selectores; no encadena selectores ni significa “elige la carta superior”.

## Selección de uno o varios candidatos

Que un selector devuelva varios candidatos no significa que el efecto se aplique a todos:

- Si devuelve cero, no hay objetivo válido.
- Si devuelve uno, el motor lo selecciona directamente.
- Si devuelve varios, normalmente se muestra el diálogo de selección de objetivo.
- `ValidTarget.isMultipleTarget()` resuelve todos los resultados, sin pedir una selección, para `TARGET_ALL_ALLIES`, `TARGET_ALL_ALLIES_YOU_CONTROL`, `TARGET_ALL_CARDS`, `TARGET_ALL_CHARACTERS`, `TARGET_ALL_CHARACTERS_YOU_CONTROL`, `TARGET_ALL_ENEMIES`, `TARGET_ALL_HEROES`, `TARGET_ALL_HEROES_ALLIES`, `TARGET_ALL_ENGAGED_MINIONS` y `TARGET_ALL_SCHEMES`. `multipleTarget` queda como opción interna para efectos que deban resolver varios candidatos de otro selector; las cartas deben usar el selector `TARGET_ALL_*` apropiado.

En particular, los nombres `TARGET_ALL_PLAYERS` y `TARGET_ALL_SIDE_SCHEMES` devuelven colecciones, pero no están en la lista de `isMultipleTarget`; por sí solos no significan que el efecto se aplique a todos.

## Selectores resolubles

### Básicos (`targets/basic.js`)

| Constante | Candidatos |
| :--- | :--- |
| `TARGET_ACTIVATION` | La activación actual. |
| `TARGET_CARD` | La carta de `params.card`. |
| `TARGET_EFFECT` | El efecto de `params.effect`. |
| `TARGET_EFFECT_PLAY_CARD` | El efecto de jugar una carta (`params.playCardEffect`). |
| `TARGET_INITIAL_PLAYER` | El jugador inicial de la partida. |
| `TARGET_PLAYER` | El jugador actual. |
| `TARGET_ROUND` | La ronda actual. |
| `TARGET_SCENARIO` | El escenario de la partida. |
| `TARGET_SOURCE` | El valor resuelto desde `params.source` como ruta sobre el contexto. La ruta debe producir una colección de candidatos. |
| `TARGET_THIS` | La carta de la capacidad: `ability.card`. |
| `TARGET_TRIGGERED_CARD` | La carta del evento que activó la capacidad, aunque `params.card` se reemplace por la carta que la posee. |
| `TARGET_YOU` | El jugador actual. |

### Grupos (`targets/groups.js`)

| Constante | Candidatos |
| :--- | :--- |
| `TARGET_ALL_CARDS` | Las cartas recibidas en `params.cards`. |
| `TARGET_ALL_ALLIES` | Todos los aliados en juego, controlados por cualquier jugador. |
| `TARGET_ALL_CHARACTERS` | Enemigos y personajes amigos de la partida. |
| `TARGET_ALL_ENEMIES` | Todos los enemigos. |
| `TARGET_ALL_HEROES` | Todos los superhéroes. |
| `TARGET_ALL_HEROES_ALLIES` | Todos los superhéroes y aliados. |
| `TARGET_ALL_PLAYERS` | Todos los jugadores. |
| `TARGET_ALL_SIDE_SCHEMES` | Todos los planes secundarios. |
| `TARGET_SELECTED_PLAYER_CHARACTERS` | Los personajes controlados por el jugador elegido previamente con `TARGET_ANY_PLAYER` dentro de una cadena de efectos. |
| `TARGET_CHARACTER` | Todos los personajes. |
| `TARGET_ENEMY` | Todos los enemigos. |
| `TARGET_HERO` | El lado héroe de cualquier jugador que esté en forma de héroe. |
| `TARGET_YOUR_HERO` | El lado héroe del jugador actual, solo si está en forma de héroe. |
| `TARGET_MINION` | Todos los esbirros. |
| `TARGET_VILLAIN` | El villano. |

### Cartas del jugador (`targets/player-controlled.js`)

| Constante | Candidatos |
| :--- | :--- |
| `TARGET_ALLY` | Los aliados del jugador actual. |
| `TARGET_ALL_ENGAGED_MINIONS` | Los esbirros enfrentados al jugador actual. |
| `TARGET_ALL_ALLIES_YOU_CONTROL` | Todos los aliados controlados por el jugador actual. |
| `TARGET_ALL_CHARACTERS_YOU_CONTROL` | El superhéroe y los aliados controlados por el jugador actual. |
| `TARGET_FRIENDLY_CHARACTER` | El superhéroe y los aliados del jugador actual. |
| `TARGET_SUPPORT_YOU_CONTROL` | Los apoyos que controla el jugador actual. |
| `TARGET_UPGRADE_YOU_CONTROL` | Las mejoras que controla el jugador actual. |

### Estado y lados de cartas (`targets/card-state.js`)

| Constante | Candidatos |
| :--- | :--- |
| `TARGET_ALTEREGO` | El jugador actual si está en forma de alter ego; en caso contrario, ninguno. |
| `TARGET_ALTEREGO_SIDE` | Los lados de alter ego de `params.card`. |
| `TARGET_ATTACHED` | La carta a la que está vinculada `ability.card`, si la hay. |
| `TARGET_ENGAGED` | El enemigo enfrentado a `params.card`. |
| `TARGET_ENGAGED_HERO` | El jugador enfrentado a `params.card`, solo si está en forma de héroe; devuelve ninguno si está en forma de alter ego. |
| `TARGET_HERO_SIDE` | Los lados de héroe de `params.card`. |
| `TARGET_OUTSIDE_NEMESIS` | Las cartas de archienemigo apartadas del juego del jugador actual. |
| `TARGET_SIDE` | Los otros lados de `params.card`, excluyendo el lado actual. |
| `TARGET_YOUR_SUPERHERO` | El superhéroe del jugador actual. |

### Objetivos en modificadores numéricos

En modificadores persistentes del personaje, usa `TARGET_YOUR_SUPERHERO` para ambas identidades del jugador actual, `TARGET_YOUR_HERO` para su lado héroe, `TARGET_HERO` para el lado héroe de cualquier jugador y `TARGET_ALTEREGO` para el alter ego del jugador actual. En cambio, `EFFECT_MODIFY_ATTACK_VALUE`, `EFFECT_MODIFY_THWART_VALUE` y `EFFECT_MODIFY_DEFENSE_VALUE` modifican un cálculo bajo demanda: configura `target: TARGET_EFFECT` para apuntar al colector en `params.effect`, que contiene `selectedTarget` y el acumulador `modifyAttack`, `modifyThwart` o `modifyDefense`. El trigger del colector determina cuándo aplica el cambio; no uses `TARGET_HERO` para apuntar al acumulador. Consulta la [guía de efectos](./effects-guide.md) para el flujo completo.

### Partida y encuentros (`targets/encounter.js`)

| Constante | Candidatos |
| :--- | :--- |
| `TARGET_ATTACKED` | El personaje atacado por el ataque actual, incluido el defensor elegido. Si se derrotó una etapa del villano y la siguiente tiene el mismo título, apunta a la etapa activa nueva. (La función auxiliar está en `utils/target-utils.js`.) |
| `TARGET_ALL_SCHEMES` | Todos los planes en juego, incluidos el principal y los secundarios. |
| `TARGET_CONDITION_CARD` | Las cartas de la partida que cumplen `condition`. |
| `TARGET_MAIN_SCHEME` | El plan principal. |
| `TARGET_MINION_HIGHEST_HP` | Los esbirros con la mayor vida actual; puede devolver varios si hay empate. |
| `TARGET_MINION_HIGHEST_PRINTED_HP` | Los esbirros elegibles con el mayor valor impreso de Vida; puede devolver varios si hay empate. |
| `TARGET_SCHEME` | Los planes de la partida. |

### Mazos y descartes (`targets/deck.js`)

| Constante | Candidatos |
| :--- | :--- |
| `TARGET_ENCOUNTER_DECK` | El mazo de encuentros como objeto de mazo. |
| `TARGET_ENCOUNTER_DECK_CARDS` | Las cartas del mazo de encuentros. |
| `TARGET_ENCOUNTER_DISCARD` | Las cartas del descarte de encuentros. |
| `TARGET_PLAYER_DISCARD` | Las cartas del descarte del jugador actual. |
| `TARGET_ANY_PLAYER` | Todos los jugadores, para seleccionar uno cuando corresponda. |

### Selector especial (`targets/special.js`)

| Constante | Candidatos |
| :--- | :--- |
| `TARGET_BY_TITLE` | Las cartas cuyo nombre coincide con `effect.title` y están en las ubicaciones indicadas por `effect.locations`; si una carta está representada por un lado, devuelve su carta padre y elimina duplicados. |

Para usarlo, configura `title` y una lista no vacía `locations` en los parámetros del efecto. No busca en ninguna ubicación implícita. `name` no configura `effect.title` y no sirve para este selector.

| Ubicación | Cartas consultadas |
| :--- | :--- |
| `PLACE_IN_PLAY` | Las cartas de las zonas de juego, planes y personajes de la partida. |
| `PLACE_SCENARIO_ZONE` | Las cartas de la zona del escenario, sus planes y el villano. |
| `PLACE_DECK` | Las cartas del mazo del jugador actual. |
| `PLACE_DISCARD_PILE` | Las cartas del descarte del jugador actual. |
| `PLACE_HAND` | Las cartas de la mano del jugador actual. |
| `PLACE_ENCOUNTER_DECK_CARDS` | Las cartas del mazo de encuentros. |
| `PLACE_ENCOUNTER_DISCARD` | Las cartas del descarte de encuentros. |
| `PLACE_PLAYER_ENCOUNTERS` | Las cartas de encuentro asignadas al jugador actual. |
| `PLACE_OUTSIDE_NEMESIS` | Las cartas de archienemigo apartadas del juego del jugador actual. |
| `PLACE_ASIDE_MATCH` | Las cartas apartadas por el escenario. |

```javascript
effect: {
    type: EFFECT_PLACE_THREAT,
    params: {
        target: TARGET_BY_TITLE,
        title: 'Legiones de Hydra',
        locations: [PLACE_SCENARIO_ZONE],
        threat: 2,
    }
}
```

## Posiciones de carta

`TARGET_TOP_CARD` no está registrado en `targetMap` y no debe usarse directamente como `params.target`. `GenerateResourcesFromCardEffect` lo acepta como `params.position` para seleccionar el último candidato del objetivo. Por ejemplo, para usar la carta superior del descarte como fuente de recursos:

```javascript
effect: {
    type: EFFECT_GENERATE_RESOURCES_FROM_CARD,
    params: {
        target: TARGET_PLAYER_DISCARD,
        position: TARGET_TOP_CARD,
    },
}
```

`Deck.getDiscardTop()` devuelve `discardPile[discardPile.length - 1]`. `Deck.discard()` agrega una carta al final (o concatena al final el orden elegido cuando descarta varias), por lo que la última carta del array es la superior del descarte.

## Constantes sin resolver como `params.target`

Las siguientes constantes están declaradas en `mc-shared`, pero no tienen un resolver en `targetMap`. No las uses directamente como `params.target` hasta implementar y registrar su resolver:

`TARGET_ANY`, `TARGET_ATTACK_UNDEFENDED`, `TARGET_HAND_RANDOM`, `TARGET_IDENTITY`, `TARGET_OWNER`, `TARGET_RANDOM` y `TARGET_TREACHERY`.

Algunas pueden tener significado en otros campos o condiciones. `TARGET_TOP_CARD` es la excepción documentada arriba: es un selector de posición para `GenerateResourcesFromCardEffect`, no un target general.

## Añadir un selector

1. Añade una constante estable `TARGET_*` en `packages/mc-shared/constants/targets.js`.
2. Implementa su resolver en el módulo apropiado de `packages/mc-back/src/targets/` y comprueba que devuelve una lista de candidatos.
3. Si debe resolver todos los candidatos, verifica si hace falta añadirlo a `ValidTarget.isMultipleTarget()`; no lo deduzcas únicamente por el nombre de la constante.
4. Documenta el selector aquí y úsalo en los catálogos mediante la constante importada de `mc-shared`.
