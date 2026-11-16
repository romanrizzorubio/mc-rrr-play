---
name: mc-create-modular
description: Create a modular encounter set from supplied names and card data, implementing its catalog configuration, reusable effects, and regression tests.
---

# Create a modular encounter set

Use this skill when the user invokes `/mc-create-modular` or asks to create a new modular encounter set.

## Intake

1. First collect the set's visual name and technical ID together, in the form `Visual Name (technical-id)`. If the user has not supplied both, use `ask_user` to ask: “¿Cuál es el nombre visual y el nombre técnico del conjunto? Indícalos como `Nombre visual (technical-id)`.” Do this before requesting or authoring card data. Use the visual name as `config.name` and the technical ID as the catalog `_id`, filename, and each set card's `params.set`. Preserve a valid ID supplied by the user; ask before changing an invalid or conflicting ID.
2. Then collect the card data. Accept one or more cards per message and continue incrementally when the user supplies cards over multiple turns. If only the set names have been provided, use `ask_user` to request the card definitions; accept natural-language descriptions and never create placeholders or invent missing printed data.
3. Treat the user's card text, values, symbols, traits, images, copy counts, and card order as authoritative. Ask about information required by the catalog or an ambiguous rules interaction. Follow the existing convention that an omitted printed Boost value on an encounter card is `0`; do not infer other omitted values from artwork.

## Authoring workflow

1. Read `.github/skills/repo-working-guidelines/SKILL.md`, `.github/skills/mc-rrr-content-authoring/SKILL.md`, and any matching specialized skills for the supplied cards or mechanics. Use `docs/README.md` to locate the relevant official rules; consult only relevant sections of `docs/` and `.junie/guidelines/`. Treat official game-rule documents as read-only. Update a skill or development guide only when a reusable convention or a directly coupled implementation change requires it.
2. Inspect nearby modules under `packages/back/mc-data/seed/catalog/sets/`, shared encounter-card definitions under `packages/back/mc-data/seed/catalog/shared/`, `with-card-set.js`, and relevant catalog/runtime tests. The loader in `packages/back/mc-data/seed/catalog.js` discovers set modules recursively; do not add a separate registration or add the new set to a scenario's `sets` list.
3. Add the set at `packages/back/mc-data/seed/catalog/sets/<technical-id>.js`. Follow the existing exported record shape with `_id`, `config.name`, `standard: false`, and `config.cards`. Define each complete card as a named module-level `const` outside the exported catalog object. Keep each `config.cards` entry exactly `{count, card: cardConst}`; keep printed card data and abilities in the card constant and the supplied copy count in the entry. Set each card's printed set to the technical ID.
4. Reuse an existing shared encounter-card definition rather than duplicating it. Shared definitions omit `params.set`; import them and use `withCardSet(card, SET)` in the owning set to assign the set name without mutating the shared definition. Keep the copy count in the set's `{count, card}` entry.
5. Map supplied text using the existing card types, exported `mc-shared` constants, ability triggers, and generic effects. Preserve rules-bearing wording and timing. Prefer composing existing generic effects; if functionality is missing, implement a reusable effect rather than a card-specific branch in a general class or factory. Ask when rules and supplied text leave a consequential ambiguity.
6. Add focused catalog and runtime tests. Verify the set is loadable and normalized, its ID and visual name, card types, copy counts, printed set names, and every supplied card's configured data. Compile configured abilities and ensure each `ability.effect` is one runnable effect instance with a callable `canRun`. Exercise new behavior through the real runtime context, not only with configuration or path-string assertions. Put tests under `packages/back/mc-back/test/catalog/` or the most relevant existing test location; keep all tests in each test file inside one `describe` block.
7. Run the relevant tests and the repository backend suite with `npm test`; run `npm run lint` when code or tests change. Fix regressions rather than stopping at the first failing assertion. Do not finish while the relevant suite is failing.
8. Report the created set, card/effect/test changes, validation performed, and any unresolved missing card data. State that official rule documents were left untouched.

For interpretation of card text, reusable effect patterns, constants, and specialized mechanics, follow the linked skills and relevant `.junie/guidelines/`; this skill only specializes the intake and integration workflow for modular encounter sets.
