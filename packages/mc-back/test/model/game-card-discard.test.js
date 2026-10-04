import assert from 'node:assert/strict';
import {test} from 'node:test';

import {GameCard} from '../../src/model/cards/game-card.js';

test('discarding an encounter card refreshes the scenario deck', async () => {
    const encounterDeck = {
        discardPile: [],
        async discard(card) {
            this.discardPile.push(card);
        },
        async refresh() {
            this.refreshed = true;
        },
    };
    const match = {
        scenario: {
            deck: encounterDeck,
            gameZone: {
                async discard() {},
            },
        },
        triggerCards: {},
    };
    const card = new GameCard({
        card: {
            id: 'encounter-card',
            isEncounterCard: true,
            isPlayerCard: false,
            match,
        },
    });

    await card.discard();

    assert.deepEqual(encounterDeck.discardPile, [card]);
    assert.equal(encounterDeck.refreshed, true);
});
