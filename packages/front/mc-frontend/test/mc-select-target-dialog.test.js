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

const {McSelectTargetDialog} = await import(
    '../src/components/dialog/mc-select-target-dialog/mc-select-target-dialog.js'
);
const {McListDialog} = await import(
    '../src/components/dialog/mc-list-dialog/mc-list-dialog.js'
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

test('list dialog displays counters when requested for an interrupt card', () => {
    const dialog = Object.create(McListDialog.prototype);
    dialog.data = {
        options: [],
        card: {
            counters: 2,
            image: 'aspect/protection/upgrades/05017.png',
            name: 'Barrera de energía',
        },
        showCounters: true,
    };
    dialog.initProperties();

    const template = dialog.renderContent();
    const cardTemplate = template.values.find(value =>
        Array.isArray(value?.strings) &&
        value.strings.some(part => part.includes('.generic=')));
    const genericBinding = cardTemplate?.strings.findIndex(part =>
        part.includes('.generic='));
    const showGenericBinding = cardTemplate?.strings.findIndex(part =>
        part.includes('.showGeneric='));

    assert.notEqual(genericBinding, undefined);
    assert.notEqual(genericBinding, -1);
    assert.notEqual(showGenericBinding, undefined);
    assert.notEqual(showGenericBinding, -1);
    assert.equal(cardTemplate.values[genericBinding], 2);
    assert.equal(cardTemplate.values[showGenericBinding], true);
});

test('list dialog does not render a card when the context has no image', () => {
    const dialog = Object.create(McListDialog.prototype);
    dialog.data = {
        options: [],
        card: {},
        showCounters: false,
    };

    const template = dialog.renderContent();

    assert.equal(template.values[0], '');
});

test('list dialog renders image options without visible status text', () => {
    const dialog = Object.create(McListDialog.prototype);
    const option = {
        id: 'stunned',
        image: 'status/stunned.webp',
        text: 'Aturdido',
    };
    dialog.data = {
        options: [option],
        card: {},
        showCounters: false,
    };

    const template = dialog.renderItem(option);
    const imageTemplate = template.values.find(value =>
        Array.isArray(value?.strings) &&
        value.strings.some(part => part.includes('option-image')));

    assert.ok(imageTemplate);
    assert.ok(imageTemplate.values.includes('images/cards/status/stunned.webp'));
    assert.ok(template.strings.join('').includes('md-list-item'));
});
