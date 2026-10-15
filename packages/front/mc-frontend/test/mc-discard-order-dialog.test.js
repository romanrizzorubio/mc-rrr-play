import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
    customElements: {
        define() {},
    },
};

const {McDiscardOrderDialog} = await import(
    '../src/components/dialog/mc-discard-order-dialog/mc-discard-order-dialog.js'
);
const {default: styles} = await import(
    '../src/components/dialog/mc-discard-order-dialog/mc-discard-order-dialog.css.js'
);

function createDialog(cards, data = {}) {
    const dialog = Object.create(McDiscardOrderDialog.prototype);
    dialog.data = {cards, ...data};
    dialog._response = {};
    dialog._dontAskAgain = false;
    dialog.initProperties();

    return dialog;
}

function templateText(template) {
    const values = template.values.map(value => {
        if (Array.isArray(value)) {
            return value.map(templateText).join(' ');
        }
        if (typeof value === 'string') {
            return value;
        }
        return value?.strings ? templateText(value) : '';
    });

    return [template.strings.join(' '), ...values].join(' ');
}

test('drag-and-drop changes the card order and confirms the full arrangement', () => {
    const cards = [
        {id: 'first', name: 'Primera', image: 'first.png'},
        {id: 'second', name: 'Segunda', image: 'second.png'},
        {id: 'third', name: 'Tercera', image: 'third.png'},
    ];
    const dialog = createDialog(cards);
    let responseSent = false;
    dialog.sendResponse = () => {
        responseSent = true;
    };

    dialog.handleDragStart('ordered', 0, {
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });
    let dropPrevented = false;
    dialog.handleDropOnOrdered(2, {
        preventDefault() {
            dropPrevented = true;
        },
        stopPropagation() {},
    });
    dialog._dontAskAgain = true;
    dialog.handleConfirmOrder();

    assert.equal(dropPrevented, true);
    assert.deepEqual(dialog._orderedCards.map(card => card.id), [
        'second',
        'third',
        'first',
    ]);
    assert.deepEqual(dialog._response, {
        selected: [cards[1], cards[2], cards[0]],
        skipDiscardOrderDialog: true,
    });
    assert.equal(responseSent, true);
});

test('moves a card to discard and reorders the cards returning to the deck', () => {
    const cards = [
        {id: 'first', name: 'Primera', image: 'first.png'},
        {id: 'second', name: 'Segunda', image: 'second.png'},
        {id: 'third', name: 'Tercera', image: 'third.png'},
    ];
    const dialog = createDialog(cards, {discardCount: 1, allowReorder: true});
    let responseSent = false;
    dialog.sendResponse = () => {
        responseSent = true;
    };

    dialog.handleConfirmOrder();
    assert.equal(responseSent, false);

    dialog.handleDragStart('ordered', 1, {
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });
    let dropPrevented = false;
    dialog.handleDropOnDiscard({
        preventDefault() {
            dropPrevented = true;
        },
        stopPropagation() {},
    });

    dialog.handleDragStart('ordered', 1, {
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });
    dialog.handleDropOnOrdered(0, {
        preventDefault() {},
        stopPropagation() {},
    });
    dialog.handleConfirmOrder();

    assert.equal(dropPrevented, true);
    assert.deepEqual(dialog._orderedCards.map(card => card.id), [
        'third',
        'first',
    ]);
    assert.deepEqual(dialog._discardedCards.map(card => card.id), ['second']);
    assert.deepEqual(dialog._response, {
        selected: [cards[2], cards[0]],
        discarded: [cards[1]],
        skipDiscardOrderDialog: false,
    });
    assert.equal(responseSent, true);
});

test('keeps the remaining cards in their original order when order prompts are disabled', () => {
    const cards = [
        {id: 'first', name: 'Primera', image: 'first.png'},
        {id: 'second', name: 'Segunda', image: 'second.png'},
        {id: 'third', name: 'Tercera', image: 'third.png'},
    ];
    const dialog = createDialog(cards, {
        discardCount: 1,
        allowReorder: false,
    });
    dialog.handleDragStart('ordered', 0, {
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });
    dialog.handleDropOnDiscard({
        preventDefault() {},
        stopPropagation() {},
    });

    dialog.handleDragStart('ordered', 1, {
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });
    dialog.handleDropOnOrdered(0, {
        preventDefault() {},
        stopPropagation() {},
    });

    assert.deepEqual(dialog._orderedCards.map(card => card.id), [
        'second',
        'third',
    ]);
    assert.deepEqual(dialog._discardedCards.map(card => card.id), ['first']);

    dialog.handleDragStart('discarded', 0, {
        dataTransfer: {
            effectAllowed: '',
            setData() {},
        },
    });
    dialog.handleDropOnOrdered(2, {
        preventDefault() {},
        stopPropagation() {},
    });

    assert.deepEqual(dialog._orderedCards.map(card => card.id), [
        'first',
        'second',
        'third',
    ]);
    assert.deepEqual(dialog._discardedCards, []);
});

test('explains discard-pile order and how to skip future order prompts', () => {
    const dialog = createDialog([
        {id: 'first', name: 'Primera', image: 'first.png'},
        {id: 'second', name: 'Segunda', image: 'second.png'},
    ]);
    const content = templateText(dialog.renderContent());

    assert.match(content, /orden en que se descartan/);
    assert.match(content, /más arriba en la pila de descartes/);
    assert.match(content, /No volver a preguntar por el orden de descarte/);
    assert.match(content, /remember-choice/);
});

test('shows a separate drop area for cards to discard', () => {
    const dialog = createDialog([
        {id: 'first', name: 'Primera', image: 'first.png'},
        {id: 'second', name: 'Segunda', image: 'second.png'},
    ], {discardCount: 1});

    const content = templateText(dialog.renderContent());
    assert.match(content, /discard-zone/);
    assert.match(content, /Descartar/);
    assert.doesNotMatch(content, /remember-choice/);
});

test('shows each card name only in the card header and enables wrapping', () => {
    const dialog = createDialog([
        {id: 'first', name: 'Una carta con un nombre muy largo', image: 'first.png'},
    ]);
    const cardTemplate = dialog.renderCard(
        dialog.data.cards[0],
        0,
        'ordered',
        'm'
    );
    const card = templateText(cardTemplate);
    const draggableIndex = cardTemplate.strings.findIndex(string =>
        string.includes('draggable="')
    );

    assert.match(card, /wrap-name/);
    assert.equal(cardTemplate.values[draggableIndex], true);
    assert.doesNotMatch(card, /activationActor/);
    assert.doesNotMatch(card, /ordered-card-name/);
});

test('aligns cards to the bottom in both dialog zones', () => {
    assert.match(
        styles.cssText,
        /\.ordered-cards\s*{[^}]*align-items:\s*flex-end/s
    );
    assert.match(
        styles.cssText,
        /\.discard-cards\s*{[^}]*align-items:\s*flex-end/s
    );
});

test('offers only the confirmation action in either order mode', () => {
    const cards = [
        {id: 'first', name: 'Primera', image: 'first.png'},
        {id: 'second', name: 'Segunda', image: 'second.png'},
    ];

    for (const data of [{}, {discardCount: 1}]) {
        const dialog = createDialog(cards, data);
        const buttons = templateText(dialog.renderButtons());

        assert.equal((buttons.match(/<md-text-button/g) || []).length, 1);
        assert.match(buttons, /Confirmar (?:orden|descarte y orden)/);
        assert.doesNotMatch(buttons, /Descartar las restantes en cualquier orden/);
    }
});
