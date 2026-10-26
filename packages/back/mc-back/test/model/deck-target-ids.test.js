import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Deck} from '../../src/model/match/deck.js';

describe('deck target identifiers', () => {
    test('assigns stable IDs to scenario and player decks', () => {
        const scenarioDeck = new Deck({
            owner: {name: 'Rhino'},
            isScenarioDeck: true,
        });
        const firstPlayerDeck = new Deck({
            owner: {id: 'Peter Parker', name: 'Peter Parker'},
            isPlayerDeck: true,
        });
        const secondPlayerDeck = new Deck({
            owner: {id: 'Carol Danvers', name: 'Carol Danvers'},
            isPlayerDeck: true,
        });

        assert.equal(scenarioDeck.id, 'scenario-deck');
        assert.equal(firstPlayerDeck.id, 'player-deck-Peter Parker');
        assert.equal(secondPlayerDeck.id, 'player-deck-Carol Danvers');
        assert.equal(scenarioDeck.toObj().id, scenarioDeck.id);
        assert.equal(firstPlayerDeck.toObj().id, firstPlayerDeck.id);
    });

    test('preserves an explicitly configured deck ID', () => {
        const deck = new Deck({
            id: 'custom-deck',
            isPlayerDeck: true,
            owner: {id: 'Peter Parker', name: 'Peter Parker'},
        });

        assert.equal(deck.id, 'custom-deck');
    });
});
