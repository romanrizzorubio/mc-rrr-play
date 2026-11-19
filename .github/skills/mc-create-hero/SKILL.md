---
name: mc-create-hero
description: Create a hero with its identity sides, fixed cards, references to existing precon cards, obligation, nemesis set, and regression tests.
---

# Create a hero

Use this skill when the user invokes `/mc-create-hero` or asks to add a new hero.

## Intake

1. First collect the visual hero name and technical ID as `Nombre visual (technical-id)`. If missing, use `ask_user` to request both before asking for card data. Use the visual name for the catalog display name and the technical ID for the catalog `_id`, module filename, and folder, following a nearby hero's catalog shape.
2. Normally request or process the hero's two identity sides, fixed hero-owned cards, and precon references to cards already in the catalog first. If only the names were supplied, ask for these definitions and references. Accept natural-language card data and incremental batches; do not duplicate existing catalog cards or invent missing printed data.
3. Then collect the hero's Obligation and complete nemesis set if they were not already provided. When using `ask_user`, request the Obligation first and the nemesis set in a separate question. Do not consider the new hero complete until the required hero data, precon, Obligation, and nemesis set are supplied or the user clarifies an exception.
4. Treat supplied text, stats, resources, traits, icons, images, and card counts as authoritative. For encounter cards, configure an omitted printed Boost value as `0`; do not infer other card data from artwork. Ask about other missing required information or ambiguous rules interactions.

## Authoring workflow

1. Read `.github/skills/repo-working-guidelines/SKILL.md`, `.github/skills/mc-rrr-content-authoring/SKILL.md`, and any matching specialized skills, especially `nemesis-set-handling`. Use `docs/README.md` to locate relevant rules and consult only relevant sections of `docs/` and `.junie/guidelines/`. Treat official game-rule documents as read-only.
2. Inspect nearby hero modules, shared player-card catalogs, catalog normalization, and hero/runtime tests. Follow the hero structure in `packages/back/mc-data/seed/catalog/heroes/`; do not put shared aspect/basic definitions in the hero module.
3. Define both identity sides and every complete hero-owned card as named module-level constants with descriptive English `camelCase` identifiers, regardless of the printed/localized card names. Keep the printed names localized as supplied. Put the sides in `config.sides`, fixed hero cards in `config.cards` entries shaped exactly `{count, card: cardConst}`, precon references in `config.precon`, the Obligation in `config.obligation`, and the full nemesis set in `config.nemesis`. Keep printed values and abilities in the card constants, not in catalog entry metadata.
4. Build `config.precon` from existing shared card IDs and their supplied copy counts, grouped under the appropriate aspect or basic category. Verify each referenced ID exists and avoid inline copies of those cards. Keep fixed hero cards separate from shared precon references. If the user supplies a new shared aspect/basic card instead of an existing reference, use `/mc-add-precon` for its catalog placement and precon integration.
5. Configure the Obligation as `{count: 1, card: obligationConst}` and the nemesis set as `{count, card}` entries. Follow the content-authoring Nemesis guidance to mark every minion identified by its printed parenthetical as a nemesis minion; do not mark other minions based only on membership in the set. Preserve the printed set name rather than assuming it is the technical hero ID.
6. Map abilities using exported `mc-shared` constants and generic effects. Preserve the supplied ability type, timing, connectors, and costs. Implement a reusable effect only if existing effects cannot express the behavior; test it through the real runtime context.
7. Inspect `config.deckBuildingRules` and the deck editor's shared validation before configuring a hero with special deck-construction rules. Prefer declarative rules consumed by `mc-shared`; do not add hero-ID branches to the editor or deck service. The reusable `offAspectCards` rule has `{maxCount, types, traits}`: it allows up to `maxCount` player-deck cards from unselected aspects that match one of `types` (when supplied) and at least one of `traits` (when supplied); basics and selected-aspect cards do not consume this allowance. Keep its eligibility, aggregate copy limit, editor visibility, user-facing explanation, and validation in sync, and test the rule at the shared-validator and deck-editor surfaces. If supplied special rules do not fit a supported declarative rule, add reusable support to the shared deck rules rather than a card-specific condition, and test legal and illegal deck cases.
8. Add focused tests for catalog normalization, both identity sides, fixed cards and counts, valid precon references and deck composition, Obligation, nemesis minion designation, special deck-building rules, and any new runtime behavior. Test each configured ability as one runnable effect instance with a callable `canRun`. Keep all tests in each test file inside one `describe` block.
9. Run relevant tests and the backend suite with `npm test`; run `npm run lint` when code or tests change. Resolve regressions before finishing. Report any missing card information instead of supplying guesses.

For interpretation of card text, precon rules, hero catalog conventions, and nemesis resolution, follow the linked skills and relevant guidelines. Do not create encounter scenarios or shared player-card definitions as part of this hero workflow unless separately requested.
