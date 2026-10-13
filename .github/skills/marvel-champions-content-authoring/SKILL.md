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
- If an important value or rule interaction is missing or ambiguous, ask before choosing an interpretation. Do not invent card text, stats, traits, icons, keywords, or effects.
- For encounter cards with no supplied printed boost value, configure `boost: 0`; this does not omit a separately supplied Boost ability.
- Default booleans to `false`. Set them to `true` only when the text or rules explicitly require it. Do not infer that a later main-scheme stage is final.
- Store printed keyword flags under `params.keywords`, not as top-level card parameters.

## Authoring workflow

1. Identify whether each supplied card belongs to a hero, a scenario, a modular encounter set, or a shared encounter-card definition. Inspect nearby catalog modules and tests before adding a new pattern.
2. Map the supplied facts into the existing card types, `params`, ability types, triggers, and effect types. Use domain constants imported from `mc-shared`; use `TARGET_*` constants for every field named `target`.
3. Prefer existing generic effects and compose them according to the card text. Do not create card-specific effect classes or branches in general abilities, effects, or factories. If required behavior is missing, implement a reusable effect and test it.
4. Keep card definitions and counts in the appropriate catalog. Reuse a shared encounter-card definition from `catalog/encounters/` when the same printed card belongs to multiple sets; keep its printed set and image, and configure its count in each owning catalog.
5. Add or update catalog/runtime tests for the content. Compile every configured ability and verify its `effect` is one runnable effect instance with a callable `canRun`; exercise runtime-dependent paths through the real ability or effect.

For repository-wide workflow and architectural requirements, also follow `.github/skills/repo-working-guidelines/SKILL.md`.

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

## Ability and effect composition

- Consult `.junie/guidelines/translation-guide.md`, `.junie/guidelines/effects-guide.md`, `.junie/guidelines/targets-guide.md`, and `docs/02-06-ABILITIES-EFFECTS.md` when mapping or changing card abilities.
- Use `EFFECT_CHAINED` for ordered or data-dependent effects and `EFFECT_SIMULTANEOUS` for independent effects joined by "and". Do not assign an array directly to `ability.effect`.
- Put a "Then" clause in `thenEffect`; do not use it for ordinary ordered sentences. Model "if no effect occurred" fallbacks by attempting the effect and then checking its runtime result, not by prechecking whether a target exists.
- Use the correct ability timing and trigger for the printed text. Do not replace a forced ability with an optional one, or implement ongoing prohibitions as forced interrupts.
- Keep all effect configuration generic and target-driven. Preserve the selected target identified by the text; do not ask for an unrelated second selection.
- When behavior depends on runtime paths such as `paramsCalc`, `targetCountCalc`, `condition`, `effectCondition`, `condition.exclude`, or `sourceIn`, add a regression test with the actual runtime context shape.
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
