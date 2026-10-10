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

function createDialog() {
    const dialog = Object.create(McSelectTargetDialog.prototype);
    dialog.data = {};
    dialog._response = {};
    dialog.initProperties();

    return dialog;
}

test('target selection dialog shows life without a damage label', () => {
    const dialog = createDialog();

    assert.equal(dialog.defaultProperties.data.showLife, true);
    assert.equal(dialog.defaultProperties.data.showCounters, true);
    assert.equal(dialog.defaultProperties.data.showDamage, false);
});

test('target selection dialog passes counter and life labels to the card list', () => {
    const dialog = createDialog();
    const template = dialog.renderContent();
    const showGenericBinding = template.strings.findIndex(part =>
        part.includes('.showGeneric="'));
    const showLifeBinding = template.strings.findIndex(part =>
        part.includes('.showLife="'));

    assert.notEqual(showGenericBinding, -1);
    assert.notEqual(showLifeBinding, -1);
    assert.equal(template.values[showGenericBinding], true);
    assert.equal(template.values[showLifeBinding], true);
});

test('target selection dialog hides OK because selecting a card responds immediately', () => {
    const dialog = createDialog();
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
