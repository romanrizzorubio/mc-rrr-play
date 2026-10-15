import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_SELECT_CARD,
    PLACE_DISCARD_PILE,
    RESOURCE_ANY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_YOU,
} from 'mc-shared';
import {Arrow} from '../../src/abilities/core/arrow.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DoIfHasPaidEffect} from '../../src/effects/do-if-has-paid-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PayPrintedCostEffect} from '../../src/effects/pay-printed-cost-effect.js';
import {SearchCardsEffect} from '../../src/effects/search-cards-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {BasicActivationCost} from '../../src/model/costs/basic-activation-cost.js';
import {CostGroup} from '../../src/model/costs/cost-group.js';

class CancelledPaymentEffect extends Effect {
    getCostPaymentEffects() {
        return [this];
    }
    getCostPaymentTitle() {
        return 'Pagar el coste de prueba';
    }
    async preparePayment() {
        return undefined;
    }
}

function createPlayCardEffect({calculatedCost, requirement = [], ability}) {
    const card = {
        cost: 3,
        isUpgrade: false,
        requirement,
        toObj: () => ({name: 'Test card'}),
    };
    const calls = {
        dialogs: [],
        getCardsToPay: 0,
    };
    const player = {
        async getCardsToPay() {
            calls.getCardsToPay++;
            return {
                generators: [],
                hand: [],
            };
        },
        getCard: cardToGet => cardToGet,
        hand: {
            getCard: cardToGet => cardToGet,
        },
    };
    const effect = new PlayCardEffect({
        ability,
        card,
        match: {},
    });

    effect.getCost = async () => calculatedCost;
    effect.openDialog = async options => {
        calls.dialogs.push(options);
        return {
            paid: {
                generators: [],
                hand: [],
            },
            resources: [],
        };
    };

    return {calls, effect, player};
}

test('does not prompt to pay a card whose calculated cost is zero', async () => {
    const {calls, effect, player} = createPlayCardEffect({
        calculatedCost: 0,
    });

    await effect.payCost({player});

    assert.equal(calls.dialogs.length, 0);
    assert.equal(calls.getCardsToPay, 0);
    assert.equal(effect.canceled, false);
});

test('still prompts for a resource requirement when calculated cost is zero', async () => {
    const {calls, effect, player} = createPlayCardEffect({
        calculatedCost: 0,
        requirement: [RESOURCE_MENTAL],
    });

    await effect.payCost({player});

    assert.equal(calls.dialogs.length, 1);
    assert.equal(calls.dialogs[0].data.cost, 0);
    assert.deepEqual(calls.dialogs[0].data.requirement, [RESOURCE_MENTAL]);
});

test('still prompts to pay a positive calculated cost', async () => {
    const {calls, effect, player} = createPlayCardEffect({
        calculatedCost: 2,
    });

    await effect.payCost({player});

    assert.equal(calls.dialogs.length, 1);
    assert.equal(calls.dialogs[0].data.cost, 2);
});

test('passes conditional paid-resource preferences to the payment dialog', async () => {
    const paidResourceCondition = new DoIfHasPaidEffect({
        match: {},
        resources: [RESOURCE_PHYSICAL],
    });
    const ability = {
        effect: new ChainedEffect({
            effects: [
                new Effect({
                    match: {},
                    thenEffect: paidResourceCondition,
                }),
            ],
            match: {},
        }),
    };
    const {calls, effect, player} = createPlayCardEffect({
        ability,
        calculatedCost: 2,
    });

    await effect.payCost({player});

    assert.deepEqual(
        calls.dialogs[0].data.resourcePreferences,
        [RESOURCE_PHYSICAL]
    );
});

test('passes the play effect to card play validation', async () => {
    let validationParams;
    const card = {
        async canPlay(params) {
            validationParams = params;

            return true;
        },
    };
    const effect = new PlayCardEffect({
        card,
        match: {},
    });

    assert.equal(await effect.canRun({player: {}}), true);
    assert.equal(validationParams.playCardEffect, effect);
});

test('returns an event to hand when its arrow cost is cancelled', async () => {
    const card = {
        isEvent: true,
        isPlayerCard: false,
        isUpgrade: false,
        requirement: [],
    };
    const player = {
        hand: {
            cards: [card],
            async discardHand(discardedCard) {
                this.cards.splice(this.cards.indexOf(discardedCard), 1);
            },
            addCard(returnedCard) {
                this.cards.push(returnedCard);
            },
            async refresh() {},
        },
    };
    const match = {triggerCards: {}};
    const arrow = new Arrow({
        cost: new CancelledPaymentEffect({match}),
        match,
    });
    const ability = {
        costs: new CostGroup({
            costs: [arrow],
            match,
        }),
        paymentCancelled: false,
        async prepareToResolve() {
            return {canRun: true, preselectedTarget: false};
        },
    };
    const effect = new PlayCardEffect({
        ability,
        card,
        match,
    });

    effect.getCost = async () => 0;

    await effect.runEffect({player});

    assert.equal(effect.paymentCancelled, true);
    assert.equal(effect.played, false);
    assert.equal(effect.canceled, true);
    assert.deepEqual(player.hand.cards, [card]);
    assert.equal(card.isPlaying, false);
});

test('resource, basic-action, and arrow costs are staged together and all abort on cancellation', async () => {
    const eventCard = {
        cost: 1,
        exhausted: false,
        id: 'event-with-costs',
        isEvent: true,
        isPlayerCard: true,
        isUpgrade: false,
        name: 'Test Event',
        requirement: [],
        toObj() {
            return {id: this.id, name: this.name};
        },
        exhaust() {
            this.exhausted = true;
        },
        async refresh() {},
    };
    const resourceCard = {
        id: 'resource-card',
        toObj() {
            return {id: this.id};
        },
    };
    const hand = {
        cards: [eventCard, resourceCard],
        addCard(card) {
            this.cards.push(card);
        },
        async discardHand(card) {
            this.cards.splice(this.cards.indexOf(card), 1);
        },
        getCard(cardId) {
            return this.cards.find(card => card.id === cardId);
        },
        async refresh() {},
    };
    const player = {
        getCard(cardId) {
            return hand.getCard(cardId);
        },
        async getCardsToPay(_card, _resourceType, excludedCardIds) {
            return {
                generators: [],
                hand: excludedCardIds.has(resourceCard.id) ? [] : [resourceCard],
            };
        },
        hand,
        isPlayer: true,
    };
    const match = {
        openDialog: async ({dialogType, data}) => {
            if (dialogType === DIALOG_LIST) {
                return {selected: data.options[0]};
            }
            if (dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {
                        generators: [],
                        hand: [{id: resourceCard.id}],
                    },
                    resources: [RESOURCE_MENTAL],
                };
            }

            throw new Error(`Unexpected dialog: ${dialogType}`);
        },
        triggerCards: {},
    };
    const basicCost = new BasicActivationCost({
        match,
    });
    const arrow = new Arrow({
        cost: new CancelledPaymentEffect({match}),
        match,
    });
    const ability = {
        costs: new CostGroup({
            costs: [basicCost, arrow],
            match,
        }),
        async prepareToResolve() {
            return {canRun: true, preselectedTarget: false};
        },
        async resolveAbility() {
            assert.fail('The ability must not resolve after a cost is cancelled.');
        },
    };
    const effect = new PlayCardEffect({
        ability,
        card: eventCard,
        match,
    });
    effect.getCost = async () => 1;

    await effect.runEffect({match, player});

    assert.equal(effect.paymentCancelled, true);
    assert.equal(effect.played, false);
    assert.equal(eventCard.exhausted, false);
    assert.ok(hand.cards.includes(eventCard));
    assert.ok(hand.cards.includes(resourceCard));
    assert.deepEqual(effect.resourcesPaid, []);
});

test('cancelling an ally printed-cost payment returns the event and leaves the ally in the discard pile', async () => {
    const ally = {
        id: 'discarded-ally',
        name: 'Discarded Ally',
        type: CARD_TYPE_ALLY,
        cost: 2,
        toObj() {
            return {id: this.id, name: this.name, type: this.type};
        },
    };
    const eventCard = {
        id: 'make-the-call',
        name: 'Hacer la llamada',
        isEvent: true,
        isPlayerCard: false,
        isUpgrade: false,
        requirement: [],
    };
    const dialogs = [];
    let abilityResolved = false;
    const player = {
        isPlayer: true,
        deck: {
            cards: [],
            discardPile: [ally],
        },
        hand: {
            cards: [eventCard],
            async discardHand(card) {
                this.cards.splice(this.cards.indexOf(card), 1);
            },
            addCard(card) {
                this.cards.push(card);
            },
            async refresh() {},
        },
    };
    const match = {
        players: [player],
        triggerCards: {},
        async openDialog(options) {
            dialogs.push(options);

            if (options.dialogType === DIALOG_SELECT_CARD) {
                return {selected: [{id: ally.id}]};
            }
            if (options.dialogType === DIALOG_PAY_COST) {
                return undefined;
            }

            throw new Error(`Unexpected dialog: ${options.dialogType}`);
        },
    };
    player.spendResources = async (resources, card, _excludedCardIds, options) => {
        assert.deepEqual(resources, Array(ally.cost).fill(RESOURCE_ANY));
        assert.equal(card, ally);
        assert.equal(options.showCancel, true);

        return match.openDialog({
            dialogType: DIALOG_PAY_COST,
            showCancel: options.showCancel,
        });
    };

    const arrow = new Arrow({
        cost: new SimultaneousEffect({
            effects: [
                new SearchCardsEffect({
                    filter: {type: CARD_TYPE_ALLY},
                    locations: [PLACE_DISCARD_PILE],
                    match,
                    players: TARGET_ALL_PLAYERS,
                    showCancel: true,
                }),
                new PayPrintedCostEffect({match}),
            ],
            match,
            outputParams: ['selectedCard'],
            selectedTarget: player,
            target: TARGET_YOU,
        }),
        match,
    });
    const ability = {
        arrow,
        costs: new CostGroup({
            costs: [arrow],
            match,
        }),
        costs: new CostGroup({
            costs: [arrow],
            match,
        }),
        paymentCancelled: false,
        async prepareToResolve() {
            return {canRun: true, preselectedTarget: false};
        },
        async resolveAbility() {
            abilityResolved = true;
        },
    };
    const effect = new PlayCardEffect({
        ability,
        card: eventCard,
        match,
    });
    effect.getCost = async () => 0;

    await effect.runEffect({match, player});

    assert.deepEqual(dialogs.map(({dialogType}) => dialogType), [
        DIALOG_SELECT_CARD,
        DIALOG_PAY_COST,
    ]);
    assert.equal(dialogs[1].showCancel, true);
    assert.equal(abilityResolved, false);
    assert.equal(effect.canceled, true);
    assert.deepEqual(player.hand.cards, [eventCard]);
    assert.equal(eventCard.isPlaying, false);
    assert.deepEqual(player.deck.discardPile, [ally]);
});
