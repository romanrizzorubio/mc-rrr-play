---
name: marvel-champions-content-authoring
description: Parse user-provided Marvel Champions card text and author hero, scenario, encounter-set, and ability configurations using this project's existing effects.
---

# Marvel Champions content authoring

Use this skill when a user provides card text or structured card data and asks to create or update a hero, scenario, encounter set, or its abilities and effects.

## Source of truth and interpretation

- Treat the user's supplied text, values, icons, traits, card counts, and images as authoritative. Do not infer missing information from artwork or outside sources.
- Consult `.junie/guidelines/translation-guide.md` for the input formats, official terminology, resource-icon notation, and code mapping.
- Preserve rules-bearing punctuation and connectors. A period keeps sentence order but does not create a success gate; independent effects joined by "and" resolve simultaneously; "Then" gates on full resolution and uses `thenEffect`; "instead" replaces rather than adds an effect. A comma alone has no timing meaning.
- Pay the printed resource cost of a played card and all resource costs in its `arrow` simultaneously. Track payment by resource icon, not by whole card: a double-resource card can contribute one icon to each cost, and fixed costs consume only the icons assigned to their requirements. In simultaneous cost dialogs, let the player select individual icons; for variable `X` costs, the chosen icon count must not depend on which dialog they answer first. Keep unused icons available to later simultaneous costs, show only those remaining icons in the next payment dialog, and discard the physical card only once after all costs are committed. Compose arrow costs with `EFFECT_SIMULTANEOUS` when needed, and add a regression test when implementing a card with both costs.
- If an important value or rule interaction is missing or ambiguous, ask before choosing an interpretation. Do not invent card text, stats, traits, icons, keywords, or effects.
- For encounter cards with no supplied printed boost value, configure `boost: 0`; this does not omit a separately supplied Boost ability.
- Default booleans to `false`. Set them to `true` only when the text or rules explicitly require it. Do not infer that a later main-scheme stage is final.
- Store printed keyword flags under `params.keywords`, not as top-level card parameters.

## Authoring workflow

1. Identify whether each supplied card belongs to a hero, an aspect, a scenario, a modular encounter set, or a shared encounter-card definition. Inspect nearby catalog modules and tests before adding a new pattern.
2. Map the supplied facts into the existing card types, `params`, ability types, triggers, and effect types. Use domain constants imported from `mc-shared`; use `TARGET_*` constants for every field named `target`.
3. Prefer existing generic effects and compose them according to the card text. Do not create card-specific effect classes or branches in general abilities, effects, or factories. If required behavior is missing, implement a reusable effect and test it.
4. Keep card definitions and counts in the appropriate catalog. Reuse a shared encounter-card definition from `catalog/encounters/` when needed, but omit `params.set` there; use `withCardSet(card, set)` in each consuming catalog to assign its set, and configure its count in each owning catalog.
5. Add or update catalog/runtime tests for the content. Compile every configured ability and verify its `effect` is one runnable effect instance with a callable `canRun`; exercise runtime-dependent paths through the real ability or effect.

For repository-wide workflow and architectural requirements, also follow `.github/skills/repo-working-guidelines/SKILL.md`.

## Aspect card definitions

- Put aspect card definitions in the shared type module under `packages/back/mc-data/seed/catalog/aspects/<aspect>/`, such as `allies.js`, `events.js`, `supports.js`, or `upgrades.js`. Do not create hero-named aspect modules or define aspect cards in hero catalogs.
- A hero's `config.precon` may reference shared aspect-card IDs, but the card definitions themselves must not be tied to that hero.

## Hero definitions

- Add or update the hero under `packages/back/mc-data/seed/catalog/heroes/`, following a nearby hero module's structure.
- Keep the identity's two sides in `config.sides`, with the alter-ego and hero card types and their printed stats, traits, keywords, and abilities.
- Put the hero's fixed cards in `config.cards`, its deck references in `config.precon`, its obligation in `config.obligation`, and its full nemesis encounter set in `config.nemesis`.
- Use the hero's stable catalog ID and existing naming, image, and card-count conventions. Do not put hero-only setup into a scenario or a modular set.
- For nemesis-minion identification and the resolution of the remaining nemesis set, follow [Nemesis sets](#nemesis-sets).
- Test the hero's catalog normalization and card/ability construction; test runtime behavior for any newly implemented ability.

## Scenario definitions

- Add or update the scenario under `packages/back/mc-data/seed/catalog/scenarios/`, following an existing scenario module.
- Put the scenario's villains in `config.villains`, main-scheme sides in `config.mainSchemes`, and its own encounter cards in `config.cards`. Scenario-owned cards use the scenario's printed set name in their card `params.set`.
- **Never add the scenario's own ID as a set in `config.sets` or `config.defaultSets`.** The scenario's cards are already supplied by `config.cards`; `sets` and `defaultSets` reference separate registered encounter-set configurations, not the scenario itself.
- Keep `config.sets` and `config.defaultSets` limited to actual records in `packages/back/mc-data/seed/catalog/sets/`. Before finishing, verify every referenced set ID resolves to a registered set config. Do not add an empty or duplicate set just to satisfy an invalid scenario self-reference.
- Use `config.sets` / `config.defaultSets` for the separately configured encounter sets intended by the scenario, such as the Standard set and its modular set selection. Do not duplicate cards already in `config.cards`.
- Preserve printed card counts, images, and set names. Do not infer that the scenario's next stage is final or that a modular set is mandatory unless the supplied rules say so.
- Test the scenario's normalized config and actual scenario-creation path. Verify its own cards are included once and only valid registered encounter sets are loaded.

### Scenario auxiliary decks

- Put a required auxiliary-deck set in `config.sets`, not `config.defaultSets`; do not use `config.extraDecks` to reference it. Add an `ABILITY_SETUP` to the appropriate main-scheme side and use `EFFECT_CREATE_EXTRA_DECK` with that set's ID to move its cards from the encounter deck into a runtime auxiliary deck.
- Auxiliary scenario decks are shuffled during setup, displayed separately, and do not cycle or expose their own discard pile. Obtain a card with `EFFECT_GET_ENCOUNTER_CARD` using `from: PLACE_SCENARIO_EXTRA_DECK` and its configured `deckId`, then pass `effects.0.card` to `EFFECT_REVEAL_ENCOUNTER`. The reveal effect shows and resolves the supplied card without managing its source.
- Cards discarded from an auxiliary scenario deck go to the encounter deck's discard pile. Test setup separation, top-card reveal, discard routing, persistence, and the deck's discard-free presentation.

## Ability and effect composition

- Consult `.junie/guidelines/translation-guide.md`, `.junie/guidelines/effects-guide.md`, `.junie/guidelines/targets-guide.md`, and `docs/02-06-ABILITIES-EFFECTS.md` when mapping or changing card abilities.
- Add `LABEL_ATTACK` or `LABEL_THWART` only when the supplied card text explicitly labels the ability as `(attack)` or `(thwart)` (including localized equivalents such as `(ataque)` or `(intervención)`). Never infer these labels from damage, threat removal, targets, or effect types; without an explicit label in the text, leave them off.
- Use `EFFECT_CHAINED` for ordered or data-dependent effects and `EFFECT_SIMULTANEOUS` for independent effects joined by "and". Do not assign an array directly to `ability.effect`.
- During an enemy attack, stop the activation as soon as its attacker leaves play: do not resolve later attack steps or the attack-end triggers, and leave the attack unresolved. A defeated minion always stops its activation. If a defeated Villain advances to a same-title stage, treat that stage as the same attacker and continue with it; a different-title stage or a completed game stops the activation. Recheck after interrupt/response windows and each awaited attack step, and test minion defeat, same-title continuation, different-title transition, and final Villain defeat.
- For "look at the top N cards, discard one, and return the rest in any order," use the reusable `EFFECT_SELECT_AND_ORDER_TOP_CARDS` and explicitly select the deck with `target` (for example, `TARGET_ENCOUNTER_DECK`); do not discard the entire group or silently preserve its original order.
- For damage that ignores a Tough status without discarding it, configure `ignoreTough: true` on `EFFECT_DEAL_DAMAGE`; do not use Piercing, which consumes the Tough status.
- Use `CALC_DIFFERENT_CARD_TYPES` to count distinct printed types in a card list, and `match.inPlayCards` to count traits across all cards in play instead of rebuilding zone lists. A main-scheme attachment that raises its completion threshold uses `attach: TARGET_MAIN_SCHEME` and `threatThresholdModifier`.
- Put a "Then" clause in `thenEffect`; do not use it for ordinary ordered sentences. Model "if no effect occurred" fallbacks by attempting the effect and then checking its runtime result, not by prechecking whether a target exists.
- Use the correct ability timing and trigger for the printed text. Do not replace a forced ability with an optional one, or implement ongoing prohibitions as forced interrupts.
- A stunned hero or ally may attempt an attack without a legal enemy target, and a confused hero or ally may attempt a thwart without a legal scheme target. In either case, pay the attempt's costs (including exhaustion) and remove the matching status instead of resolving the attack/thwart; do not fabricate a target or resolve attack/thwart consequences.
- For a player-card ability that must apply while its source is in hand or while that card is being played from another supported location (for example, a printed reduction to its own play cost), set `workInHand: true` on that ability. `PlayCardEffect` ensures marked abilities are registered before calculating the cost; temporary triggers are removed if the play fails and the card returns outside the hand, while the trigger persists if the card enters play.
- For "exhaust one Ally you control," use the singular `TARGET_ALLY_YOU_CONTROL`; `TARGET_ALL_ALLIES_YOU_CONTROL` exhausts a group and is not interchangeable.
- Keep all effect configuration generic and target-driven. Preserve the selected target identified by the text; do not ask for an unrelated second selection.
- When an attachment continuously grants a keyword to each Villain attack, register an `ABILITY_CONSTANT` on `TRIGGER_VILLAIN_ATTACKS` and use `EFFECT_MODIFY_ATTACK` against `TARGET_EFFECT` with `modify: {keywords: {ranged: true}}`; do not model the keyword gain itself as a forced interrupt. Keyword modifiers merge so separate attachments preserve each other's keywords.
- When behavior depends on runtime paths such as `paramsCalc`, `targetCountCalc`, `condition`, `effectCondition`, `condition.exclude`, or `sourceIn`, add a regression test with the actual runtime context shape.
- Numeric keyword values support `[value, true]` for per-player scaling. Apply this consistently to numeric keywords, and verify `Uses` initializes the resulting counters and discards its card when the last counter is removed.
- Test changes to persistent scenario modifiers while their source is in play and after it leaves play.

### Defeat trigger selection

Choose a defeat trigger by identifying who/what the ability text says defeats the target. Do not confuse a card's own defeat with that card defeating a minion:

| Trigger | Meaning and use |
| --- | --- |
| `TRIGGER_THIS_DEFEAT` | The card that owns the ability is itself being defeated. This is not minion-only; use it for `ABILITY_WHEN_DEFEATED` and other abilities on the defeated card (for example, a side scheme or a minion). `DefeatEffect` dispatches it in the forced-response and forced-interrupt windows before the card leaves play. |
| `TRIGGER_THIS_DEFEAT_MINION` | The ability's source card matches `params.card` in the defeat-effect context, and `effect.selectedTarget` must be a minion. Use it when the text says that this character/card defeats a minion (for example, Tigra); do not use it for that source card's own "When Defeated" ability. |
| `TRIGGER_YOU_DEFEAT_MINION` | `effect.character` must match the player or their superhero, and the defeated target must be a minion. Use it for player/superhero-specific text such as "after you defeat a minion," rather than text tied to a particular ally or card. |
| `TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY` | The defeated target is an enemy and the defeating event is an attack initiated by your hero. Use only when the text specifically depends on your hero's attack defeating an enemy. |

Filter cards affected by the ability in its effect, not in the trigger. For example, a side scheme's "When Defeated" trigger remains `TRIGGER_THIS_DEFEAT`; its effect can separately filter discarded cards to Goblin minions.

## Cannot restrictions

- Treat "Cannot"/"No puede" as absolute; never make it optional with `EFFECT_MAY`.
- For ongoing restrictions, use `ABILITY_CONSTANT`. Do not use `ABILITY_FORCED_INTERRUPT` merely because the implementation checks an event before it resolves.
- If the restriction makes a card an illegal target, use `EFFECT_CANNOT_TARGET` in the constant ability's `validation`. Configure `effectTypes` or `effectCategories`; use `condition`, `targetCondition`, and `effectCondition` only for their documented scopes.
- For permission prohibitions, use `EFFECT_CANNOT` with the `restriction` key matching the permission context. Have the action check trigger constant abilities with that restriction initially allowed; do not add a separate collector just to carry the permission boolean.
- Scope a permission prohibition to its source with `sourceIn`, a path to a runtime collection that must contain the ability's source card. Prefer the generic `Trigger` over a subclass that only checks source membership or a named restriction. Test both a player whose collection contains the source and another whose collection does not.
- Ensure constant validations run for normal, preselected, and multi-target candidates before targets are shown or resolved.
- Test that a protected card is excluded when the condition is active, becomes a valid target when inactive, and does not exclude unrelated cards. If `condition`, `targetCondition`, or `effectCondition` reads runtime paths, test matching and non-matching values through the actual validation/target-resolution context.

## Effect target exclusions

- Prefer declarative `condition.exclude` paths over callbacks, card-specific fields, or effect-specific target filters.
- Configure `condition.exclude` with one runtime-context path or an array of paths. Use `*` to expand arrays, including results from earlier effects in an `EFFECT_CHAINED`.
- Example: to exclude players targeted by earlier attacks:

  ```js
  condition: {
      exclude: [
          'effects.0.attacks.*.selectedTarget',
          'effects.0.attacks.*.defender.owner',
      ],
  }
  ```

- Point paths to target objects, not only IDs; exclusion matches object identity or matching `id`.
- In every field named `target`, including `limit.target` and `maximum.target`, use a `TARGET_*` constant. Define limit/maximum scopes with `target`, never `time`. Add a `TARGET_*` alias in `mc-shared/constants/targets.js` if the needed scope has no constant. Effect `params.target` needs a resolver; limit/maximum scope targets are metadata and do not.
- A `limit` applies to its ability instance; a `maximum` aggregates matching card names. Do not branch on a particular selector in `ForEachEffect`; preserve normal target resolution order and filter its results.
- Validate that exclusion paths are non-empty strings. Test wildcard expansion, missing values, multiple paths, target matching, and the actual nesting of prior-effect results passed at runtime; a `path()` test or configuration assertion alone is insufficient. If route syntax or matching changes, update `.junie/guidelines/effects-guide.md` and its tests.

## Nemesis sets

- Keep the hero's complete nemesis encounter set in `config.nemesis`.
- If there is one minion, mark it with `params.nemesis: true`. If there are multiple minions, mark every minion whose printed parenthetical text identifies it as that hero's nemesis minion. Do not designate other minions based only on their inclusion in the set.
- When resolving Shadow of the Past, reveal every set-aside card matching `isMinion: true` and `isNemesis: true`, and reveal all nemesis side schemes.
- Move the remaining cards from the set-aside nemesis collection into the encounter deck and shuffle it. Use `EFFECT_INCLUDE_ASIDE_CARDS` followed by `EFFECT_SHUFFLE_DECK`, targeting `TARGET_SCENARIO`.
- Tie surge to whether a nemesis minion entered play, not to whether any set-aside card moved into the encounter deck.
- Test that every hero has a designated nemesis minion, that all printed nemesis minions are designated (including multiple-minion sets), and that Shadow of the Past reveals and shuffles the correct cards.

## Stored villain boosts

- For text that gives the Villain a facedown boost card for a later activation, use `EFFECT_STORE_BOOST` with the Villain as its target. Do not use `EFFECT_DEAL_BOOST`, which affects the activation currently resolving.
- Keep stored cards marked as future boosts so unrelated facedown cards on an enemy are not consumed accidentally.
- At the next Villain activation, move stored cards into that activation's boost list before its normal card. Resolve all boost cards in dealt order through the regular boost flow so printed values and boost abilities accumulate normally.
- Keep iteration live so boost abilities that append cards to the same activation resolve those cards too. Consume stored cards only when the activation resolves; a skipped activation leaves them stored.
- After resolution, use the regular boost-card discard/put-into-play handling.
- Serialize pending cards without face name or image, pass their encounter-card type through the Villain presentation, and render the encounter-card back. Display one back without a count and group multiple pending backs with a count.
- Test storage and order, resolution before the normal boost card, consumption, skipped activations, boost abilities that add cards, and identity-safe UI serialization.
