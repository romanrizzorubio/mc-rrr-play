---
name: mc-add-nemesis
description: Add or update an existing hero's Obligation and nemesis encounter set from supplied card data.
---

# Add a hero's Obligation and nemesis set

Use this skill when the user invokes `/mc-add-nemesis` or asks to add an Obligation and nemesis cards to an existing hero.

## Intake

1. Collect the hero's name first. If it is missing, use `ask_user` to request it; resolve it to one catalog hero and ask if it is ambiguous. Then collect the Obligation and nemesis card data if not already supplied.
2. Accept the Obligation and any number of nemesis cards in batches. Preserve supplied types, names, printed text, values, traits, icons, images, and counts. For encounter cards, configure an omitted printed Boost value as `0`; do not infer other card data from artwork. Ask about missing required data or an ambiguous rules interaction.
3. If the hero already has an Obligation or nemesis entries, preserve them. Ask before replacing an existing Obligation or replacing the full nemesis set; append only when that matches the user's request.

## Authoring workflow

1. Read `.github/skills/repo-working-guidelines/SKILL.md`, `.github/skills/mc-rrr-content-authoring/SKILL.md`, and `.github/skills/nemesis-set-handling/SKILL.md`. Consult relevant rules through `docs/README.md` and applicable `.junie/guidelines/`; treat rule documents as read-only.
2. Inspect the existing hero module, Obligation and nemesis shapes, shared card definitions, and relevant catalog/runtime tests. Make changes only to the selected hero and directly required reusable card definitions or behavior.
3. Define complete card objects as named module-level constants. Store the Obligation in the hero's `config.obligation` as `{count: 1, card: obligationConst}`, and nemesis cards in `config.nemesis` as `{count, card}` entries. Preserve existing hero cards, precon references, and unrelated catalog data.
4. Follow the content-authoring Nemesis rules: mark `params.nemesis: true` on every Minion whose printed parenthetical identifies it as that hero's nemesis Minion; do not mark other Minions because they merely appear in the nemesis set. Preserve the supplied printed set and card properties.
5. Do not implement Shadow of the Past or nemesis-set resolution with card-specific branches. Follow the shared Nemesis guidance: reveal all designated nemesis Minions and nemesis side schemes, then include the remaining set-aside cards in the encounter deck and shuffle. Change runtime code only if the generic behavior is missing, and test that behavior rather than adding per-hero logic.
6. Test the hero's normalized Obligation and complete nemesis collection, all printed nemesis Minions' designation, and any new card abilities through real runtime context. Keep all tests in each test file inside one `describe` block.
7. Run relevant tests and the backend suite with `npm test`; run `npm run lint` when code or tests change. Resolve regressions before finishing and state whether existing cards were preserved or deliberately replaced.

For creating a new hero with its initial sides, fixed cards, and precon, use `/mc-create-hero`. Do not modify official rule documents.
