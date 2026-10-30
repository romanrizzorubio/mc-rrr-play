import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DIALOG_PAY_COST} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';

describe('play card payment dialogs', () => {
    test('targets the player who is paying to play the card', async () => {
        const card = {
            id: 'captain-america-shield',
            name: 'Escudo del Capitán América',
            requirement: [],
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const player = {
            getCardsToPay: async () => ({generators: [], hand: []}),
        };
        const effect = new PlayCardEffect({card, match: {}});
        let dialog;

        effect.getResourceCost = async () => ({
            amount: 2,
            requiresPayment: true,
        });
        effect.getPaymentResourcePreferences = () => [];
        effect.getExclusivePaymentResourcePreferences = () => [];
        effect.openDialog = async params => {
            dialog = params;
        };

        await effect.payCost({player});

        assert.equal(dialog.dialogType, DIALOG_PAY_COST);
        assert.strictEqual(dialog.targetPlayer, player);
    });
});
