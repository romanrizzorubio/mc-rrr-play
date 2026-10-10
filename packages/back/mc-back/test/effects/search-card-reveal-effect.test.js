import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_OUTSIDE_NEMESIS,
} from 'mc-shared';
import {SearchCardAndRevealEffect} from '../../src/effects/search-card-reveal-effect.js';

test('SearchCardAndRevealEffect removes searched cards from their selected places', () => {
    const encounterDeckCards = [];
    const encounterDiscard = [];
    const nemesis = [];
    const match = {
        removeCardFromEncountersDeck(card) {
            encounterDeckCards.push(card);
        },
        scenario: {
            deck: {
                searchDiscard(card) {
                    const index = encounterDiscard.indexOf(card);
                    if (index > -1) {
                        encounterDiscard.splice(index, 1);
                    }
                },
            },
        },
    };
    const player = {superhero: {nemesis}};
    const deckCard = {id: 'deck-card'};
    const discardCard = {id: 'discard-card'};
    const nemesisCard = {id: 'nemesis-card'};
    const effect = new SearchCardAndRevealEffect({
        match,
        places: [],
    });

    encounterDiscard.push(discardCard);
    nemesis.push(nemesisCard);

    effect.removeRevealed(PLACE_ENCOUNTER_DECK_CARDS, [deckCard], player);
    effect.removeRevealed(PLACE_ENCOUNTER_DISCARD, [discardCard], player);
    effect.removeRevealed(PLACE_OUTSIDE_NEMESIS, [nemesisCard], player);

    assert.deepEqual(encounterDeckCards, [deckCard]);
    assert.deepEqual(encounterDiscard, []);
    assert.deepEqual(nemesis, []);
    assert.throws(
        () => effect.removeRevealed('unsupported-place', [], player),
        /Unsupported card search place/
    );
});
