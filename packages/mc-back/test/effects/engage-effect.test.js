import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EngageEffect} from '../../src/effects/engage-effect.js';

const createScenarioDeck = (location, card) => {
    const deck = {
        cards: location === 'deck' ? [card] : [],
        discardPile: location === 'discardPile' ? [card] : [],
        removeCardFromDeck(cardToRemove) {
            this.cards = this.cards.filter(candidate => candidate !== cardToRemove);
        },
        searchDiscard(cardToRemove) {
            this.discardPile = this.discardPile.filter(candidate => candidate !== cardToRemove);
        },
        async refresh() {},
    };

    return deck;
};

for (const location of ['deck', 'discardPile']) {
    test(`EngageEffect moves a searched minion from the encounter ${location} into play`, async () => {
        const card = {
            damage: 2,
            isMinion: true,
            isInPlay: false,
            isPlayerCard: false,
            async initTriggers() {},
        };
        const scenario = {deck: createScenarioDeck(location, card)};
        card.owner = scenario;

        const player = {
            gameZone: {
                minions: [],
                engage(minion) {
                    this.minions.push(minion);
                },
            },
            engage(minion) {
                this.gameZone.engage(minion);
            },
            async refresh() {},
        };
        const effect = new EngageEffect({
            match: {scenario},
        });
        effect.selectedTarget = player;

        await effect.execute({player, selectedCard: card});

        assert.equal(scenario.deck.cards.includes(card), false);
        assert.equal(scenario.deck.discardPile.includes(card), false);
        assert.deepEqual(player.gameZone.minions, [card]);
        assert.equal(card.controller, player);
        assert.equal(card.engaged, player);
        assert.equal(card.damage, 0);
    });
}
