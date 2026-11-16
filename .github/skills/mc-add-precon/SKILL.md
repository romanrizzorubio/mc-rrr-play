---
name: mc-add-precon
description: Add supplied player cards to the collection and include their catalog references in an existing hero precon.
---

# Add cards to a hero precon

Use this skill when the user invokes `/mc-add-precon` or asks to add new player cards to both the collection and an existing hero's preconstructed deck.

## Intake

1. Collect the hero's name first. If it is missing, use `ask_user` to request it and resolve it to one catalog hero; ask if it is ambiguous. Then collect the card data if it was not supplied.
2. Accept new cards in batches. For each, preserve the supplied printed text, values, symbols, traits, image, copy count, and intended aspect/basic/hero-specific classification. Ask when a missing value affects the configuration or when the card's category is unclear.
3. If a supplied card already exists in the catalog, reuse its ID rather than defining a duplicate. Counts in the precon describe deck copies; they are not a finite collection inventory.

## Authoring workflow

1. Read `.github/skills/repo-working-guidelines/SKILL.md`, `.github/skills/mc-rrr-content-authoring/SKILL.md`, and `.github/skills/mc-add-collection/SKILL.md` for shared-card placement conventions. The collection-only skill's instruction to keep a card out of precons does not apply to this task. Consult relevant rules through `docs/README.md` and applicable `.junie/guidelines/`; keep official game rules read-only.
2. Inspect the selected hero's `config.precon`, existing catalog entries, catalog normalization, deck-building tests, and nearby card definitions before editing.
3. Put shared aspect and basic card definitions in their existing shared catalog modules under `packages/back/mc-data/seed/catalog/aspects/`, with the required stable ID, category metadata, and `order` following that catalog's convention. Do not define a shared aspect/basic card in a hero module. For a fixed hero-owned card, use the hero's `config.cards`; do not add a duplicate shared definition or precon reference for a card that is already included as a fixed hero card.
4. Add references to the selected hero's `config.precon` using the existing category shape (`aspect` or basic `classification`) and `cardRefs: [{id, count}]`. Use the supplied deck copy counts and group entries according to the existing catalog pattern. Do not silently remove or rewrite existing precon cards to make room.
5. Verify the resulting deck composition against the applicable deck-building rules, including the total deck size, hero-specific fixed cards, aspect/basic restrictions, uniqueness, and any printed deck-building limits. If the supplied additions make the deck illegal or required counts are unclear, explain the conflict and ask before changing the requested composition.
6. Use exported `mc-shared` constants, existing generic effects, and the card-authoring skill's text interpretation. Add a reusable effect only if necessary, with runtime coverage.
7. Add focused tests for card catalog availability, precon references resolving to the intended cards, and the resulting deck composition. Exercise new abilities through actual runtime context and keep all tests in each test file inside one `describe` block.
8. Run relevant tests and the backend suite with `npm test`; run `npm run lint` when code or tests change. Fix regressions before finishing. Report which cards were added to the collection and which hero precon now references them.

If the user wants cards available in the collection but explicitly not included in any precon, use `/mc:add-collection` instead. Do not expand this task into unrelated precons or rule-document changes.
