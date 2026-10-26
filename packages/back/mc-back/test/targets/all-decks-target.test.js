import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_ALL_DECKS} from 'mc-shared';
import {targetMap} from '../../src/targets/index.js';
import {deckAndDeckTargets} from '../../src/targets/deck.js';

describe('TARGET_ALL_DECKS', () => {
    test('returns the encounter deck and every player deck in match order', () => {
        const encounterDeck = {cards: [{}], isScenarioDeck: true};
        const firstPlayerDeck = {cards: [{}], isPlayerDeck: true};
        const secondPlayerDeck = {cards: [{}], isPlayerDeck: true};
        const emptyDeck = {cards: [], isPlayerDeck: true};
        const match = {
            scenario: {deck: encounterDeck},
            players: [
                {deck: firstPlayerDeck},
                {deck: secondPlayerDeck},
                {deck: emptyDeck},
                {},
            ],
        };

        assert.deepEqual(deckAndDeckTargets[TARGET_ALL_DECKS]({match}), [
            encounterDeck,
            firstPlayerDeck,
            secondPlayerDeck,
        ]);
        assert.deepEqual(targetMap[TARGET_ALL_DECKS]({match}), [
            encounterDeck,
            firstPlayerDeck,
            secondPlayerDeck,
        ]);
    });
});
