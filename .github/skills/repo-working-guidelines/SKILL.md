---
name: repo-working-guidelines
description: Check this repository's .junie guidelines and docs before making changes so work follows its conventions and project requirements.
---

# Repository working guidelines

Before working in this repository, consult the relevant guidance in `.junie/` and `docs/`.

- Check `.junie/` for applicable development rules and domain-specific guides. Follow the relevant guidelines when planning and implementing changes.
- Place reusable utility/helper modules in an appropriate `utils/` directory rather than beside feature-specific files; create the scoped directory when needed and update imports.
- Use `docs/README.md` as the documentation index, then read the documents relevant to the task to understand the intended behavior and architecture.
- When adding or editing card abilities, consult `.junie/guidelines/translation-guide.md`, `.junie/guidelines/effects-guide.md`, and the relevant rules in `docs/02-06-ABILITIES-EFFECTS.md`.
- Label every user-facing choice clearly: use `title` for effect options and `name` for `ABILITY_OPTION` abilities.
- When changing card, discard, or modal presentation, consult `.junie/guidelines/card-display-guide.md`.
- Treat card text and structured data supplied by the user as the source of truth. Do not infer icons, attributes, traits, or effects from artwork; ask when an important rule interaction is ambiguous.
- Default boolean configuration and state to `false`; set a boolean to `true` only when explicitly required by the card text, rules, or user. Do not infer that a later scenario stage is final.
- For scenario abilities that grant persistent values while a card is in play, verify the granted value is applied to the actual character and stops applying when its source leaves play.
- For enemy activations with multiple boost cards, verify the activation resolves every card in dealt order and adds all printed boost values before calculating attack damage or scheme threat.
- Apply the operator decision table in the effects guide before choosing a composition: periods preserve sentence order without creating a `Then` gate; independent effect clauses joined by `and` resolve simultaneously; `Then` gates on full resolution and belongs in `thenEffect`; `instead` replaces rather than adds an effect; a comma alone has no timing meaning; `additional` modifies the effect it qualifies.
- Use `EFFECT_CHAINED` for ordered or data-dependent steps and `EFFECT_SIMULTANEOUS` for independent effects joined by `and`; never assign an array directly to `ability.effect`. Consult `.junie/guidelines/targets-guide.md` when selecting or adding target selectors. Ensure each configured `ability.effect` resolves to one effect instance with a callable `canRun`.
- Keep general classes such as `Ability`, the base `Effect`, and factories free of branches for concrete cards or effect types. Put effect-specific parameter preparation in the concrete effect class and shared formula calculations in `Calc`.
- Preserve an ability's initiating character/controller for its full resolution, snapshotting that context before paying arrow costs. A cost may discard the ability's source card; this must not prevent the remaining effect from resolving. Do not keep the card in play artificially, and save any source-card values needed after payment before the cost removes it. Add a regression test for a self-discarding source.
- Read only the files relevant to the task; do not assume a guideline or specification that you have not checked.
- If guidance or documentation leaves an important behavior ambiguous, ask before making a consequential design choice.
