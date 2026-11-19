import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    PLACE_DECK,
    PLACE_DISCARD_PILE,
} from 'mc-shared';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McSelectCardDialog} = await import(
    '../src/components/dialog/mc-select-card-dialog/mc-select-card-dialog.js'
);

describe('McSelectCardDialog card groups', () => {
    const createDialog = () => {
        const dialog = Object.create(McSelectCardDialog.prototype);
        dialog.data = {};
        dialog._response = {};
        dialog.initProperties();

        return dialog;
    };

    test('renders selectable cards under their translated place labels', () => {
        const deckCard = {id: 'deck-card'};
        const discardedCard = {id: 'discarded-card'};
        const dialog = createDialog();
        dialog.data = {
            ...dialog.data,
            cards: [deckCard, discardedCard],
            count: 2,
            groups: [
                {place: PLACE_DECK, cards: [deckCard]},
                {place: PLACE_DISCARD_PILE, cards: [discardedCard]},
            ],
        };

        const template = dialog.renderContent();
        const groups = template.values[0];

        assert.deepEqual(
            groups.map(({values}) => values[0]),
            ['Mazo del jugador', 'Descarte del jugador']
        );
        assert.deepEqual(
            groups.map(({values}) => values[2].values[0]),
            [[deckCard], [discardedCard]]
        );
    });

    test('keeps selection behavior for cards rendered inside a group', () => {
        const card = {id: 'discarded-card'};
        const dialog = createDialog();
        dialog.data = {
            ...dialog.data,
            cards: [card],
            count: 2,
            groups: [{place: PLACE_DISCARD_PILE, cards: [card]}],
        };
        let responseSent = false;
        dialog.sendResponse = () => {
            responseSent = true;
        };

        dialog.handleCardListSelect({detail: {card}});

        assert.deepEqual(dialog._response.selected, [card]);
        assert.equal(responseSent, true);
    });
});
