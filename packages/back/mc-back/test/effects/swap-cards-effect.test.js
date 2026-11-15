import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DECK_POSITION_TOP,
    DIALOG_SELECT_TARGET,
    PLACE_DECK,
    PLACE_HAND,
} from 'mc-shared';
import {SwapCardsEffect} from '../../src/effects/swap-cards-effect.js';

const createCard = (id, owner) => ({
    id,
    name: id,
    owner,
    isEvent: false,
    isResource: false,
    abilities: [],
    toObj() {
        return {id: this.id, name: this.name};
    },
});

const createFixture = selectedId => {
    const dialogs = [];
    const match = {
        name: 'swap-cards-effect-test',
        triggerCards: {},
        async openDialog(dialog) {
            dialogs.push(dialog);
            return {selected: dialog.data.cards.find(card =>
                card.id === selectedId)};
        },
    };
    const player = {name: 'Peter Quill', match};
    player.hand = {
        cards: [],
        discardHand(card) {
            const index = this.cards.indexOf(card);
            if (index > -1) {
                this.cards.splice(index, 1);
            }
        },
        addCard(card) {
            this.cards.push(card);
        },
        async refresh() {},
    };
    player.deck = {
        isPlayerDeck: true,
        cards: [],
        discardPile: [],
        removeCardFromDeck(card) {
            const index = this.cards.indexOf(card);
            if (index === -1) {
                return false;
            }
            this.cards.splice(index, 1);
            return true;
        },
        async checkCycle() {},
        async refresh() {},
    };

    const firstHandCard = createCard('hand-first', player);
    const selectedHandCard = createCard('hand-selected', player);
    const topCard = createCard('deck-top', player);
    const nextCard = createCard('deck-next', player);
    player.hand.cards.push(firstHandCard, selectedHandCard);
    player.deck.cards.push(topCard, nextCard);

    const effect = new SwapCardsEffect({
        match,
        locations: [
            {type: PLACE_HAND, path: 'player.hand'},
            {
                type: PLACE_DECK,
                path: 'player.deck',
                position: DECK_POSITION_TOP,
            },
        ],
    });

    return {
        dialogs,
        effect,
        firstHandCard,
        match,
        nextCard,
        player,
        selectedHandCard,
        topCard,
    };
};

describe('SwapCardsEffect', () => {
    test('swaps a selected hand card with the configured top card of the deck', async () => {
        const {
            dialogs,
            effect,
            firstHandCard,
            match,
            nextCard,
            player,
            selectedHandCard,
            topCard,
        } = createFixture('hand-selected');
        const params = {match, player};

        assert.equal(await effect.canRun(params), true);
        await effect.execute(params);

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_SELECT_TARGET);
        assert.deepEqual(dialogs[0].data.cards.map(({id}) => id), [
            'hand-first',
            'hand-selected',
        ]);
        assert.deepEqual(player.hand.cards, [firstHandCard, topCard]);
        assert.deepEqual(player.deck.cards, [selectedHandCard, nextCard]);
        assert.deepEqual(effect.cards, [selectedHandCard, topCard]);
    });

    test('is unavailable when either configured source has no card', async () => {
        const {effect, match, player} = createFixture('hand-first');

        player.hand.cards.length = 0;
        assert.equal(await effect.canRun({match, player}), false);

        player.hand.cards.push(createCard('hand-card', player));
        player.deck.cards.length = 0;
        assert.equal(await effect.canRun({match, player}), false);
    });
});
