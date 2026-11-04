import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';

describe('Deck cycling', () => {
    test('an empty player deck without a discard pile does not cycle while drawing', async () => {
        const match = new Match({name: 'empty-player-deck'});
        let dealtEncounterCards = 0;
        match.drawEncounterCards = async count => {
            dealtEncounterCards += count;
            return [];
        };
        const owner = {
            id: 'player',
            match,
            gameZone: {
                dealEncounterCard() {},
                async refresh() {},
            },
        };
        const deck = new Deck({owner, isPlayerDeck: true});
        owner.deck = deck;

        assert.deepEqual(await deck.draw(1), []);
        assert.equal(dealtEncounterCards, 0);
    });

    test('an empty player deck cycles and deals an encounter card when a discard arrives', async () => {
        const match = new Match({name: 'player-deck-waits-for-discard'});
        match.refresh = async () => {};
        let dealtEncounterCards = 0;
        match.drawEncounterCards = async count => {
            dealtEncounterCards += count;
            return [];
        };
        const player = {
            id: 'player',
            match,
            gameZone: {
                dealEncounterCard() {},
                async refresh() {},
            },
        };
        const deck = new Deck({owner: player, isPlayerDeck: true});
        deck.refresh = async () => {};
        player.deck = deck;
        const card = {id: 'player-discard', owner: player};

        await deck.checkCycle();
        assert.equal(dealtEncounterCards, 0);

        await deck.discard(card);

        assert.deepEqual(deck.cards.map(deckCard => deckCard.id), [card.id]);
        assert.deepEqual(deck.discardPile, []);
        assert.equal(dealtEncounterCards, 1);
    });

    test('an empty scenario deck waits for discard and applies its cycle penalty', async () => {
        const match = new Match({name: 'scenario-deck-waits-for-discard'});
        match.refresh = async () => {};
        const mainScheme = {
            isPlayer: false,
            accelerationTokens: 0,
            addAccelerationToken(count = 1) {
                this.accelerationTokens += count;
            },
            async refresh() {},
        };
        match.getMainSchemeFor = () => mainScheme;
        const scenario = {match, name: 'scenario'};
        const deck = new Deck({owner: scenario, isScenarioDeck: true});
        deck.refresh = async () => {};
        scenario.deck = deck;
        const card = {id: 'scenario-discard', owner: scenario};

        await deck.checkCycle();
        assert.equal(mainScheme.accelerationTokens, 0);

        await deck.discard(card);

        assert.deepEqual(deck.cards.map(deckCard => deckCard.id), [card.id]);
        assert.deepEqual(deck.discardPile, []);
        assert.equal(mainScheme.accelerationTokens, 1);
    });
});
