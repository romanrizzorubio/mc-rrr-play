---
name: nemesis-set-handling
description: Configure a superhero's nemesis encounter set, identify all nemesis minions, and shuffle the remaining set into the encounter deck.
---

# Handling nemesis encounter sets

Read the nemesis encounter set rules in `docs/02-03-CARD-TYPES.md` and consult `.junie/guidelines/translation-guide.md` before editing a hero's nemesis set.

## Designating nemesis minions

- Keep the hero's complete nemesis encounter set in its `config.nemesis` collection.
- If the set contains one minion, mark that minion with `params.nemesis: true`.
- If the set contains multiple minions, mark every minion with printed parenthetical text identifying it as that hero's nemesis minion with `params.nemesis: true`. If multiple minions carry that text, all of them are nemesis minions.
- Leave other minions at the default `nemesis: false`; do not mark them as nemesis minions based only on their inclusion in the set.

## Resolving Shadow of the Past

- Reveal all set-aside minions matching `isMinion: true` and `isNemesis: true`, and reveal all nemesis side schemes.
- Move the remaining cards in the hero's set-aside nemesis collection into the encounter deck, then shuffle the encounter deck. Use `EFFECT_INCLUDE_ASIDE_CARDS` followed by `EFFECT_SHUFFLE_DECK` targeting `TARGET_SCENARIO`; `ShuffleDeckEffect` obtains the encounter deck from the Scenario.
- Keep the surge condition tied to whether a nemesis minion entered play, not whether any set-aside card was moved to the encounter deck.

## Regression coverage

- Verify each hero has at least one designated nemesis minion.
- For a set with multiple minions, assert which printed minion(s) are designated and that the others are not.
- Verify `Shadow of the Past` reveals every designated minion and shuffles the remaining set into the encounter deck.
