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

function createDialog(hand, wilds, overrides = {}) {
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
        ...overrides,
    };
    dialog._response = {
        paid: {
            generators: [],
            hand: [],
        },
    };

    return dialog;
}

test('automatically assigns wild resources to outstanding mandatory requirements and allows manual changes', () => {
    const wildCard = {
        id: 'wild',
        resources: [RESOURCE_WILD],
        selected: false,
    };
    const dialog = createDialog([wildCard], [], {
        allowPartial: false,
        cost: 1,
        requirement: [RESOURCE_ENERGY],
    });

    dialog._handlePaySelect({
        detail: {
            card: wildCard,
            type: 'hand',
        },
    });

    assert.deepEqual(dialog.data.wilds, [RESOURCE_ENERGY]);
    assert.equal(dialog.validate(), true);

    dialog._handleChangeWildResource({
        detail: {wilds: [RESOURCE_MENTAL]},
    });

    assert.deepEqual(dialog.data.wilds, [RESOURCE_MENTAL]);
    assert.equal(dialog.validate(), false);
});

test('automatically assigns every wild to the selected resource type for an X cost', () => {
    const wildCard = {
        id: 'wild',
        resources: [RESOURCE_WILD],
        selected: true,
    };
    const dialog = createDialog([wildCard], [], {
        cost: 'X',
        requirement: [],
        resourceType: RESOURCE_PHYSICAL,
    });

    assert.deepEqual(
        dialog.getAutomaticWilds(dialog.data.cards),
        [RESOURCE_PHYSICAL]
    );
});

test('preserves matching specific resources when assigning wilds to other requirements', () => {
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
    ], [], {
        requirement: [RESOURCE_ENERGY, RESOURCE_MENTAL],
    });

    assert.deepEqual(
        dialog.getAutomaticWilds(dialog.data.cards),
        [RESOURCE_MENTAL]
    );
});

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
