import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    DIALOG_PAY_COST,
    DIALOG_SELECT_CARD,
    PLACE_DISCARD_PILE,
    RESOURCE_ANY,
    RESOURCE_MENTAL,
    TARGET_ALL_PLAYERS,
    TARGET_YOU,
} from 'mc-shared';
import {Arrow} from '../../src/abilities/core/arrow.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PayPrintedCostEffect} from '../../src/effects/pay-printed-cost-effect.js';
import {SearchCardsEffect} from '../../src/effects/search-cards-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';

function createPlayCardEffect({calculatedCost, requirement = []}) {
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
    const ability = {
        arrow: {},
        paymentCancelled: false,
        async prepareToResolve() {
            return {canRun: true, preselectedTarget: false};
        },
        async payArrow() {
            this.paymentCancelled = true;

            return false;
        },
    };
    const effect = new PlayCardEffect({
        ability,
        card,
        match: {triggerCards: {}},
    });

    effect.getCost = async () => 0;

    await effect.runEffect({player});

    assert.equal(effect.paymentCancelled, true);
    assert.equal(effect.played, false);
    assert.equal(effect.canceled, true);
    assert.deepEqual(player.hand.cards, [card]);
    assert.equal(card.isPlaying, false);
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
        paymentCancelled: false,
        async prepareToResolve() {
            return {canRun: true, preselectedTarget: false};
        },
        async payArrow(params) {
            const paid = await arrow.pay(params, params);
            this.paymentCancelled = arrow.paymentCancelled;

            return paid;
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
