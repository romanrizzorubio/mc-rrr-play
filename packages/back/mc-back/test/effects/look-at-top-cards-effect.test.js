import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_REVEAL_CARDS} from 'mc-shared';
import {Deck} from '../../src/model/match/deck.js';
import {LookAtTopCardsEffect} from '../../src/effects/look-at-top-cards-effect.js';

const card = id => ({
    id,
    toObj() {
        return {id: this.id};
    },
});

test('records looked-at cards on the deck and publishes them for viewing', async () => {
    const first = card('first');
    const second = card('second');
    const deck = new Deck({owner: {name: 'Player'}, isPlayerDeck: true});
    deck.cards = [first, second, card('third')];
    let refreshCount = 0;
    deck.refresh = async () => {
        refreshCount++;
    };
    const match = {
        scenario: {deck: {}},
        async openDialog(dialog) {
            assert.equal(dialog.dialogType, DIALOG_REVEAL_CARDS);
            assert.deepEqual(dialog.data.cards, [
                {id: 'first'},
                {id: 'second'},
            ]);
        },
    };
    const effect = new LookAtTopCardsEffect({
        count: 2,
        match,
        selectedTarget: deck,
    });

    await effect.execute({});

    assert.deepEqual(deck.knownCards, [first, second]);
    assert.deepEqual(deck.toObj().knownCards, [
        {id: 'first'},
        {id: 'second'},
    ]);
    assert.equal(refreshCount, 1);
});

test('only serializes known cards that are currently in the deck', () => {
    const first = card('first');
    const second = card('second');
    const deck = new Deck({owner: {name: 'Player'}});
    deck.cards = [first, second];
    deck.markKnown([first, second]);
    deck.cards = [second];

    assert.deepEqual(deck.toObj().knownCards, [{id: 'second'}]);
});

test('clears viewed-card knowledge when the deck is shuffled', () => {
    const first = card('first');
    const second = card('second');
    const deck = new Deck({owner: {name: 'Player'}});
    deck.cards = [first, second];
    deck.markKnown([first, second]);

    deck.shuffle();

    assert.deepEqual(deck.knownCards, []);
    assert.deepEqual(deck.toObj().knownCards, []);
});
