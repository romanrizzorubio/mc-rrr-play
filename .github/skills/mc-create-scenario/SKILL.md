---
name: mc-create-scenario
description: Create a scenario's Villains, main schemes, and only the encounter cards required by its setup, with catalog and runtime tests.
---

# Create a scenario

Use this skill when the user invokes `/mc-create-scenario` or asks to create a new scenario.

## Intake

1. First collect the visual scenario name and technical ID as `Nombre visual (technical-id)`. If missing, use `ask_user` to request both before asking for card data. Use the visual name for the outer catalog `name`; use the technical ID for `_id`, `folder`, and `config.name`, following nearby scenario records.
2. Then request or process the core scenario data: normal Villain stages, any distinct Expert Villain stages, paired A/B main-scheme sides, and only the scenario-owned cards needed during setup. Accept incremental card batches. If data is missing, ask only for the next missing category; do not bundle separate clarification questions or invent missing printed information.
3. Clarify which setup cards start outside the encounter deck, which begin in play or are searched for, and which encounter sets are required or recommended whenever the supplied rules do not make that clear. Do not add general scenario encounter cards that are not needed for setup; those can be added later with `/mc-add-scenario-card`.
4. Treat supplied scenario rules and card text as authoritative. For encounter cards, configure an omitted printed Boost value as `0`; do not infer other Villain stages, final stages, starting values, card counts, set selections, images, traits, or setup effects from artwork or precedent. Ask about consequential ambiguity.

## Authoring workflow

1. Read `.github/skills/repo-working-guidelines/SKILL.md`, `.github/skills/mc-rrr-content-authoring/SKILL.md`, and any matching specialized skills. Use `docs/README.md` to locate the relevant scenario, setup, and ability rules; consult only relevant sections of `docs/` and `.junie/guidelines/`. Treat official game-rule documents as read-only.
2. Inspect nearby modules under `packages/back/mc-data/seed/catalog/scenarios/`, relevant set records, scenario normalization, creation-path tests, and runtime tests.
3. Add the scenario under `packages/back/mc-data/seed/catalog/scenarios/<technical-id>.js`. Follow the existing scenario record shape and define every Villain stage, main-scheme side, and setup card as a named module-level `const`. Put Villain lists in `config.villains` and `config.expertVillains` as applicable. Pair each main scheme's A/B sides in `config.mainSchemes`; put setup instructions in the correct printed timing window.
4. Keep scenario-owned setup cards in `config.cards` when they belong in the encounter deck; use `config.setAsideCards` only for cards that begin outside the deck. Keep `config.cards` entries exactly `{count, card: cardConst}` and sort them by ascending numeric image code. Use generic setup effects and existing `mc-shared` constants; do not introduce scenario-specific branches into general effects or factories.
5. Keep `config.sets` and `config.defaultSets` limited to actual registered encounter sets required or recommended by supplied rules. Never include the scenario's own ID as an encounter set. Do not infer that a modular set is mandatory or that a later main-scheme side is final.
6. Reuse shared encounter cards when appropriate through the existing `catalog/shared/` definitions and `withCardSet`; do not duplicate or mutate shared card definitions. Preserve each card's printed set and the user's specified count.
7. Add tests for normalized scenario data, Villain progression and scheme pairs, setup-card locations and resolution, valid referenced sets, and the actual scenario-creation path. Test each new ability/effect through real runtime context; keep all tests in each test file inside one `describe` block.
8. Run relevant tests and the backend suite with `npm test`; run `npm run lint` when code or tests change. Fix regressions before finishing. Report any scenario cards intentionally deferred to `/mc-add-scenario-card`.

Use `/mc-add-scenario-card` to add other scenario-owned encounter cards after the core scenario is created. For encounter sets intended to be selected independently by scenarios, use `/mc-create-modular`.
