import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_PAYMENT_MODE_DISCARD,
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
const {McResource} = await import(
    '../src/components/common/mc-resource/mc-resource.js'
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
        resourcePreferences: [],
        exclusiveResourcePreferences: [],
        resourceSelectionMode: false,
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

test('keeps a wild resource changeable without a separate unit selector', () => {
    const wildCard = {
        id: 'wild',
        resources: [RESOURCE_WILD],
        selected: false,
    };
    const dialog = createDialog([wildCard], [], {
        allowPartial: false,
        cost: 1,
        requirement: [],
        resourcePreferences: [RESOURCE_ENERGY],
        resourceSelectionMode: true,
    });

    dialog._handlePaySelect({
        detail: {card: wildCard, type: 'hand'},
    });
    const key = dialog.getPaymentResourceUnits(
        dialog._response.paid,
        true,
        []
    ).map(unit => dialog.getResourceUnitKey(unit))[0];
    dialog._selectedResourceKeys = [key];

    dialog._handleChangeWildResource({
        detail: {wilds: [RESOURCE_MENTAL]},
    });

    assert.deepEqual(dialog.data.wilds, [RESOURCE_MENTAL]);
    assert.deepEqual(dialog._selectedResourceKeys, [key]);
    assert.deepEqual(dialog.resourcesConverted, [RESOURCE_MENTAL]);

    const panel = Object.create(McPayCost.prototype);
    panel.resourceSelectionMode = true;
    panel.selectedResources = [key];
    const wildUnit = {
        source: 'hand',
        cardId: wildCard.id,
        resourceIndex: 0,
        wildIndex: 0,
    };
    const rendered = panel.renderResourceIcon(
        RESOURCE_ENERGY,
        false,
        true,
        wildUnit
    );

    assert.match(rendered.strings.join(''), /<mc-resource/);
    assert.doesNotMatch(rendered.strings.join(''), /resource-unit/);
    assert.equal(rendered.values.includes('✓'), false);
});

test('changeable wild resource icons show an interactive cursor', () => {
    const resource = Object.create(McResource.prototype);
    resource.resource = RESOURCE_ENERGY;
    resource.disabled = false;
    resource.notChange = false;

    const rendered = resource.renderWild();

    assert.ok(rendered.values.includes('changeable'));
});

test('changing one of multiple assigned wilds preserves the other assignment', () => {
    const panel = Object.create(McPayCost.prototype);
    panel._wilds = [RESOURCE_ENERGY, RESOURCE_ENERGY];
    const changes = [];
    panel.dispatchEvent = event => changes.push(event.detail.wilds);
    const [firstWild, secondWild] = panel.getResources([{
        id: 'double-wild',
        resources: [RESOURCE_WILD, RESOURCE_WILD],
        selected: true,
    }], []);

    panel.handleResourceClick({
        detail: {
            resource: RESOURCE_MENTAL,
            change: RESOURCE_ENERGY,
        },
    }, secondWild);

    assert.deepEqual(panel._wilds, [RESOURCE_ENERGY, RESOURCE_MENTAL]);
    assert.deepEqual(changes, [[RESOURCE_ENERGY, RESOURCE_MENTAL]]);
    assert.equal(firstWild.wildIndex, 0);
    assert.equal(secondWild.wildIndex, 1);
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

test('an X payment can spend one icon from a double-resource card', () => {
    const doubleEnergyCard = {
        id: 'double-energy',
        resources: [RESOURCE_ENERGY, RESOURCE_ENERGY],
        selected: true,
    };
    const dialog = createDialog([doubleEnergyCard], [], {
        cost: 'X',
        requirement: [],
        resourceType: RESOURCE_ENERGY,
    });
    dialog._response.paid.hand = [doubleEnergyCard];

    assert.equal(dialog.renderContent().values[4], true);
    const keys = dialog.getPaymentResourceUnits(
        dialog._response.paid,
        true,
        []
    ).map(unit => dialog.getResourceUnitKey(unit));

    assert.equal(dialog.resourcesType.length, 2);

    dialog._handleResourceUnitToggle({
        detail: {key: keys[0]},
    });

    assert.deepEqual(dialog.resourcesType, [RESOURCE_ENERGY]);
    assert.deepEqual(dialog.resourcesConverted, [RESOURCE_ENERGY]);
    assert.equal(dialog.validate(), true);
});

test('a fixed card cost only counts resources of its configured type', () => {
    const mixedCard = {
        id: 'mixed',
        resources: [RESOURCE_PHYSICAL, RESOURCE_MENTAL],
        selected: true,
    };
    const dialog = createDialog([mixedCard], [], {
        allowPartial: false,
        cost: 1,
        requirement: [],
        resourceType: RESOURCE_PHYSICAL,
    });
    dialog._response.paid.hand = [mixedCard];

    assert.deepEqual(dialog.resourcesType, [RESOURCE_PHYSICAL]);
    assert.equal(dialog.validate(), true);

    dialog.data.cost = 2;
    assert.equal(dialog.validate(), false);

    const physicalCard = {
        id: 'physical',
        resources: [RESOURCE_PHYSICAL],
        selected: true,
    };
    dialog.data.cards.hand.push(physicalCard);
    dialog._response.paid.hand.push(physicalCard);
    assert.equal(dialog.validate(), true);
});

test('fixed card payments only return resources of their configured type', () => {
    const mixedCard = {
        id: 'mixed',
        resources: [RESOURCE_PHYSICAL, RESOURCE_MENTAL],
        selected: true,
    };
    const dialog = createDialog([mixedCard], [], {
        allowPartial: false,
        cost: 1,
        requirement: [],
        resourceType: RESOURCE_PHYSICAL,
    });
    const responses = [];
    dialog._response.paid.hand = [mixedCard];
    dialog.dispatchEvent = event => responses.push(event.detail);

    dialog.sendResponse();

    assert.deepEqual(responses[0].resources, [RESOURCE_PHYSICAL]);
});

test('wild resources are automatically assigned to a fixed cost resource type', () => {
    const wildCard = {
        id: 'wild',
        resources: [RESOURCE_WILD],
        selected: true,
    };
    const dialog = createDialog([wildCard], [], {
        allowPartial: false,
        cost: 1,
        requirement: [],
        resourceType: RESOURCE_PHYSICAL,
    });
    dialog._response.paid.hand = [wildCard];
    dialog.data.wilds = dialog.getAutomaticWilds(dialog.data.cards);

    assert.deepEqual(dialog.data.wilds, [RESOURCE_PHYSICAL]);
    assert.deepEqual(dialog.resourcesType, [RESOURCE_PHYSICAL]);
    assert.equal(dialog.validate(), true);
});

test('a simultaneous fixed cost can choose which icon of a card to spend', () => {
    const mixedResourceCard = {
        id: 'energy-and-mental',
        resources: [RESOURCE_ENERGY, RESOURCE_MENTAL],
        selected: true,
    };
    const dialog = createDialog([mixedResourceCard], [], {
        allowPartial: false,
        cost: 1,
        requirement: [RESOURCE_ENERGY],
        resourceSelectionMode: true,
    });
    dialog._response.paid.hand = [mixedResourceCard];

    const keys = dialog.getPaymentResourceUnits(
        dialog._response.paid,
        true,
        []
    ).map(unit => dialog.getResourceUnitKey(unit));
    assert.equal(dialog.renderContent().values[4], true);

    dialog._handleResourceUnitToggle({
        detail: {key: keys[0]},
    });

    assert.deepEqual(dialog.resourcesConverted, [RESOURCE_MENTAL]);
    assert.equal(dialog.validate(), false);

    dialog._handleResourceUnitToggle({
        detail: {key: keys[0]},
    });
    dialog._handleResourceUnitToggle({
        detail: {key: keys[1]},
    });

    assert.deepEqual(dialog.resourcesConverted, [RESOURCE_ENERGY]);
    assert.equal(dialog.validate(), true);
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

test('assigns leftover wild resources to conditional payment bonuses after requirements', () => {
    const firstWild = {
        id: 'first-wild',
        resources: [RESOURCE_WILD],
        selected: false,
    };
    const secondWild = {
        id: 'second-wild',
        resources: [RESOURCE_WILD],
        selected: false,
    };
    const dialog = createDialog([firstWild, secondWild], [], {
        allowPartial: false,
        cost: 2,
        requirement: [RESOURCE_MENTAL],
        resourcePreferences: [RESOURCE_PHYSICAL],
    });

    dialog._handlePaySelect({
        detail: {card: firstWild, type: 'hand'},
    });
    dialog._handlePaySelect({
        detail: {card: secondWild, type: 'hand'},
    });

    assert.deepEqual(
        dialog.data.wilds,
        [RESOURCE_MENTAL, RESOURCE_PHYSICAL]
    );
    assert.deepEqual(
        dialog.resourcesConverted,
        [RESOURCE_MENTAL, RESOURCE_PHYSICAL]
    );
});

test('automatically converts a wild resource to activate a card payment bonus', () => {
    const wildCard = {
        id: 'wild',
        resources: [RESOURCE_WILD],
        selected: true,
    };
    const dialog = createDialog([wildCard], [], {
        allowPartial: false,
        cost: 1,
        requirement: [],
        resourcePreferences: [RESOURCE_PHYSICAL],
    });

    assert.deepEqual(
        dialog.getAutomaticWilds(dialog.data.cards),
        [RESOURCE_PHYSICAL]
    );
});

test('converts every selected wild to an exclusive bonus resource even when that type is already paid', () => {
    const physicalCard = {
        id: 'physical',
        resources: [RESOURCE_PHYSICAL],
        selected: false,
    };
    const firstWild = {
        id: 'first-wild',
        resources: [RESOURCE_WILD],
        selected: false,
    };
    const secondWild = {
        id: 'second-wild',
        resources: [RESOURCE_WILD],
        selected: false,
    };
    const dialog = createDialog([
        physicalCard,
        firstWild,
        secondWild,
    ], [], {
        allowPartial: false,
        cost: 3,
        requirement: [],
        resourcePreferences: [RESOURCE_PHYSICAL],
        exclusiveResourcePreferences: [RESOURCE_PHYSICAL],
    });

    [physicalCard, firstWild, secondWild].forEach(card => {
        dialog._handlePaySelect({
            detail: {card, type: 'hand'},
        });
    });

    assert.deepEqual(
        dialog.data.wilds,
        [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
    );
    assert.deepEqual(
        dialog.resourcesConverted,
        [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
    );
    assert.equal(dialog.validate(), true);
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

test('discard mode accepts printed icons without converting wild resources', () => {
    const wildCard = {
        id: 'wild',
        resources: [RESOURCE_WILD],
        selected: true,
    };
    const dialog = createDialog([wildCard], [], {
        allowWildConversion: false,
        cost: 1,
        requirement: [[RESOURCE_MENTAL]],
        resourcePaymentMode: RESOURCE_PAYMENT_MODE_DISCARD,
    });
    dialog._response.paid.hand = [wildCard];

    assert.equal(dialog.validate(), false);

    dialog.data.requirement = [[RESOURCE_ANY]];

    assert.equal(dialog.validate(), true);
    assert.deepEqual(dialog.resourcesConverted, [RESOURCE_WILD]);
});

test('discard mode keeps both icons of a double-resource card selectable', () => {
    const doubleCard = {
        id: 'double',
        resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        selected: true,
    };
    const dialog = createDialog([doubleCard], [], {
        allowWildConversion: false,
        cost: 2,
        requirement: [[RESOURCE_ANY], [RESOURCE_ANY]],
        resourcePaymentMode: RESOURCE_PAYMENT_MODE_DISCARD,
    });
    dialog._response.paid.hand = [doubleCard];
    assert.equal(dialog.validate(), true);
    assert.equal(dialog.validate(), true);
    assert.deepEqual(
        dialog.getPaymentResourceUnits(dialog._response.paid, true)
            .map(unit => unit.resource),
        [RESOURCE_MENTAL, RESOURCE_PHYSICAL]
    );
});

test('discard mode renders printed wild icons without a conversion control', () => {
    const panel = Object.create(McPayCost.prototype);
    panel.allowWildConversion = false;
    panel.resourceSelectionMode = true;
    panel.selectedResources = undefined;
    const rendered = panel.renderResourceIcon(
        RESOURCE_WILD,
        false,
        false,
        {
            source: 'hand',
            cardId: 'wild',
            resourceIndex: 0,
        }
    );

    assert.match(rendered.strings.join(''), /resource-unit/);
    assert.doesNotMatch(rendered.strings.join(''), /<mc-resource/);
});
