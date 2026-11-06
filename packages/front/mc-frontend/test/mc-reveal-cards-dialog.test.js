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
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McRevealCardsDialog} = await import(
    '../src/components/dialog/mc-reveal-cards-dialog/mc-reveal-cards-dialog.js'
);

describe('McRevealCardsDialog selectable cards', () => {
    test('enables card clicks when the dialog marks its cards selectable', () => {
        const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
            data: {
                cards: [{id: 'encounter-1'}],
                selectable: true,
            },
        });

        assert.equal(dialog.renderContent().values[4], true);
    });

    test('returns a selected card from an interruptible batch', () => {
        const card = {id: 'encounter-1'};
        let responseCount = 0;
        const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
            data: {selectable: true},
            viewOnly: false,
            _response: {},
            sendResponse() {
                responseCount++;
            },
        });

        dialog.handleSelectCard({detail: {card}});

        assert.deepEqual(dialog._response, {selected: card});
        assert.equal(responseCount, 1);
    });

    test('keeps informational reveal cards non-selectable', () => {
        let responseCount = 0;
        const dialog = Object.assign(Object.create(McRevealCardsDialog.prototype), {
            data: {selectable: false},
            viewOnly: false,
            _response: {},
            sendResponse() {
                responseCount++;
            },
        });

        dialog.handleSelectCard({detail: {card: {id: 'encounter-1'}}});

        assert.equal(dialog._response.selected, undefined);
        assert.equal(responseCount, 0);
    });
});
