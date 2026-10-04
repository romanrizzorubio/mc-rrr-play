import {
    PRIORITY_CONSTANT,
    TARGET_ALLY,
    TARGET_YOU,
    TRIGGER_INSTANT,
    TRIGGER_MINION_ENTER_PLAY,
    TRIGGER_THIS_ENTER_PLAY,
} from 'mc-shared';

import {AttachEffect} from './attach-effect.js';
import {DelayedEffect} from './delayed-effect.js';
import {DiscardFromGameEffect} from './discard-from-game-effect.js';
import {Effect} from './effect.js';
import {GetMaxAlliesEffect} from './get-max-allies-effect.js';


export class PutPlayEffect extends Effect {
    constructor({
        card,
        controller,
        maxAllyToDiscardId,
    }) {
        super(arguments[0]);

        this.card = card;
        this.controller = controller;
        this.maxAllyToDiscardId = maxAllyToDiscardId;
    }
    getCard(params = {}) {
        return this.card || params.selectedCard;
    }
    getTriggersEnds(params) {
        const card = this.getCard(params);
        if (!card) {
            return [];
        }

        const triggers = super.getTriggersEnds(params)
            .concat([TRIGGER_THIS_ENTER_PLAY]);

        if (card.isMinion) {
            triggers.push(TRIGGER_MINION_ENTER_PLAY);
        }

        return triggers;
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.getCard(params),
        };
    }
    async execute(params) {
        const card = this.getCard(params);
        const controller = this.controller || params.player;
        const {force, player} = params;
        const {selectedTarget} = this;

        if (card && (!card.isInPlay || force)) {
            if (card.isPlayerCard && this.match.isUniqueCard(card)) {
                return;
            }

            if (controller) {
                const ownerDeck = card.owner && card.owner.deck;
                let removedFromDeck = false;

                if (ownerDeck?.cards?.includes(card)) {
                    ownerDeck.removeCardFromDeck(card);
                    removedFromDeck = true;
                } else if (ownerDeck?.discardPile?.includes(card)) {
                    ownerDeck.searchDiscard(card);
                    removedFromDeck = true;
                }

                if (removedFromDeck) {
                    await ownerDeck.refresh();
                }

                if (!card.isMinion) {
                    controller.gameZone.addToGameZone(card);
                }
                card.controller = controller;
            }

            await card.initTriggers(params);

            if (card.uses) {
                card.counters = card.uses;
            }

            if (card.toughness) {
                card.setTough();
            }

            if (card.isAttachable && card.card.attach !== TARGET_YOU) {
                const attachEffect = new AttachEffect({
                    card,
                    selectedTarget,
                    player: controller,
                    match: this.match,
                });
                await attachEffect.runEffect(params);
            }

            if (card.isSideScheme) {
                card.initScheme();
            }

            if (!card.isMinion && !card.attachedTo && controller && controller.gameZone) {
                await controller.gameZone.refresh();
            }

            if (card.isAlly) {
                const getMaxAlliesEffect = new GetMaxAlliesEffect({
                    match: this.match,
                });

                await getMaxAlliesEffect.runEffect(params);
                const allies = player.allies;

                if (allies.length > getMaxAlliesEffect.maxAllies) {
                    const discardFromGameEffect = new DiscardFromGameEffect({
                        target: TARGET_ALLY,
                        match: this.match,
                    });
                    if (this.maxAllyToDiscardId !== undefined) {
                        const allyToDiscard = allies.find(ally =>
                            ally.id === this.maxAllyToDiscardId);
                        if (!allyToDiscard) {
                            throw new Error('El aliado seleccionado para descartar ya no está en juego.');
                        }
                        discardFromGameEffect.selectedTarget = allyToDiscard;
                    }

                    const delayed = new DelayedEffect({
                        selectedTarget: params.effect,
                        effect: discardFromGameEffect,
                        match: this.match,
                    });

                    await delayed.runEffect({
                        ...params,
                        card: card,
                    });
                }
            }

            if (card.triggerInstant) {
                await this.trigger(PRIORITY_CONSTANT, TRIGGER_INSTANT, params);
            }
        }
    }
}