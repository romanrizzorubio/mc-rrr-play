import assert from 'node:assert/strict';
import {test} from 'node:test';

import {PLACE_DISCARD_PILE} from 'mc-shared';
import {SearchCardsEffect} from '../../src/effects/search-cards-effect.js';

const createCard = (id, name) => ({
    id,
    name,
    toObj() {
        return {id: this.id, name: this.name};
    },
});

test('SearchCardsEffect shows all copies but returns only one card per name', async () => {
    const cards = [
        createCard('first-copy', 'First card'),
        createCard('second-copy', 'First card'),
        createCard('third-card', 'Second card'),
    ];
    const player = {
        deck: {discardPile: cards},
        hand: {cards: []},
    };
    const effect = new SearchCardsEffect({
        count: 3,
        distinctNames: true,
        locations: [PLACE_DISCARD_PILE],
    });
    let dialog;
    effect.openDialog = async (options) => {
        dialog = options;
        return {
            selected: [
                {id: options.data.cards[0].id},
                {id: options.data.cards[1].id},
                {id: options.data.cards[2].id},
            ],
        };
    };
    const params = {player};

    await effect.execute(params);

    assert.equal(dialog.data.distinctNames, true);
    assert.deepEqual(dialog.data.cards.map(({name}) => name), [
        'First card',
        'First card',
        'Second card',
    ]);
    assert.deepEqual(params.selectedCards.map(({id}) => id), [
        'first-copy',
        'third-card',
    ]);
});
