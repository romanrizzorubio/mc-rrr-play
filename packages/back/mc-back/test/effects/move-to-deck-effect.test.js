import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DECK_POSITION_BOTTOM,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
} from 'mc-shared';
import {MoveToDeckEffect} from '../../src/effects/move-to-deck-effect.js';

const createFixture = position => {
    const firstMoved = {id: 'first-moved'};
    const secondMoved = {id: 'second-moved'};
    const initialTop = {id: 'initial-top'};
    const initialBottom = {id: 'initial-bottom'};
    const deck = {
        cards: [initialTop, initialBottom],
        discardPile: [firstMoved, secondMoved],
        shuffleCount: 0,
        addToDeck(cards) {
            this.cards.push(...cards);
        },
        searchDiscard(card) {
            const index = this.discardPile.indexOf(card);
            if (index !== -1) {
                this.discardPile.splice(index, 1);
            }
        },
        shuffle() {
            this.shuffleCount++;
            this.cards.reverse();
        },
    };
    const player = {deck, name: 'Kamala'};
    const effect = new MoveToDeckEffect({
        match: {name: 'move-to-deck-test'},
        ...(position ? {position} : {}),
    });

    return {deck, effect, firstMoved, player, secondMoved};
};

test('MoveToDeckEffect defaults to shuffling moved cards into the deck', async () => {
    const {deck, effect, firstMoved, player, secondMoved} = createFixture();

    await effect.execute({
        player,
        selectedCards: [firstMoved, secondMoved],
    });

    assert.deepEqual(deck.cards, [
        secondMoved,
        firstMoved,
        {id: 'initial-bottom'},
        {id: 'initial-top'},
    ]);
    assert.deepEqual(deck.discardPile, []);
    assert.equal(deck.shuffleCount, 1);
});

test('MoveToDeckEffect adds selected cards to the bottom when configured', async () => {
    const {deck, effect, firstMoved, player, secondMoved} =
        createFixture(DECK_POSITION_BOTTOM);

    await effect.execute({
        player,
        selectedCards: [firstMoved, secondMoved],
    });

    assert.deepEqual(deck.cards, [
        {id: 'initial-top'},
        {id: 'initial-bottom'},
        firstMoved,
        secondMoved,
    ]);
    assert.deepEqual(deck.discardPile, []);
    assert.equal(deck.shuffleCount, 0);
});

test('MoveToDeckEffect adds selected cards to the top in their selected order', async () => {
    const {deck, effect, firstMoved, player, secondMoved} =
        createFixture(DECK_POSITION_TOP);

    await effect.execute({
        player,
        selectedCards: [firstMoved, secondMoved],
    });

    assert.deepEqual(deck.cards, [
        firstMoved,
        secondMoved,
        {id: 'initial-top'},
        {id: 'initial-bottom'},
    ]);
    assert.deepEqual(deck.discardPile, []);
    assert.equal(deck.shuffleCount, 0);
});

test('MoveToDeckEffect shuffles moved cards into the deck', async () => {
    const {deck, effect, firstMoved, player, secondMoved} =
        createFixture(DECK_POSITION_SHUFFLE);

    await effect.execute({
        player,
        selectedCards: [firstMoved, secondMoved],
    });

    assert.deepEqual(deck.cards, [
        secondMoved,
        firstMoved,
        {id: 'initial-bottom'},
        {id: 'initial-top'},
    ]);
    assert.deepEqual(deck.discardPile, []);
    assert.equal(deck.shuffleCount, 1);
});

test('MoveToDeckEffect shuffles even when no cards were selected', async () => {
    const {deck, effect, player} = createFixture();

    await effect.execute({player, selectedCards: []});

    assert.deepEqual(deck.cards, [
        {id: 'initial-bottom'},
        {id: 'initial-top'},
    ]);
    assert.deepEqual(deck.discardPile, [
        {id: 'first-moved'},
        {id: 'second-moved'},
    ]);
    assert.equal(deck.shuffleCount, 1);
});

test('MoveToDeckEffect rejects unsupported positions', () => {
    assert.throws(
        () => new MoveToDeckEffect({
            match: {name: 'move-to-deck-test'},
            position: 'middle',
        }),
        {
            message: 'MoveToDeckEffect position must be one of: bottom, shuffle, top.',
            name: 'TypeError',
        }
    );
});
