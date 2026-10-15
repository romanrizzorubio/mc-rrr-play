import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_DISCARD_ORDER,
    TARGET_ENCOUNTER_DECK,
} from 'mc-shared';
import {SelectAndOrderTopCardsEffect} from '../../src/effects/select-and-order-top-cards-effect.js';

test('requires an explicit target deck selector', () => {
    assert.throws(
        () => new SelectAndOrderTopCardsEffect({}),
        /requires a deck target selector/
    );
});

test('discards a selected top card and returns the rest in the chosen order', async () => {
    const first = {id: 'first', toObj: () => ({id: 'first'})};
    const second = {id: 'second', toObj: () => ({id: 'second'})};
    const third = {id: 'third', toObj: () => ({id: 'third'})};
    const deck = {
        cards: [first, second, third, {id: 'fourth'}],
        discardPile: [],
        knownCards: [],
        async draw(count) {
            return this.cards.splice(0, count);
        },
        markKnown(cards) {
            this.knownCards.push(...cards);
        },
        async discard(card) {
            this.discardPile.push(card);
        },
        async refresh() {},
    };
    const dialogs = [];
    const match = {
        skipDiscardOrderDialog: false,
        async openDialog({dialogType, data, subtitle}) {
            dialogs.push(dialogType);
            assert.equal(dialogType, DIALOG_DISCARD_ORDER);
            assert.equal(data.discardCount, 1);
            assert.match(subtitle, /izquierda.*superior del mazo/);
            assert.match(subtitle, /descartar/i);
            return {
                discarded: [{id: second.id}],
                selected: [{id: third.id}, {id: first.id}],
            };
        },
    };
    const effect = new SelectAndOrderTopCardsEffect({
        count: 3,
        match,
        selectedTarget: deck,
        target: TARGET_ENCOUNTER_DECK,
    });

    await effect.execute({});

    assert.deepEqual(dialogs, [DIALOG_DISCARD_ORDER]);
    assert.deepEqual(deck.cards, [third, first, {id: 'fourth'}]);
    assert.deepEqual(deck.knownCards, [third, first]);
    assert.deepEqual(deck.discardPile, [second]);
});

test('orders returned cards when the discard-order prompt preference is skipped', async () => {
    const first = {id: 'first', toObj: () => ({id: 'first'})};
    const second = {id: 'second', toObj: () => ({id: 'second'})};
    const third = {id: 'third', toObj: () => ({id: 'third'})};
    const deck = {
        cards: [first, second, third],
        discardPile: [],
        markKnown() {},
        async draw(count) {
            return this.cards.splice(0, count);
        },
        async refresh() {},
    };
    const match = {
        skipDiscardOrderDialog: true,
        async openDialog({dialogType, data}) {
            assert.equal(dialogType, DIALOG_DISCARD_ORDER);
            assert.equal(data.allowReorder, true);

            return {
                discarded: [{id: data.cards[1].id}],
                selected: [{id: data.cards[2].id}, {id: data.cards[0].id}],
            };
        },
    };
    const effect = new SelectAndOrderTopCardsEffect({
        count: 3,
        match,
        selectedTarget: deck,
        target: TARGET_ENCOUNTER_DECK,
    });

    await effect.execute({});

    assert.deepEqual(deck.cards, [third, first]);
    assert.deepEqual(deck.discardPile, [second]);
});

test('rejects a discard-and-order response that repeats a card', async () => {
    const first = {id: 'first', toObj: () => ({id: 'first'})};
    const second = {id: 'second', toObj: () => ({id: 'second'})};
    const deck = {
        cards: [first, second],
        discardPile: [],
        async draw(count) {
            return this.cards.splice(0, count);
        },
    };
    const effect = new SelectAndOrderTopCardsEffect({
        count: 2,
        match: {
            skipDiscardOrderDialog: false,
            async openDialog() {
                return {
                    discarded: [{id: first.id}],
                    selected: [{id: first.id}],
                };
            },
        },
        selectedTarget: deck,
        target: TARGET_ENCOUNTER_DECK,
    });
    effect.openDialog = async dialog => effect.match.openDialog(dialog);

    await assert.rejects(
        effect.execute({}),
        /invalid discard-and-order selection/i
    );
});
