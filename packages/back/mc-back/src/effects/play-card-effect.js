import {
    DIALOG_MAX_CARDS,
    DIALOG_PAY_COST,
    PLACE_HAND,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_PLAY_CARD,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_THIS_END_PLAY_CARD,
    TRIGGER_THIS_PLAY_CARD,
    TRIGGER_YOU_PLAY_CARD,
    TRIGGER_YOU_END_PLAY_CARD,
} from 'mc-shared';

import {Effect} from './effect.js';
import {PutPlayEffect} from './put-play-effect.js';
import {GetCostEffect} from './get-cost-effect.js';
import {getRestrictedCards} from '../utils/enforce-restricted-limit.js';
import {getPlayerCardPlayFromLocation} from '../utils/player-card-play-from.js';
import {CostGroup} from '../model/costs/cost-group.js';
import {ResourceCost} from '../model/costs/resource-cost.js';

export class PlayCardEffect extends Effect {
    constructor({
        card,
        ability,
        abilityType,
    }) {
        super(arguments[0]);

        this.card = card;
        this.ability = ability;
        this.abilityType = abilityType;

        this.resourcesPaid = [];
        this.cardsPaid = undefined;
        this.canceled = false;
        this.paymentCancelled = false;
        this.prePlayConfirmationAcceptedFor = undefined;
        this.modifyCost = 0;
        this.removedFromHand = false;
        this.removedFromPlace = undefined;
        this.workInHandTriggersInitializedForPlay = false;
        this.played = false;
        this.maxAlliesDialogAccepted = false;
        this.maxAllyToDiscardId = undefined;
        this.restrictedDialogAccepted = false;
        this.restrictedCardToDiscardId = undefined;

        if (card.isUpgrade) {
            this.target = card.card.controllerTarget || card.card.attach;
        }
    }
    get isAttack() {
        return false;
    }
    get isThwart() {
        return false;
    }
    async canRun(params) {
        const {card, ability, abilityType} = this;
        const {player} = params;

        if (card.isPlayerCard && this.match.isUniqueCard(card)) {
            return false;
        }

        if (!ability && !await card.canPlay({
            player,
            abilityType,
            card,
            playCardEffect: this,
        })) {
            return false;
        }

        return this.checkRestrictedCardLimit(params);
    }
    async checkRestrictedCardLimit(params) {
        if (!this.card.isPlayerCard || !this.card.restricted || this.card.isEvent ||
            this.restrictedDialogAccepted) {
            return true;
        }

        const {player} = params;
        if (!player?.gameZone?.cards) {
            throw new TypeError('Restricted-card play requires a player game zone.');
        }

        const restrictedCards = getRestrictedCards(player);
        if (restrictedCards.length < 2) {
            return true;
        }

        const response = await this.openDialog({
            dialogType: DIALOG_MAX_CARDS,
            title: 'Cartas restringidas',
            showCancel: true,
            data: {
                cards: restrictedCards.map(card => card.toObj(params)),
            },
        });

        if (response?.accepted) {
            this.restrictedDialogAccepted = true;
            this.restrictedCardToDiscardId = response.selected?.id;
        }

        return response?.accepted === true;
    }
    async confirmBeforePlay(params) {
        const effect = this.ability?.effect;
        if (!effect ||
            typeof effect.confirmBeforeResolve !== 'function') {
            return true;
        }

        const confirmed = await effect.confirmBeforeResolve(params);
        this.prePlayConfirmationAcceptedFor =
            confirmed ?
                effect :
                undefined;

        return confirmed;
    }
    filterTarget(target, {player}) {
        if (super.filterTarget.apply(this, arguments)) {
            const {card} = this;

            if (card.isUpgrade) {
                if (card.card.controllerTarget) {
                    return target?.isPlayer &&
                        !target.getPrintedCard(card.card.id);
                }
                return card.canAttach(target, player);
            }

            return true;
        }

        return false;
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([
                TRIGGER_PLAY_CARD,
                TRIGGER_YOU_PLAY_CARD,
                TRIGGER_THIS_PLAY_CARD,
            ]);
    }
    getTriggersEnds() {
        return super.getTriggersEnds()
            .concat([
                TRIGGER_END_PLAY_CARD,
                TRIGGER_YOU_END_PLAY_CARD,
                TRIGGER_THIS_END_PLAY_CARD,
            ]);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.card,
        };
    }
    async doPlay(params) {
        const {card, ability, selectedTarget} = this;
        const {player} = params;

        this.played = true;

        if (card.isEvent) {
            await ability.resolveAbility({
                ...params,
                playCardEffect: this,
                prePlayConfirmationAcceptedFor:
                    this.prePlayConfirmationAcceptedFor,
            });

            await player.deck.discard(card);
        } else {
            const putPlayEffect = new PutPlayEffect({
                card,
                selectedTarget,
                controller: card.card.controllerTarget ?
                    selectedTarget :
                    player,
                maxAllyToDiscardId: this.maxAllyToDiscardId,
                restrictedCardToDiscardId: this.restrictedCardToDiscardId,
                match: this.match,
            });

            await putPlayEffect.runEffect({
                ...params,
                effect: this,
                card,
            });
        }
        card.isPlaying = false;
        if (player.hand.cards.includes(card)) {
            player.hand.discardHand(card);
        }
        if (this.workInHandTriggersInitializedForPlay && !card.isInPlay) {
            card.endTriggers();
        }
        this.workInHandTriggersInitializedForPlay = false;
        this.removedFromHand = false;
        this.removedFromPlace = undefined;
        await player.hand.refresh();
    }
    async getCost(params) {
        const {card} = params;

        const getCostEffect = new GetCostEffect({
            selectedTarget: card,
            match: this.match,
        });

        await getCostEffect.runEffect(params);

        return getCostEffect.cost;
    }
    async getResourceCost(params) {
        const amount = await this.getCost({
            ...params,
            card: this.card,
        }) + this.modifyCost;

        return new ResourceCost({
            amount: Math.max(0, amount),
            card: this.card,
            match: this.match,
            playCardEffect: this,
        });
    }
    getPaymentResourcePreferences() {
        const effects = [
            this.ability?.effect,
            ...this.card.currentSide.abilities
                .filter(ability => ability.trigger === TRIGGER_THIS_ENTER_PLAY)
                .map(ability => ability.effect),
        ].filter(Boolean);
        const preferences = [
            ...super.getPaymentResourcePreferences(),
            ...effects.flatMap(effect =>
                effect.getPaymentResourcePreferences()),
        ];

        return [...new Set(preferences)];
    }
    isResolved() {
        return !this.canceled;
    }
    isFullResolved() {
        return !this.canceled;
    }
    async payCost(params, session, resourceCost) {
        const {card} = this;
        const {player} = params;

        const cost = resourceCost || await this.getResourceCost(params);
        if (!cost.requiresPayment) {
            return;
        }

        const resourcePreferences = this.getPaymentResourcePreferences();
        const excludedCardIds = session ?
            session.getResourcePaymentExcludedCardIds() :
            new Set();
        const resourceUsage = session?.getRemainingResources();
        const cardsToPay = await player.getCardsToPay(
            card,
            undefined,
            excludedCardIds,
            resourceUsage
        );
        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            showCancel: true,
            data: {
                cost: cost.amount,
                requirement: card.requirement,
                resourcePreferences,
                resourceSelectionMode: Boolean(session),
                card: card.toObj(),
                cards: {
                    generators: cardsToPay.generators
                        .map(_card => _card.toObj(arguments[0])),
                    hand: cardsToPay.hand
                        .map(_card => _card.toObj({card})),
                }
            },
        });

        if (response) {
            const {paid, resources} = response;

            this.resourcesPaid = resources;
            this.cardsPaid = {
                hand: paid.hand
                    .map(card => player.hand.getCard(card.id)),
                generators: paid.generators
                    .map(card => player.getCard(card.id)),
            };

            return {
                ...this.cardsPaid,
                resources,
            };
        } else {
            this.canceled = true;
            this.paymentCancelled = true;
        }
    }
    async prepare(params) {
        const {card} = this;
        const {player} = params;

        card.isPlaying = true;
        const hasUnregisteredWorkInHandAbility = card.abilities?.some(ability =>
            ability.workInHand &&
            !card.hasAbilityTrigger(ability)) ?? false;
        if (hasUnregisteredWorkInHandAbility) {
            await card.initTriggers(params, {workInHandOnly: true});
            this.workInHandTriggersInitializedForPlay = true;
        }

        this.removedFromHand = player.hand.cards.includes(card);
        if (this.removedFromHand) {
            player.hand.discardHand(card);
            await player.hand.refresh();
        } else {
            const sourcePlayer = card.owner ?? player;
            const source = getPlayerCardPlayFromLocation(
                card,
                card.card.playFrom,
                sourcePlayer
            );
            if (source) {
                source.cards.splice(source.index, 1);
                this.removedFromPlace = source;
                await (source.place === PLACE_HAND ?
                    sourcePlayer.hand :
                    sourcePlayer.deck).refresh();
            }
        }

        await super.prepare(params);
    }
    async returnToSource(player) {
        const {card} = this;
        const returnedToHand = this.removedFromHand ||
            this.removedFromPlace?.place === PLACE_HAND;

        card.isPlaying = false;
        if (this.removedFromHand) {
            if (!player.hand.cards.includes(card)) {
                player.hand.addCard(card);
            }
            this.removedFromHand = false;
            await player.hand.refresh();
        } else if (this.removedFromPlace) {
            const {cards, index, place, player: sourcePlayer} =
                this.removedFromPlace;

            if (!cards.includes(card)) {
                cards.splice(index, 0, card);
            }
            this.removedFromPlace = undefined;
            await (place === PLACE_HAND ?
                sourcePlayer.hand :
                sourcePlayer.deck).refresh();
        }

        if (this.workInHandTriggersInitializedForPlay &&
            !returnedToHand &&
            !card.isInPlay) {
            card.endTriggers();
        }
        this.workInHandTriggersInitializedForPlay = false;
    }
    async runEffect(params) {
        try {
            if (!await this.confirmBeforePlay(params)) {
                this.canceled = true;
                this.paymentCancelled = true;
                return;
            }

            await super.runEffect(params);
        } finally {
            if (!this.played) {
                this.canceled = true;
                await this.returnToSource(params.player);
            }
        }
    }
    selectAbility() {
        return new Promise(resolve => {
            const {card} = this;

            if (card.isEvent) {
                if (card.abilities.length > 1) {
                    // TODO: Implement dialog to select ability when event has multiple abilities
                    console.error('ELEGIR CAPACIDAD (MULTIPLE ABILITIES NOT YET SUPPORTED)');
                    return resolve(card.abilities[0]);
                } else {
                    return resolve(card.abilities[0]);
                }
            } else {
                return resolve();
            }
        });
    }
    async execute(params) {
        const {card, selectedTarget, target} = this;

        if (!this.ability) {
            this.ability = await this.selectAbility(params);
        }

        if (target && (selectedTarget === null || selectedTarget === undefined)) {
            this.canceled = true;
            card.isPlaying = false;
            return;
        }

        const abilityState = this.ability ?
            await this.ability.prepareToResolve(params) :
            {
                canRun: true,
                preselectedTarget: false,
            };

        if (!abilityState.canRun) {
            this.canceled = true;
            card.isPlaying = false;
            return;
        }

        const resourceCost = await this.getResourceCost(params);
        const costs = [
            resourceCost,
            this.ability?.costs,
        ].filter(Boolean);
        const paymentCost = new CostGroup({
            ability: this.ability,
            costs,
            match: this.match,
        });
        const paymentParams = {
            ...params,
            ability: this.ability,
            card,
            playCardEffect: this,
        };
        const payment = await paymentCost.pay(paymentParams, paymentParams);

        if (!payment.resolved) {
            this.paymentCancelled = payment.cancelled;
            this.resourcesPaid = [];
            this.cardsPaid = undefined;
            this.canceled = true;
            card.isPlaying = false;
        } else {
            await this.doPlay({
                ...paymentParams,
                card,
                preselectedTarget: abilityState.preselectedTarget,
                arrowPaid: true,
            });
        }
    }
}