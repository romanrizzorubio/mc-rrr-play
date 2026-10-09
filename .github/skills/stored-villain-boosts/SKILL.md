---
name: stored-villain-boosts
description: Implement facedown boost cards stored on the villain for a later activation and display them without revealing their identity.
---

# Stored villain boost cards

Use this pattern for text that gives the Villain a facedown boost card for a future activation. Do not use `EFFECT_DEAL_BOOST`, which adds a card to the activation currently resolving.

## Backend behavior

- Configure `EFFECT_STORE_BOOST` with the Villain as its target. It draws encounter cards and stores them as facedown cards linked to that Villain.
- Keep the stored cards marked as future boosts so other facedown cards on an enemy are not consumed accidentally.
- At the beginning of the next Villain activation, move stored cards into that activation's boost-card list before dealing its normal boost card. Resolve all cards in dealt order through the existing boost-resolution flow so values and boost abilities accumulate normally.
- Cards dealt by a boost ability while that list is resolving are appended to the same activation and must also resolve there, including their own boost abilities. Keep iteration live so newly appended cards are not skipped.
- Consume stored cards only when resolving an activation. A skipped activation leaves them stored. Do not start a separate activation to resolve a stored card.
- After resolution, use the regular boost-card discard/put-into-play handling.

## Presentation and tests

- Serialize pending cards without their face name or image. Pass their encounter-card type through the Villain presentation so the UI renders the encounter-card back.
- Display one back without a count; when multiple cards are pending, show a count for the grouped backs.
- Test that storage preserves the cards and their order, the next Villain activation resolves them before its normal card and consumes them, and the UI-facing serialization does not reveal their identity.
- Keep `EFFECT_DEAL_BOOST` tests for cards that add an increase to the current activation; stored boosts use a separate effect and lifecycle.
