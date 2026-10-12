import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    DIALOG_PAY_COST,
    PRIORITY_CONSTANT,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {TRIGGER_MAP} from '../../src/factory/triggers/triggers-map.js';
import {YouPlayCardTrigger} from '../../src/triggers/you-play-card-trigger.js';

test('YouPlayCardTrigger only matches plays by its card controller', () => {
    assert.equal(TRIGGER_MAP[TRIGGER_YOU_PLAY_CARD], YouPlayCardTrigger);

    const controller = {};
    const otherPlayer = {};
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

test('playing a card emits the controller-scoped trigger before paying its cost', async () => {
    const player = {
        isHero: true,
        isPlayer: true,
        hand: {
            cards: [],
            discardHand(card) {
                this.cards = this.cards.filter(heldCard => heldCard !== card);
            },
            async refresh() {},
        },
        deck: {
            async discard() {},
        },
    };
    const match = {
        triggerCards: {},
        isUniqueCard: () => false,
        async openDialog({dialogType, data}) {
            if (dialogType === DIALOG_PAY_COST) {
                this.playCost = data.cost;
                return {
                    paid: {generators: [], hand: []},
                    resources: [],
                };
            }
        },
    };
    const nakia = {
        controller: player,
        owner: player,
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
        card: {cost: 2},
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
    player.getCardsToPay = async () => ({generators: [], hand: []});

    await playEffect.runEffect({player});

    assert.equal(playEffect.modifyCost, -1);
    assert.equal(match.playCost, 1);
    assert.equal(playedAbility.resolved, true);
});
