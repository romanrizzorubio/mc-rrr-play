import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_PAY_COST,
    RESOURCE_MENTAL,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {CancelCardEffectsEffect} from '../../src/effects/cancel-card-effects-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';

class TestAbility extends Ability {
    async canRun() {
        return true;
    }
    async prepareToResolve() {
        return {
            canRun: true,
            preselectedTarget: false,
        };
    }
}

class TestEventEffect extends Effect {
    constructor({executions, ...params}) {
        super(params);

        this.executions = executions;
    }
    async execute() {
        this.executions.count++;
    }
}

test('cancelling an event still pays its cost and discards the card', async () => {
    const paymentCalls = [];
    const executions = {count: 0};
    const eventCard = {
        abilities: [],
        cost: 1,
        currentSide: {abilities: []},
        id: 'test-event',
        isEvent: true,
        isPlayerCard: true,
        isUpgrade: false,
        name: 'Test Event',
        requirement: [],
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    const resourceCard = {
        card: {
            getResources: () => [RESOURCE_MENTAL],
        },
        id: 'resource-card',
        toObj() {
            return {id: this.id, resources: [RESOURCE_MENTAL]};
        },
    };
    const hand = {
        cards: [eventCard, resourceCard],
        async discardHand(card) {
            this.cards.splice(this.cards.indexOf(card), 1);
        },
        getCard(cardId) {
            return this.cards.find(card => card.id === cardId);
        },
        async refresh() {},
    };
    const deck = {
        discardPile: [],
        async discard(card) {
            this.discardPile.push(card);
        },
        async refresh() {},
    };
    const player = {
        deck,
        hand,
        isPlayer: true,
        async getCardsToPay(_card, _resourceType, excludedCardIds) {
            return {
                generators: [],
                hand: excludedCardIds.has(resourceCard.id) ?
                    [] :
                    [resourceCard],
            };
        },
        getCard(cardId) {
            return hand.getCard(cardId);
        },
    };
    const match = {
        isUniqueCard: () => false,
        openDialog: async ({dialogType}) => {
            assert.equal(dialogType, DIALOG_PAY_COST);
            paymentCalls.push(dialogType);

            return {
                paid: {
                    generators: [],
                    hand: [{id: resourceCard.id}],
                },
                resources: [RESOURCE_MENTAL],
            };
        },
        triggerCards: {},
    };
    const abilityEffect = new ChainedEffect({
        effects: [
            new TestEventEffect({executions, match}),
            new TestEventEffect({executions, match}),
        ],
        match,
    });
    const ability = new TestAbility({
        effect: abilityEffect,
        match,
    });
    const abilityUses = {limit: 0, maximum: 0};
    ability.card = eventCard;
    ability.limit = {use: () => abilityUses.limit++};
    ability.maximum = {use: () => abilityUses.maximum++};
    eventCard.abilities = [ability];
    eventCard.currentSide.abilities = [ability];

    const playCardEffect = new PlayCardEffect({
        ability,
        card: eventCard,
        match,
    });
    playCardEffect.getCost = async () => 1;

    const cancelEffect = new CancelCardEffectsEffect({match});
    await cancelEffect.runEffect({
        effect: playCardEffect,
        match,
        player,
        triggeredEffect: playCardEffect,
    });
    await playCardEffect.runEffect({match, player});

    assert.equal(playCardEffect.cardEffectsCanceled, true);
    assert.equal(playCardEffect.played, true);
    assert.equal(playCardEffect.paymentCancelled, false);
    assert.deepEqual(playCardEffect.resourcesPaid, [RESOURCE_MENTAL]);
    assert.deepEqual(paymentCalls, [DIALOG_PAY_COST]);
    assert.equal(executions.count, 0);
    assert.equal(ability.resolved, false);
    assert.deepEqual(abilityUses, {limit: 1, maximum: 1});
    assert.deepEqual(deck.discardPile, [resourceCard, eventCard]);
});

test('generic card-effect cancellation does not restrict the card type', () => {
    let effectsCanceled = false;
    const effectToCancel = {
        card: {isEvent: false},
        cancelEffects() {
            effectsCanceled = true;
        },
    };
    const cancelEffect = new CancelCardEffectsEffect({match: {}});

    cancelEffect.execute({effect: effectToCancel});

    assert.equal(effectsCanceled, true);
});
