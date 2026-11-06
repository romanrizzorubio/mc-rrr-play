import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {RESOURCE_MENTAL, TARGET_SOURCE} from 'mc-shared';
import {Arrow} from '../../src/abilities/core/arrow.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {PlayCardActionEffect} from '../../src/effects/play-card-action-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {CostGroup} from '../../src/model/costs/cost-group.js';

describe('PlayCardActionEffect', () => {
    test('does not check its source card when selecting from the same collection', async () => {
        const sourceCard = {
            isPlayerCard: true,
            isResource: false,
            async canPlay() {
                assert.fail('The source card must not be checked as a candidate.');
            },
        };
        const playableCard = {
            isPlayerCard: true,
            isResource: false,
            async canPlay() {
                return true;
            },
        };
        const ability = {card: sourceCard};
        const match = {isUniqueCard: () => false};
        const player = {
            hand: {
                cards: [sourceCard, playableCard],
            },
        };
        const effect = new PlayCardActionEffect({
            ability,
            ignoreResourceCost: true,
            match,
            source: 'player.hand.cards',
            target: TARGET_SOURCE,
        });

        assert.deepEqual(
            await effect.getPlayableTargets({ability, match, player}),
            [playableCard]
        );
    });

    test('ignores a fixed resource cost without opening a payment dialog', async () => {
        const card = {
            allowOverpay: true,
            cost: 3,
            requirement: [],
        };
        const dialogs = [];
        const effect = new PlayCardEffect({
            card,
            ignoreResourceCost: true,
            match: {},
        });
        effect.getCost = async () => card.cost;
        effect.openDialog = async options => {
            dialogs.push(options);
        };
        const player = {};

        const resourceCost = await effect.getResourceCost({player});
        await effect.payCost({player}, undefined, resourceCost);

        assert.equal(resourceCost.amount, 0);
        assert.equal(resourceCost.requiresPayment, false);
        assert.deepEqual(dialogs, []);
    });

    test('does not allow ignoring a card resource requirement', async () => {
        let canPlayCalls = 0;
        const sourceCard = {
            isPlayerCard: true,
            isResource: false,
        };
        const requirementCard = {
            isPlayerCard: true,
            isResource: false,
            requirement: [RESOURCE_MENTAL],
            async canPlay() {
                canPlayCalls++;
                return true;
            },
        };
        const ability = {card: sourceCard};
        const match = {isUniqueCard: () => false};
        const player = {
            hand: {
                cards: [sourceCard, requirementCard],
            },
        };
        const effect = new PlayCardActionEffect({
            ability,
            ignoreResourceCost: true,
            match,
            source: 'player.hand.cards',
            target: TARGET_SOURCE,
        });

        assert.deepEqual(
            await effect.getPlayableTargets({ability, match, player}),
            []
        );
        assert.equal(canPlayCalls, 0);
    });

    test('returns the source event and stops the chain when a played card is canceled', async () => {
        const dialogs = [];
        const match = {
            isUniqueCard: () => false,
            triggerCards: {},
            async openDialog(options) {
                dialogs.push(options);
                return undefined;
            },
        };
        class CancelledPaymentEffect extends Effect {
            getCostPaymentEffects() {
                return [this];
            }
            getCostPaymentTitle() {
                return 'Test payment';
            }
            async preparePayment() {
                return undefined;
            }
        }

        const sourceCard = {
            id: 'chaos-magic',
            isEvent: true,
            isPlaying: true,
        };
        const targetCard = {
            abilities: [],
            cost: 3,
            currentSide: {abilities: []},
            id: 'target-event',
            isEvent: true,
            isPlayerCard: true,
            isResource: false,
            isUpgrade: false,
            name: 'Target event',
            requirement: [],
            async canPlay() {
                return true;
            },
            async getAbilitiesType() {
                return this.abilities;
            },
            hasAbilityTrigger() {
                return false;
            },
        };
        const arrow = new Arrow({
            cost: new CancelledPaymentEffect({match}),
            match,
        });
        const targetAbility = {
            card: targetCard,
            costs: new CostGroup({
                costs: [arrow],
                match,
            }),
            paymentCancelled: false,
            async prepareToResolve() {
                return {canRun: true, preselectedTarget: false};
            },
            async resolveAbility() {
                assert.fail('A canceled card must not resolve its ability.');
            },
        };
        targetCard.abilities = [targetAbility];
        targetCard.currentSide.abilities = [targetAbility];

        const player = {
            deck: {
                discardPile: [],
                async discard(card) {
                    this.discardPile.push(card);
                },
            },
            async getCardsToPay() {
                return {generators: [], hand: []};
            },
            hand: {
                cards: [sourceCard, targetCard],
                addCard(card) {
                    if (!this.cards.includes(card)) {
                        this.cards.push(card);
                    }
                },
                discardHand(card) {
                    const index = this.cards.indexOf(card);
                    if (index >= 0) {
                        this.cards.splice(index, 1);
                    }
                },
                async refresh() {},
            },
        };
        const actionEffect = new PlayCardActionEffect({
            ignoreResourceCost: true,
            match,
            source: 'player.hand.cards',
            target: TARGET_SOURCE,
        });
        let followUpResolved = false;
        const followUpEffect = {
            paymentCancelled: false,
            async canRun() {
                return true;
            },
            async runEffect() {
                followUpResolved = true;
            },
        };
        const chain = new ChainedEffect({
            effects: [actionEffect, followUpEffect],
            match,
        });
        const sourceAbility = {
            card: sourceCard,
            paymentCancelled: false,
            async resolveAbility(params) {
                await chain.execute({
                    ...params,
                    ability: this,
                    match,
                    player,
                });
                this.paymentCancelled = chain.paymentCancelled;
            },
        };
        chain.ability = sourceAbility;
        const outerPlayEffect = new PlayCardEffect({
            ability: sourceAbility,
            card: sourceCard,
            match,
        });
        outerPlayEffect.removedFromHand = true;
        player.hand.discardHand(sourceCard);

        await outerPlayEffect.doPlay({match, player});

        assert.equal(actionEffect.paymentCancelled, true);
        assert.equal(chain.paymentCancelled, true);
        assert.equal(sourceAbility.paymentCancelled, true);
        assert.equal(outerPlayEffect.paymentCancelled, true);
        assert.equal(outerPlayEffect.played, false);
        assert.equal(followUpResolved, false);
        assert.deepEqual(dialogs, []);
        assert.deepEqual(player.deck.discardPile, []);

        await outerPlayEffect.returnToSource(player);

        assert.ok(player.hand.cards.includes(sourceCard));
        assert.ok(player.hand.cards.includes(targetCard));
        assert.equal(sourceCard.isPlaying, false);
        assert.equal(targetCard.isPlaying, false);
    });
});
