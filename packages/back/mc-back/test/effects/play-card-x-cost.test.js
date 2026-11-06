import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_PAY_COST,
    DIALOG_SELECT_NUMBER,
    RESOURCE_MENTAL,
    RESOURCES_X,
} from 'mc-shared';
import {DoIfHasPaidEffect} from '../../src/effects/do-if-has-paid-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayCardResourceCostEffect} from '../../src/effects/play-card-resource-cost-effect.js';
import {ResourceCost} from '../../src/model/costs/resource-cost.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

describe('variable-cost card play', () => {
    test('keeps conditional payment requirements when the printed cost is ignored', async () => {
        const paidBranch = new Effect({match: {}});
        paidBranch.canRun = async () => true;
        const unpaidBranch = new Effect({match: {}});
        unpaidBranch.canRun = async () => false;
        const paidResourceCondition = new DoIfHasPaidEffect({
            effect: paidBranch,
            effectNot: unpaidBranch,
            match: {},
            resources: [RESOURCE_MENTAL],
        });
        const card = {
            cost: RESOURCES_X,
            currentSide: {abilities: []},
            name: 'Variable-cost event',
            requirement: [],
            toObj() {
                return {name: this.name};
            },
        };
        const dialogs = [];
        const effect = new PlayCardEffect({
            ability: {effect: paidResourceCondition},
            card,
            ignoreResourceCost: true,
            match: {},
        });
        effect.getCost = async () => RESOURCES_X;
        effect.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_SELECT_NUMBER) {
                return {value: 0};
            }

            dialogs.push(dialog);
            return undefined;
        };
        const player = {
            async getCardsToPay() {
                return {generators: [], hand: []};
            },
        };

        await effect.payCost({player});

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_PAY_COST);
        assert.equal(dialogs[0].data.cost, 0);
        assert.deepEqual(dialogs[0].data.requirement, [RESOURCE_MENTAL]);
        assert.equal(effect.paymentCancelled, true);
    });

    test('a cost reduction contributes to X when no resource is paid', async () => {
        const card = {
            cost: RESOURCES_X,
            name: 'Variable-cost card',
            requirement: [],
        };
        const match = {
            triggerCards: {},
            players: [],
        };
        const playCardEffect = new PlayCardEffect({card, match});
        playCardEffect.modifyCost = -1;
        const resourceCost = new ResourceCost({
            amount: RESOURCES_X,
            card,
            match,
            playCardEffect,
        });
        const effect = new PlayCardResourceCostEffect({
            playCardEffect,
            resourceCost,
            match,
        });
        const costPaymentSession = new CostPaymentSession();
        costPaymentSession.stagePayment(effect, {
            generators: [],
            hand: [],
            resources: [],
        }, {cardToPay: card});
        const player = {hand: {cards: []}};

        await effect.execute({
            costPaymentSession,
            match,
            player,
        });

        assert.equal(playCardEffect.xValue, 1);
        assert.deepEqual(playCardEffect.resourcesPaid, []);
    });

    test('free play lets the player choose X and applies cost reductions', async () => {
        const card = {
            cost: RESOURCES_X,
            name: 'Variable-cost event',
            requirement: [],
        };
        const dialogs = [];
        const effect = new PlayCardEffect({
            card,
            ignoreResourceCost: true,
            match: {},
        });
        effect.modifyCost = -1;
        effect.getCost = async () => RESOURCES_X;
        effect.openDialog = async dialog => {
            dialogs.push(dialog);
            return {value: 0};
        };

        const cost = await effect.getResourceCost({player: {id: 'player'}});

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_SELECT_NUMBER);
        assert.equal(dialogs[0].data.min, 0);
        assert.equal(effect.xValue, 1);
        assert.equal(cost.amount, 0);
    });
});
