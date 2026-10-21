import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};

const {McDiscardHandDialog} = await import(
    '../src/components/dialog/mc-discard-hand-dialog/mc-discard-hand-dialog.js'
);

function createDialog(data = {}) {
    const dialog = Object.create(McDiscardHandDialog.prototype);
    dialog.data = data;
    dialog._response = {};
    dialog.initProperties();

    return dialog;
}

test('mandatory exact discard hides OK and responds after selecting the required cards', () => {
    const firstCard = {id: 'card-1'};
    const secondCard = {id: 'card-2'};
    const dialog = createDialog({
        cards: [firstCard, secondCard],
        count: 2,
    });
    let responseSent = false;
    dialog.sendResponse = () => {
        responseSent = true;
    };

    assert.equal(dialog.renderButtonOk().strings.join(''), '');

    dialog.handleCardListSelect({
        detail: {
            card: firstCard,
            cardIndex: 0,
        },
    });
    assert.equal(responseSent, false);

    dialog.handleCardListSelect({
        detail: {
            card: secondCard,
            cardIndex: 0,
        },
    });
    assert.equal(responseSent, true);
    assert.deepEqual(dialog._response.selected, [firstCard, secondCard]);
});

test('optional discards and discard-to-hand-size retain the OK button', () => {
    const optionalDiscard = createDialog({
        cards: [{id: 'card-1'}, {id: 'card-2'}],
        count: 2,
        upTo: true,
    });
    const handSizeDiscard = createDialog({
        cards: [{id: 'card-1'}, {id: 'card-2'}],
        hand: 1,
    });

    assert.match(optionalDiscard.renderButtonOk().strings.join(''), /Ok/);
    assert.match(handSizeDiscard.renderButtonOk().strings.join(''), /Ok/);
});
