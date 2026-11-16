---
name: mc-add-scenario-card
description: Add a supplied encounter card to an existing scenario and verify its catalog and runtime behavior.
---

# Add a card to a scenario

Use this skill when the user invokes `/mc-add-scenario-card` or asks to add a scenario-owned encounter card to an existing scenario.

## Intake

1. Collect the scenario name or technical ID first. If missing, use `ask_user` to request it and resolve the scenario to one catalog record; ask if the name is ambiguous. Then collect the card data if it was not supplied.
2. Preserve the supplied card type, text, count, printed values, traits, symbols, image, and set name. For encounter cards, configure an omitted printed Boost value as `0`; do not infer other facts from artwork. Ask when required card data or the intended setup/deck location is unclear.
3. If the card is meant to be a separately selectable modular set rather than a scenario-owned card, use `/mc-create-modular` or an existing modular-set entry instead; clarify if ownership is ambiguous.

## Authoring workflow

1. Read `.github/skills/repo-working-guidelines/SKILL.md`, `.github/skills/mc-rrr-content-authoring/SKILL.md`, and any matching specialized skills. Consult relevant rules through `docs/README.md` and applicable `.junie/guidelines/`; treat official rules as read-only.
2. Inspect the selected scenario module, nearby scenario cards, the shared encounter-card definitions under `packages/back/mc-data/seed/catalog/shared/`, `with-card-set.js`, normalization, and relevant scenario/runtime tests.
3. Define the complete card as a named module-level `const` in the scenario module. For a card intended for the encounter deck, add it to `config.cards` as exactly `{count, card: cardConst}` and keep the array sorted by ascending numeric image code. Use `config.setAsideCards` only when the card starts outside the encounter deck, following the supplied setup instructions.
4. Assign the scenario's printed set using the existing scenario convention and supplied data. Do not add the scenario's own ID to `config.sets` or `config.defaultSets`; those fields reference separately registered encounter-set configurations. Reuse a shared definition through `withCardSet` rather than duplicating or mutating it.
5. Implement abilities with exported `mc-shared` constants and generic effects. Keep setup-specific behavior in the proper scenario card and timing window; implement a reusable runtime effect only if the existing engine cannot express the text.
6. Test normalized card data, exact copy counts and set name, image ordering, inclusion exactly once in scenario creation, and any new runtime behavior through the actual context. Keep all tests in each test file inside one `describe` block.
7. Run relevant tests and the backend suite with `npm test`; run `npm run lint` when code or tests change. Fix regressions before finishing and report the scenario card added.

For the Villain, main schemes, and setup-only scenario core, use `/mc-create-scenario`. For a fully selectable encounter set, use `/mc-create-modular`.
