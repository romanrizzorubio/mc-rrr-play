import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_PAYMENT_MODE_PAYMENT,
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

describe('cost-only resources in the payment dialog', () => {
    const createPowerCard = () => ({
        costOnlyResourceIndexes: [1],
        id: 'power-of-aggression',
        resources: [RESOURCE_WILD, RESOURCE_WILD],
        selected: true,
    });
    const createDialog = (card, cost, requirement = []) => {
        const dialog = Object.create(McPayCostDialog.prototype);
        dialog.data = {
            allowWildConversion: true,
            cards: {
                generators: [],
                hand: [card],
            },
            cost,
            exclusiveResourcePreferences: [],
            requirement,
            resourcePaymentMode: RESOURCE_PAYMENT_MODE_PAYMENT,
            resourcePreferences: [],
            resourceSelectionMode: true,
            resourceType: RESOURCE_ANY,
            wilds: [],
        };
        dialog._response = {
            paid: {
                generators: [],
                hand: [card],
            },
        };
        dialog._selectedResourceKeys = undefined;

        return dialog;
    };
    const createPaymentPanel = (card, cost, requirement = []) => {
        const panel = Object.create(McPayCost.prototype);
        panel.allowWildConversion = true;
        panel.cost = String(cost);
        panel.requirement = requirement;
        panel.resourcePaymentMode = RESOURCE_PAYMENT_MODE_PAYMENT;
        panel.resourceType = RESOURCE_ANY;
        panel._wilds = [];

        return panel;
    };

    test('shows only the printed icon when the card being paid has no cost', () => {
        const card = createPowerCard();
        const dialog = createDialog(card, 0);
        const panel = createPaymentPanel(card, 0);

        assert.deepEqual(
            dialog.getPaymentResourceUnits(dialog._response.paid, true)
                .map(({resourceIndex}) => resourceIndex),
            [0],
        );
        assert.deepEqual(dialog.resources, [RESOURCE_WILD]);
        assert.equal(panel.renderResourceIcons([card], []).length, 1);
    });

    test('allows the bonus icon when it is needed to satisfy the cost', () => {
        const card = createPowerCard();
        const dialog = createDialog(card, 1, [RESOURCE_ENERGY]);
        const panel = createPaymentPanel(card, 1, [RESOURCE_ENERGY]);

        assert.deepEqual(
            dialog.getPaymentResourceUnits(dialog._response.paid, true)
                .map(({resourceIndex}) => resourceIndex),
            [0, 1],
        );
        assert.equal(panel.getResources([card], []).length, 2);
    });
});
