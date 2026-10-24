import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    mcStaticRemote: {
        getAssetUrl: path => path,
    },
    customElements: {
        define() {},
    },
};

const {DECK_TYPES, DeckComponent} = await import(
    '../src/components/panels/mc-deck/mc-deck.js'
);

const getCardStack = template => template.values.find(value =>
    value?.strings?.join('').includes('<mc-card-image')
);

describe('Deck display', () => {
    test('renders an empty deck exactly like an empty discard', () => {
        const deck = Object.assign(Object.create(DeckComponent.prototype), {
            cards: [],
            knownCards: [],
            topCard: {image: 'heroes/doctor-strange/09032.png'},
            topCardFaceUp: true,
            type: DECK_TYPES.PLAYER,
            dragActivation: null,
            dragPlayCard: null,
        });
        const discard = Object.assign(Object.create(DeckComponent.prototype), {
            discard: [],
            type: DECK_TYPES.PLAYER,
            dragActivation: null,
            dragPlayCard: null,
        });
        const deckStack = getCardStack(deck.renderDeck());
        const discardStack = getCardStack(discard.renderDiscard());

        assert.ok(deckStack);
        assert.ok(discardStack);
        assert.deepEqual(deckStack.strings, discardStack.strings);
        assert.deepEqual(deckStack.values, discardStack.values);
    });
});
