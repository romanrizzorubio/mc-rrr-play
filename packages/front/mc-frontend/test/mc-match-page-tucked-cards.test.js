import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McMatchPage} = await import(
    '../src/pages/mc-match-page/mc-match-page.js'
);

test('selecting the tucked-card menu item opens the viewer event', () => {
    const card = {
        id: 'bruno',
        name: 'Bruno Carrelli',
        tuckedCards: [{id: 'stored-card'}],
    };
    const page = Object.assign(Object.create(McMatchPage.prototype), {
        dispatchEvent(event) {
            this.dispatchedEvent = event;
        },
    });
    const menuCallback = page.handleMenuOption(card);

    menuCallback({
        selected: {id: 'view-tucked-cards'},
    });

    assert.equal(page.dispatchedEvent.type, 'view-tucked-cards');
    assert.equal(page.dispatchedEvent.detail.card, card);
    assert.deepEqual(page.dispatchedEvent.detail.cards, card.tuckedCards);
});
