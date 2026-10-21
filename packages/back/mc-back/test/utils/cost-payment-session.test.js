import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_PAY_COST,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCES_X,
} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {SpendXEffect} from '../../src/effects/spend-x-effect.js';
import {Hand} from '../../src/model/match/hand.js';
import {ResourceCost} from '../../src/model/costs/resource-cost.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

test('shares a double-resource card between printed and arrow costs', async () => {
    const doubleEnergy = {
        card: {
            getResources: () => [RESOURCE_ENERGY, RESOURCE_ENERGY],
        },
        id: 'double-energy',
        isPlaying: false,
        toObj() {
            return {
                id: this.id,
                resources: this.card.getResources(),
            };
        },
    };
    const eventCard = {
        abilities: [],
        currentSide: {abilities: []},
        id: 'event',
        requirement: [],
        toObj: () => ({id: 'event'}),
    };
    const hand = new Hand({});
    hand.cards = [doubleEnergy];
    let secondDialogResources;
    const match = {
        async openDialog({data, dialogType}) {
            assert.equal(dialogType, DIALOG_PAY_COST);

            if (data.cost === RESOURCES_X) {
                secondDialogResources = data.cards.hand[0].resources;

                return {
                    paid: {
                        generators: [],
                        hand: [{id: doubleEnergy.id}],
                    },
                    resources: [RESOURCE_ENERGY],
                };
            }

            return {
                paid: {
                    generators: [],
                    hand: [{id: doubleEnergy.id}],
                },
                resources: [RESOURCE_ENERGY, RESOURCE_ENERGY],
            };
        },
    };
    const player = {
        async getCardsToPay(cardToPay, resourceType, excludedCardIds, resourceUsage) {
            return {
                generators: [],
                hand: hand.getCardsToPay(
                    cardToPay,
                    resourceType,
                    excludedCardIds,
                    resourceUsage
                ),
            };
        },
        async spendResourcesX(
            _resources,
            cardToPay,
            resourceType,
            excludedCardIds,
            resourceUsage
        ) {
            const cardsToPay = await this.getCardsToPay(
                cardToPay,
                resourceType,
                excludedCardIds,
                resourceUsage
            );
            const response = await match.openDialog({
                dialogType: DIALOG_PAY_COST,
                data: {
                    cards: {
                        hand: cardsToPay.hand.map(card =>
                            card.toObj({card: cardToPay})),
                    },
                    cost: RESOURCES_X,
                },
            });

            return {
                generators: [],
                hand: response.paid.hand.map(card =>
                    hand.getCard(card.id)),
                resources: response.resources,
            };
        },
        hand,
    };
    const playCardEffect = new PlayCardEffect({
        card: eventCard,
        match,
    });
    const resourceCost = new ResourceCost({
        amount: 1,
        card: eventCard,
        match,
        playCardEffect,
    });

    const session = new CostPaymentSession();
    const printedCostPayment = {
        resourceCost,
    };
    const printedPayment = await playCardEffect.payCost(
        {card: eventCard, player},
        session,
        resourceCost
    );
    session.stagePayment(printedCostPayment, printedPayment, {card: eventCard});

    assert.deepEqual(
        session.getRemainingResources().get(doubleEnergy.id),
        [RESOURCE_ENERGY]
    );
    const arrowCost = new SpendXEffect({
        match,
        resourceType: RESOURCE_ENERGY,
        selectedTarget: player,
    });
    const arrowPayment = await arrowCost.preparePayment(
        {card: eventCard},
        session
    );
    session.stagePayment(arrowCost, arrowPayment, {card: eventCard});

    assert.deepEqual(secondDialogResources, [RESOURCE_ENERGY]);
    assert.deepEqual(
        session.getRemainingResources().get(doubleEnergy.id),
        []
    );
    assert.ok(
        session.getResourcePaymentExcludedCardIds().has(doubleEnergy.id)
    );
    const committedPrintedPayment = session.getPayment(printedCostPayment);
    assert.deepEqual(committedPrintedPayment.hand, [doubleEnergy]);
    assert.deepEqual(committedPrintedPayment.resources, [RESOURCE_ENERGY]);
    assert.deepEqual(session.getPayment(arrowCost).hand, []);
});

test('enforces a card resource type across every adjusted cost icon', () => {
    const cardToPay = {
        requirement: [],
        resourceType: RESOURCE_PHYSICAL,
    };
    const resourceCost = new ResourceCost({
        amount: 2,
        card: cardToPay,
    });
    const costEffect = {resourceCost};
    const mixedResourceCard = {
        id: 'mixed-resource',
        resources: [RESOURCE_PHYSICAL, RESOURCE_MENTAL],
    };
    const mixedPayment = {
        generators: [],
        hand: [mixedResourceCard],
        resources: [RESOURCE_PHYSICAL, RESOURCE_MENTAL],
    };
    const invalidSession = new CostPaymentSession();

    assert.throws(
        () => invalidSession.stagePayment(
            costEffect,
            mixedPayment,
            {card: cardToPay}
        ),
        /El pago no satisface los requisitos de recursos/
    );

    const physicalResourceCard = {
        id: 'double-physical',
        resources: [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL],
    };
    const validSession = new CostPaymentSession();
    validSession.stagePayment(
        costEffect,
        {
            generators: [],
            hand: [physicalResourceCard],
            resources: [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL],
        },
        {card: cardToPay}
    );

    assert.deepEqual(
        validSession.getPayment(costEffect).resources,
        [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
    );
});

test('keeps cards reserved for non-resource costs excluded from resource payments', () => {
    const card = {
        card: {
            getResources: () => [RESOURCE_ENERGY],
        },
        id: 'reserved-card',
    };
    const session = new CostPaymentSession();

    session.stagePayment({}, {hand: [card]});

    assert.equal(session.getRemainingResources().has(card.id), false);
    assert.ok(session.getResourcePaymentExcludedCardIds().has(card.id));
});
