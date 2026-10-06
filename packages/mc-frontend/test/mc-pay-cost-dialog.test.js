import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McPayCostDialog} = await import(
    '../src/components/dialog/mc-pay-cost-dialog/mc-pay-cost-dialog.js'
);
const {McPayCost} = await import(
    '../src/components/panels/mc-pay-cost/mc-pay-cost.js'
);

function createDialog(hand, wilds) {
    const dialog = Object.create(McPayCostDialog.prototype);
    dialog.data = {
        allowPartial: true,
        cost: 3,
        requirement: [
            RESOURCE_ENERGY,
            RESOURCE_MENTAL,
            RESOURCE_PHYSICAL,
        ],
        wilds,
        cards: {
            generators: [],
            hand,
        },
    };

    return dialog;
}

test('a wild assigned to energy cannot also satisfy another resource requirement', () => {
    const dialog = createDialog([
        {
            id: 'energy',
            resources: [RESOURCE_ENERGY],
            selected: true,
        },
        {
            id: 'wild',
            resources: [RESOURCE_WILD],
            selected: true,
        },
    ], [RESOURCE_ENERGY]);

    assert.equal(dialog.validate(), false);

    dialog.data.wilds = [RESOURCE_MENTAL];

    assert.equal(dialog.validate(), true);
    assert.equal(dialog.isFullyPaid(), false);
});

test('one wild can be paid when it is the only available resource', () => {
    const dialog = createDialog([{
        id: 'wild',
        resources: [RESOURCE_WILD],
        selected: true,
    }], [RESOURCE_ENERGY]);

    assert.equal(dialog.validate(), true);
    assert.equal(dialog.isFullyPaid(), false);
});

test('an invalid OK click shows an explanation below the requirements', () => {
    const dialog = createDialog([
        {
            id: 'energy',
            resources: [RESOURCE_ENERGY],
            selected: true,
        },
        {
            id: 'wild',
            resources: [RESOURCE_WILD],
            selected: true,
        },
    ], [RESOURCE_ENERGY]);
    dialog.showValidationError = false;

    dialog.handleOk();

    assert.equal(dialog.showValidationError, true);
    const validationError = dialog.getValidationError();
    const panel = Object.create(McPayCost.prototype);
    panel.allowPartial = true;
    panel.cards = {generators: [], hand: []};
    panel.cost = 3;
    panel.isPaid = false;
    panel.requirement = [];
    panel.validationError = validationError;
    panel.renderResourceIcons = () => '';

    const template = panel.renderCost();
    const errorTemplate = template.values.find(value =>
        value?.strings?.join('').includes('class="payment-error"'));

    assert.ok(errorTemplate);
    assert.equal(errorTemplate.values[0], validationError);
});
