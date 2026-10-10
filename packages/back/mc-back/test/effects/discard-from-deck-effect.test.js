import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CALC_RESOURCES, RESOURCE_ENERGY} from 'mc-shared';
import {Calc} from '../../src/engine/calc.js';
import {DiscardDrawEffect} from '../../src/effects/discard-draw-effect.js';
import {DiscardFromDeckEffect} from '../../src/effects/discard-from-deck-effect.js';
import {Deck} from '../../src/model/match/deck.js';

const createCard = (id, resources) => ({
    id,
    resources,
    toObj() {
        return {id};
    },
});

const createDeck = ({cards, discardPile = []}) => {
    let cycleCount = 0;
    const deck = new Deck({owner: {match: {}}});
    deck.cards = cards.slice();
    deck.discardPile = discardPile.slice();
    deck.shuffle = () => {};
    deck.refresh = () => {};
    deck.checkCycle = async function() {
        if (!this.cards.length) {
            cycleCount += 1;
            this.cycle();
        }
    };

    return {
        deck,
        getCycleCount: () => cycleCount,
    };
};

test('DiscardFromDeckEffect leaves cards in the discard pile until the deck cycles', async () => {
    const first = createCard('first', [RESOURCE_ENERGY]);
    const second = createCard('second', []);
    const third = createCard('third', []);
    const {deck, getCycleCount} = createDeck({cards: [first, second, third]});
    const effect = new DiscardFromDeckEffect({count: 2});
    effect.openDialog = async () => {};

    await effect.execute({player: {deck}});

    assert.deepEqual(effect.cards, [first, second]);
    assert.deepEqual(deck.cards, [third]);
    assert.deepEqual(deck.discardPile, [first, second]);
    assert.equal(getCycleCount(), 0);
});

test('DiscardFromDeckEffect stops after reshuffling a deck shorter than the requested count', async () => {
    const first = createCard('first', [RESOURCE_ENERGY]);
    const second = createCard('second', []);
    const reshuffled = createCard('reshuffled', [RESOURCE_ENERGY]);
    const untouched = createCard('untouched', []);
    const playerDeck = createDeck({cards: [untouched]}).deck;
    const encounterDeck = createDeck({
        cards: [first, second],
        discardPile: [reshuffled],
    });
    const effect = new DiscardFromDeckEffect({count: 5});
    effect.selectedTarget = encounterDeck.deck;
    effect.openDialog = async () => {};

    await effect.execute({player: {deck: playerDeck}});

    assert.deepEqual(effect.cards, [first, second]);
    assert.deepEqual(encounterDeck.deck.cards, [reshuffled, first, second]);
    assert.deepEqual(encounterDeck.deck.discardPile, []);
    assert.equal(encounterDeck.getCycleCount(), 1);
    assert.deepEqual(playerDeck.cards, [untouched]);

    const resources = new Calc({
        formula: CALC_RESOURCES,
        resourceType: RESOURCE_ENERGY,
        strict: true,
        target: 'effects.0.cards',
    }).calculate({effects: [effect]});
    assert.equal(resources, 1);
});

test('DiscardDrawEffect returns a cached match from the reshuffled deck', async () => {
    const card = createCard('cycle-card', [RESOURCE_ENERGY]);
    const {deck, getCycleCount} = createDeck({cards: [card]});
    const match = {
        openDialog: async () => ({}),
        triggerCards: {},
    };
    const handCards = [];
    const player = {
        match,
        hand: {
            addCards(cards) {
                handCards.push(...cards);
            },
            async refresh() {},
        },
        deck,
    };
    deck.owner = player;
    const effect = new DiscardDrawEffect({
        count: 2,
        condition: {id: card.id},
        match,
    });

    await effect.execute({player});

    assert.deepEqual(handCards, [card]);
    assert.deepEqual(deck.cards, []);
    assert.deepEqual(deck.discardPile, []);
    assert.equal(getCycleCount(), 1);
});
