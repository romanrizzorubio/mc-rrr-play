import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_PAY_COST,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    RESOURCE_MENTAL,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {YouPlayCardTrigger} from '../../src/triggers/you-play-card-trigger.js';

describe('play-card interrupt timing', () => {
    test('pays card costs before forced and ordinary interrupts', async () => {
        const resolutionOrder = [];
        const resourceGenerator = {
            abilities: [{
                isResource: true,
                resource: RESOURCE_MENTAL,
            }],
            id: 'resource-generator',
            async resolveResourceAbility() {},
            toObj() {
                return {
                    id: this.id,
                    abilities: this.abilities,
                };
            },
        };
        const player = {
            isHero: true,
            isPlayer: true,
            hand: {
                cards: [],
                addCard(card) {
                    this.cards.push(card);
                },
                discardHand(card) {
                    this.cards = this.cards.filter(heldCard => heldCard !== card);
                },
                async refresh() {},
            },
            deck: {
                async discard() {},
            },
            getCard(cardId) {
                return cardId === resourceGenerator.id ?
                    resourceGenerator :
                    undefined;
            },
            async getCardsToPay() {
                return {generators: [resourceGenerator], hand: []};
            },
        };
        const match = {
            triggerCards: {},
            isUniqueCard: () => false,
            async openDialog({dialogType, data}) {
                if (dialogType === DIALOG_PAY_COST) {
                    assert.deepEqual(resolutionOrder, ['cost-modifier']);
                    this.playCost = data.cost;
                    resolutionOrder.push('payment');

                    return {
                        paid: {
                            generators: [{id: resourceGenerator.id}],
                            hand: [],
                        },
                        resources: [RESOURCE_MENTAL],
                    };
                }
            },
        };
        const scenario = {};
        const attachment = {
            attachedTo: {
                owner: player,
            },
            controller: scenario,
            owner: scenario,
            id: 'play-card-interrupt-source',
            isEvent: false,
            triggers: {},
        };
        const costModifier = {
            hideDialog: true,
            resolved: false,
            canTrigger: () => true,
            async resolveAbility({triggeredEffect}) {
                resolutionOrder.push('cost-modifier');
                triggeredEffect.modifyCost--;
                this.resolved = true;
            },
        };
        const createInterruptAbility = name => ({
            hideDialog: true,
            resolved: false,
            canTrigger: () => true,
            async resolveAbility({triggeredEffect}) {
                assert.deepEqual(triggeredEffect.resourcesPaid, [RESOURCE_MENTAL]);
                resolutionOrder.push(name);
                this.resolved = true;
            },
        });
        const createTrigger = ability => new YouPlayCardTrigger({
            ability,
            card: attachment,
            trigger: TRIGGER_YOU_PLAY_CARD,
        });
        attachment.triggers[TRIGGER_YOU_PLAY_CARD] = {
            [PRIORITY_CONSTANT]: [createTrigger(costModifier)],
            [PRIORITY_FORCED_INTERRUPT]: [
                createTrigger(createInterruptAbility('forced-interrupt')),
            ],
            [PRIORITY_INTERRUPT]: [
                createTrigger(createInterruptAbility('interrupt')),
            ],
        };
        match.triggerCards[attachment.id] = attachment;

        const playedCard = {
            abilities: [],
            card: {cost: 2},
            currentSide: {abilities: []},
            id: 'played-event',
            isEvent: true,
            isPlayerCard: true,
            isUpgrade: false,
            owner: player,
            toObj() {
                return {id: this.id};
            },
        };
        player.hand.cards.push(playedCard);

        const playedAbility = {
            paymentCancelled: false,
            async prepareToResolve() {
                return {canRun: true, preselectedTarget: false};
            },
            async resolveAbility() {
                resolutionOrder.push('card-resolution');
                this.resolved = true;
            },
        };
        const playEffect = new PlayCardEffect({
            ability: playedAbility,
            card: playedCard,
            match,
        });
        playEffect.getCost = async () => playedCard.card.cost;

        await playEffect.runEffect({player});

        assert.equal(match.playCost, 1);
        assert.deepEqual(resolutionOrder, [
            'cost-modifier',
            'payment',
            'forced-interrupt',
            'interrupt',
            'card-resolution',
        ]);
        assert.equal(playedAbility.resolved, true);
    });
});
