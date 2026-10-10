import assert from 'node:assert/strict';
import {test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McSelectTargetDialog} = await import(
    '../src/components/dialog/mc-select-target-dialog/mc-select-target-dialog.js'
);

test('target selection dialog shows life without a damage label', () => {
    const dialog = Object.create(McSelectTargetDialog.prototype);

    assert.equal(dialog.defaultProperties.data.showLife, true);
    assert.equal(dialog.defaultProperties.data.showDamage, false);
});

test('target selection dialog hides OK because selecting a card responds immediately', () => {
    const dialog = Object.create(McSelectTargetDialog.prototype);
    const card = {id: 'minion-1'};
    let responseSent = false;
    dialog.sendResponse = () => {
        responseSent = true;
    };

    assert.equal(dialog.renderButtonOk().strings.join(''), '');

    dialog.handleCardListSelect({detail: {card}});

    assert.equal(responseSent, true);
    assert.deepEqual(dialog._response, {selected: card});
});
