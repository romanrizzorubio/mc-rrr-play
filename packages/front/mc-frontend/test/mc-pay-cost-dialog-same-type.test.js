import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PAYMENT_MODE_PAYMENT,
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

describe('same-type resource payment dialog', () => {
    const createDialog = ({allowPartial = false, resources}) => {
        const card = {
            id: 'resource-card',
            resources,
            selected: true,
        };
        const dialog = Object.create(McPayCostDialog.prototype);
        dialog.data = {
            allowPartial,
            cards: {
                generators: [],
                hand: [card],
            },
            cost: 2,
            requirement: [RESOURCE_ANY, RESOURCE_ANY],
            resourcePaymentMode: RESOURCE_PAYMENT_MODE_PAYMENT,
            resourceSelectionMode: false,
            sameType: true,
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

    test('rejects mixed resource types and explains the constraint', () => {
        const dialog = createDialog({
            resources: [RESOURCE_ENERGY, RESOURCE_MENTAL],
        });

        assert.equal(dialog.validate(), false);
        assert.equal(
            dialog.getValidationError(),
            'Selecciona recursos del mismo tipo.',
        );
    });

    test('accepts two icons of the same type', () => {
        const dialog = createDialog({
            resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
        });

        assert.equal(dialog.validate(), true);
    });

    test('also enforces the constraint for partial payments', () => {
        const dialog = createDialog({
            allowPartial: true,
            resources: [RESOURCE_ENERGY, RESOURCE_MENTAL],
        });

        assert.equal(dialog.validate(), false);
    });
});
