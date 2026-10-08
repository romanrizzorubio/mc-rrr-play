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
import {enforceRestrictedLimit} from '../utils/enforce-restricted-limit.js';
import {canPlayCard} from '../utils/card-play-utils.js';


export class PutPlayEffect extends Effect {
    constructor({
        card,
        controller,
        maxAllyToDiscardId,
        restrictedCardToDiscardId,
        requirePlayable = false,
    }) {
        super(arguments[0]);

        this.card = card;
        this.controller = controller;
        this.maxAllyToDiscardId = maxAllyToDiscardId;
        this.restrictedCardToDiscardId = restrictedCardToDiscardId;
        this.requirePlayable = requirePlayable;
        this.playabilityFailed = false;
    }
    getCard(params = {}) {
        return this.card || params.selectedCard;
    }
    getController(params) {
        return this.controller || params.player;
    }
    async canRun(params) {
        const card = this.getCard(params);
        if (!this.requirePlayable || !card?.isPlayerCard) {
            return super.canRun(params);
        }

        this.playabilityFailed = false;
        if (!await super.canRun(params)) {
            this.playabilityFailed = true;
            return false;
        }

        this.playabilityFailed = !await canPlayCard(card, {
            ...params,
            player: this.getController(params),
        });

        return !this.playabilityFailed;
    }
    getTriggersEnds(params) {
        if (this.playabilityFailed) {
            return super.getTriggersEnds(params);
        }

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
        const controller = this.getController(params);
        const {selectedTarget} = this;
        this.playabilityFailed = false;

        if (!card) {
            return;
        }

        const isEnteringPlay = !card.isInPlay;
        if (!isEnteringPlay && !params.force) {
            return;
        }

        if (!await this.canPutCardInPlay(card, controller, params)) {
            return;
        }

        await this.resolvePutPlay(
            card,
            controller,
            selectedTarget,
            isEnteringPlay,
            params
        );
    }
    async canPutCardInPlay(card, controller, params) {
        if (this.requirePlayable &&
            card.isPlayerCard &&
            !await canPlayCard(card, {
                ...params,
                player: controller,
            })) {
            this.playabilityFailed = true;
            return false;
        }

        if (card.isPlayerCard && this.match.isUniqueCard(card)) {
            this.playabilityFailed = this.requirePlayable;
            return false;
        }

        return true;
    }
    async resolvePutPlay(card, controller, selectedTarget, isEnteringPlay, params) {
        await this.addToController(card, controller, isEnteringPlay);
        await card.initTriggers(params);
        this.initializeCardState(card);
        await this.attachCard(card, controller, selectedTarget, params);
        await this.enforceRestrictedCardLimit(card, controller);
        this.initializeSideScheme(card);
        await this.refreshControllerZone(card, controller);

        if (card.isAlly) {
            await this.resolveMaxAllies(card, params);
        }

        if (card.triggerInstant) {
            await this.trigger(PRIORITY_CONSTANT, TRIGGER_INSTANT, params);
        }
    }
    async addToController(card, controller, isEnteringPlay) {
        if (!controller) {
            return;
        }

        await this.removeFromOwnerHand(card);
        await this.removeFromOwnerDeck(card);

        if (isEnteringPlay && this.resetsDamageOnEntry(card)) {
            card.damage = 0;
        }

        if (!card.isMinion) {
            controller.gameZone.addToGameZone(card);
        }
        card.controller = controller;
    }
    async removeFromOwnerHand(card) {
        const ownerHand = card.owner?.hand;
        if (!ownerHand?.cards?.includes(card)) {
            return;
        }

        ownerHand.discardHand(card);
        await ownerHand.refresh();
    }
    async removeFromOwnerDeck(card) {
        const ownerDeck = card.owner?.deck;
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
    }
    resetsDamageOnEntry(card) {
        return card.isAlly || card.isMinion || card.isSuperhero || card.isVillain;
    }
    initializeCardState(card) {
        if (card.uses) {
            card.counters = card.uses;
        }

        if (card.toughness) {
            card.setTough();
        }
    }
    async attachCard(card, controller, selectedTarget, params) {
        if (!card.isAttachable || card.card.attach === TARGET_YOU) {
            return;
        }

        const attachEffect = new AttachEffect({
            card,
            selectedTarget,
            player: controller,
            match: this.match,
        });
        await attachEffect.runEffect(params);
    }
    async enforceRestrictedCardLimit(card, controller) {
        if (controller?.isPlayer && card.restricted) {
            await enforceRestrictedLimit(
                controller,
                this.match,
                this.restrictedCardToDiscardId
            );
        }
    }
    initializeSideScheme(card) {
        if (card.isSideScheme) {
            card.initScheme();
        }
    }
    async refreshControllerZone(card, controller) {
        if (!card.isMinion && !card.attachedTo && controller?.gameZone) {
            await controller.gameZone.refresh();
        }
    }
    async resolveMaxAllies(card, params) {
        const {player} = params;
        const getMaxAlliesEffect = new GetMaxAlliesEffect({
            match: this.match,
        });

        await getMaxAlliesEffect.runEffect(params);

        const allies = player.allies;
        if (allies.length <= getMaxAlliesEffect.maxAllies) {
            return;
        }

        const discardFromGameEffect = new DiscardFromGameEffect({
            target: TARGET_ALLY,
            match: this.match,
        });
        this.selectAllyToDiscard(allies, discardFromGameEffect);

        const delayed = new DelayedEffect({
            selectedTarget: params.effect,
            effect: discardFromGameEffect,
            match: this.match,
        });
        await delayed.runEffect({
            ...params,
            card,
        });
    }
    selectAllyToDiscard(allies, discardFromGameEffect) {
        if (this.maxAllyToDiscardId === undefined) {
            return;
        }

        const allyToDiscard = allies.find(ally =>
            ally.id === this.maxAllyToDiscardId);
        if (!allyToDiscard) {
            throw new Error('El aliado seleccionado para descartar ya no está en juego.');
        }
        discardFromGameEffect.selectedTarget = allyToDiscard;
    }
    isResolved() {
        return !this.playabilityFailed;
    }
}