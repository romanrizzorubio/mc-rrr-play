---
name: card-cannot-abilities
description: Implement Marvel Champions card text with an absolute "No puede"/"Cannot" restriction using constant abilities, validation, or prevention at the correct timing window.
---

# Implementing "No puede" card abilities

Consult `.junie/guidelines/translation-guide.md` and `docs/02-06-ABILITIES-EFFECTS.md#no-puede-cannot` before changing a prohibition.

## Choose the right model

- Treat "No puede"/"Cannot" as absolute. Never make it optional with `EFFECT_MAY`.
- For an ongoing restriction ("cannot ... while ... is in play"), use `ABILITY_CONSTANT`. Do not choose `ABILITY_FORCED_INTERRUPT` just because the implementation reacts before an event.
- If the restriction makes a card an illegal target, including "cannot take damage," put `EFFECT_CANNOT_TARGET` in the constant ability's `validation`. Select effect types with `effectTypes` or categories with `effectCategories`; optionally restrict affected cards with `targetCondition`. Use `condition` to require a matching card in play, `effectCondition` to inspect effect context, and omit both for an unconditional rule.
- Reserve forced interrupts for rules whose timing is actually an interrupt, not as a substitute for an ongoing target restriction.

## Implementation requirements

- Express the scope and any "while" condition explicitly. Reuse generic effects; do not add card-specific branches to `Ability`, `Effect`, or factories.
- When a prohibition is checked through action permission rather than target validity, use `EFFECT_CANNOT` with a `restriction` key matching the permission context. Have the action check trigger constant abilities with that restriction initially allowed; do not add a separate `Get*Effect` collector only to carry the permission boolean.
- Scope a permission prohibition to its source with `sourceIn`, a path to a runtime collection that must contain the ability's source card. Prefer this parameter with the generic `Trigger` over a trigger subclass that only checks source membership or a named restriction. Test both the player whose collection contains the source and another player whose collection does not.
- Ensure every target resolver, including preselected and multi-target lists, evaluates constant validations before presenting or resolving targets.
- Test that the protected card is excluded when the condition is active, becomes a valid target when it is inactive, and does not exclude unrelated cards.
- If `condition`, `targetCondition`, or `effectCondition` reads runtime context paths, test the validation through its real effect/target-resolution context with matching and non-matching values; configuration-only assertions do not verify that those paths are wired correctly.
