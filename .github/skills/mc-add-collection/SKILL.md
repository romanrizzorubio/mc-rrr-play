---
name: "mc:add-collection"
description: Add a supplied player card to the collection without adding it to any preconstructed deck; implement its catalog configuration, effects, and tests.
---

# Add to collection without adding to a precon

Use this skill when the user supplies a card and asks to make it available in the card collection while keeping it out of every preconstructed deck (precon).

## Workflow

1. Read `.github/skills/repo-working-guidelines/SKILL.md` and `.github/skills/mc-rrr-content-authoring/SKILL.md`. Also read any matching specialized skill, such as `card-cannot-abilities`, `effect-condition-exclusions`, `nemesis-set-handling`, or `stored-villain-boosts`.
2. Read `docs/README.md` to locate the relevant rule documents. Consult only the applicable sections of those documents and the relevant `.junie/guidelines/` guides, especially the translation, effects, and targets guides. Treat rules and guidelines as read-only: do not modify `docs/` or `.junie/guidelines/`. Update a skill under `.github/skills/` only when the work reveals reusable guidance that needs to be recorded.
3. Treat the user's card text and supplied values as authoritative. Do not infer omitted text, costs, icons, stats, traits, copy counts, images, or behavior. Do not ask how many copies the user wants in their collection: shared aspect/basic cards are card-pool entries, not finite owned inventory, and deckbuilding rules govern how many can be added to a deck. Ask about missing information required by the card definition or its rules interaction, including a catalog copy count only when its schema actually requires one.
4. Inspect the catalog, nearby card definitions, normalization, and tests to choose the correct existing location:
   - Hero-specific cards belong in the relevant hero catalog, defined as a named card constant and referenced from `config.cards`.
   - Shared aspect and basic cards belong in their shared aspect/basic catalog modules, not in a hero-specific module.
   - Encounter cards belong to the appropriate scenario or encounter-set catalog. If the user expects an encounter card to be selectable as a player-deck card, clarify the intended card type and collection.
5. Add the card through the catalog path that makes it available to the collection. Keep its catalog configuration in the existing shape; only configure a copy count when that catalog schema requires one, and never use a finite count to represent collection availability. Reuse generic effects and exported domain constants; implement a reusable effect only if the existing effects cannot express the supplied text, and test that effect at runtime.
6. Keep the card out of every precon:
   - Do not add its ID to any `config.precon` or precon `cardRefs`.
   - Do not change a precon to make the card discoverable; verify collection availability through the catalog/collection path instead.
   - Search all precon definitions for the new card ID before finishing. If the ID already occurs in a precon, ask before removing or changing that existing deck list.
7. Add or update the smallest relevant tests. Cover catalog normalization and collection availability, confirm the card is absent from every precon, and exercise each new ability/effect through the real runtime context. Keep all tests in a test file inside one `describe` block, following repository guidance.
8. Summarize the catalog/configuration and effect changes, state that the card was not added to any precon, and confirm that rule documents were left untouched.

Do not silently expand the task into changing official precon lists, game rules, or unrelated catalog entries.
