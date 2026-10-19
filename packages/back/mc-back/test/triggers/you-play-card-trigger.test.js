import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_PAY_COST,
    PRIORITY_CONSTANT,
    RESOURCE_MENTAL,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {TRIGGER_MAP} from '../../src/factory/triggers/triggers-map.js';
import {YouPlayCardTrigger} from '../../src/triggers/you-play-card-trigger.js';

test('YouPlayCardTrigger matches plays by its player controller', () => {
    assert.equal(TRIGGER_MAP[TRIGGER_YOU_PLAY_CARD], YouPlayCardTrigger);

    const controller = {isPlayer: true};
    const otherPlayer = {isPlayer: true};
    const trigger = new YouPlayCardTrigger({
        ability: {
            canTrigger: () => true,
        },
        card: {
            controller,
        },
    });

    assert.equal(trigger.canTrigger({player: controller}), true);
    assert.equal(trigger.canTrigger({player: otherPlayer}), undefined);
});

test('scenario triggers apply to all players unless attached to a player', () => {
    const scenario = {};
    const firstPlayer = {isPlayer: true};
    const secondPlayer = {isPlayer: true};
    const createTrigger = card => new YouPlayCardTrigger({
        ability: {
            canTrigger: () => true,
        },
        card,
    });
    const scenarioTrigger = createTrigger({
        controller: scenario,
    });
    const attachedTrigger = createTrigger({
        attachedTo: {
            owner: firstPlayer,
        },
        controller: scenario,
    });

    assert.equal(scenarioTrigger.canTrigger({player: firstPlayer}), true);
    assert.equal(scenarioTrigger.canTrigger({player: secondPlayer}), true);
    assert.equal(attachedTrigger.canTrigger({player: firstPlayer}), true);
    assert.equal(attachedTrigger.canTrigger({player: secondPlayer}), undefined);
});

test('playing a card emits a scenario attachment trigger before paying its cost', async () => {
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
                this.playCost = data.cost;
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
    const nakia = {
        attachedTo: {
            owner: player,
        },
        controller: scenario,
        owner: scenario,
        id: 'nakia',
        isEvent: false,
        triggers: {},
    };
    const nakiaAbility = {
        hideDialog: true,
        resolved: false,
        canTrigger: () => true,
        async resolveAbility({triggeredEffect}) {
            triggeredEffect.modifyCost--;
            this.resolved = true;
        },
    };
    const nakiaTrigger = new YouPlayCardTrigger({
        ability: nakiaAbility,
        card: nakia,
        trigger: TRIGGER_YOU_PLAY_CARD,
    });
    nakia.triggers[TRIGGER_YOU_PLAY_CARD] = {
        [PRIORITY_CONSTANT]: [nakiaTrigger],
    };
    match.triggerCards[nakia.id] = nakia;

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

    assert.equal(playEffect.modifyCost, -1);
    assert.equal(match.playCost, 1);
    assert.equal(playedAbility.resolved, true);
});
