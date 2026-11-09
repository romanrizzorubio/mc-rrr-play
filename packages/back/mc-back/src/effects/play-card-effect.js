import {
    ABILITY_ACTION,
    DIALOG_MAX_CARDS,
    DIALOG_PAY_COST,
    DIALOG_SELECT_NUMBER,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
    PLACE_TUCKED,
    RESOURCES_X,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_PLAY_CARD,
    TRIGGER_CARD_ENTER_PLAY,
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
import {
    canPreselectEffectTarget,
    getEffectTargetEntries,
} from '../utils/effect-targets.js';
import {toResourcePaymentCard} from '../utils/resource-requirements.js';

const matchesTargetId = (target, targetId) =>
    target?.id === targetId ||
    target?.parentId === targetId ||
    target?.parent?.id === targetId;

export class PlayCardEffect extends Effect {
    constructor(params) {
        const {card} = params;
        const attachConfig = card.isUpgrade ?
            card.card?.getAttachConfig?.() :
            undefined;
        const controllerTarget = card.card?.controllerTarget;
        const target = controllerTarget ||
            (card.isUpgrade ? attachConfig?.target : params.target);
        const condition = card.isUpgrade && !controllerTarget ?
            attachConfig?.condition :
            params.condition;

        super({...params, target, condition});

        const {
            ability,
            abilityType,
            targetId,
        } = params;
        this.card = card;
        this.ability = ability;
        this.abilityType = abilityType;
        this.targetId = targetId;
        this.hasPreselectedEventTarget = false;
        this.preselectedEventTarget = undefined;
        this.preselectedEventEffects = new Set();

        this.resourcesPaid = [];
        this.resourcesOverpaid = 0;
        this.cardsPaid = undefined;
        this.canceled = false;
        this.cardEffectsCanceled = false;
        this.paymentCancelled = false;
        this.prePlayConfirmationAcceptedFor = undefined;
        this.modifyCost = 0;
        this.ignoreResourceCost = params.ignoreResourceCost ?? false;
        if (typeof this.ignoreResourceCost !== 'boolean') {
            throw new TypeError(
                'PlayCardEffect ignoreResourceCost must be a boolean.'
            );
        }
        this.printedCost = card.cost;
        this.xValue = undefined;
        this.removedFromHand = false;
        this.removedFromPlace = undefined;
        this.playedFromHand = false;
        this.workInHandTriggersInitializedForPlay = false;
        this.played = false;
        this.maxAlliesDialogAccepted = false;
        this.maxAllyToDiscardId = undefined;
        this.restrictedDialogAccepted = false;
        this.restrictedCardToDiscardId = undefined;
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

        if (this.match.isPlayerRestrictedByPeril?.(player)) {
            return false;
        }

        if (this.ignoreResourceCost && card.requirement?.length) {
            return false;
        }

        if (card.isPlayerCard && this.match.isUniqueCard(card)) {
            return false;
        }

        if (ability) {
            if (typeof player?.canPlayCard === 'function' &&
                !await player.canPlayCard({
                    card,
                    playCardEffect: this,
                })) {
                return false;
            }
        } else if (!await card.canPlay({
            player,
            abilityType,
            card,
            playCardEffect: this,
            checkOnly: params.checkOnly,
            checkPlayRestrictions: true,
        })) {
            return false;
        }

        return this.checkRestrictedCardLimit(params);
    }
    async checkRestrictedCardLimit(params) {
        if (params.checkOnly || !this.card.isPlayerCard ||
            !this.card.restricted || this.card.isEvent ||
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
            targetPlayer: player,
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

            if (card.card?.controllerTarget) {
                return target?.isPlayer &&
                    (!card.card.maximum ||
                        !target.getPrintedCard(card.card.id));
            }

            if (card.isUpgrade) {
                return card.card.createAttachEffect(card).filterTarget(
                    target,
                    {player, effect: this, match: this.match},
                );
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
    async triggerInit(params) {
        // Cost-modifying constants run before payment; play interrupts do not.
        return this.trigger(PRIORITY_CONSTANT, this.getTriggersInit(), params);
    }
    async triggerPlayCardInterrupts(params) {
        const triggerTypes = this.getTriggersInit();

        if (!await this.trigger(
            PRIORITY_FORCED_INTERRUPT,
            triggerTypes,
            params
        )) {
            return false;
        }

        return this.trigger(PRIORITY_INTERRUPT, triggerTypes, params);
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
    selectTarget(params) {
        return super.selectTarget({
            ...params,
            targetPlayer: params.targetPlayer || params.player,
        });
    }
    async preselectDroppedTarget(params) {
        const {card, targetId} = this;

        if (targetId === undefined) {
            return;
        }

        if (card.isEvent) {
            this.ability ??= await this.selectAbility(params);
            const abilityEffect = this.ability?.effect;

            if (!abilityEffect) {
                throw new Error('La carta no tiene un objetivo de evento válido.');
            }

            abilityEffect.resetResolutionState();
            const targetEntries = await getEffectTargetEntries(
                abilityEffect,
                {
                    ...params,
                    ability: this.ability,
                    card,
                    match: this.match,
                    playCardEffect: this,
                }
            );
            let targetFound = false;

            targetEntries.forEach(({deferred, effect, targets}) => {
                const target = targets.flat(Infinity).find(candidate =>
                    matchesTargetId(candidate, targetId)
                );
                if (!target) {
                    return;
                }

                targetFound = true;
                if (canPreselectEffectTarget(effect)) {
                    this.hasPreselectedEventTarget = true;
                    this.preselectedEventTarget = target;
                    if (!deferred) {
                        effect.selectedTarget = target;
                        this.preselectedEventEffects.add(effect);
                    }
                }
            });

            if (!targetFound) {
                throw new Error('El objetivo seleccionado para jugar la carta ya no es válido.');
            }

            return;
        }

        if (!this.target) {
            throw new Error('La carta no admite el objetivo seleccionado.');
        }

        const target = (await this.getValidTarget({
            ...params,
            card,
            match: this.match,
        })).flat(Infinity).find(candidate =>
            matchesTargetId(candidate, targetId)
        );
        if (!target) {
            throw new Error('El objetivo seleccionado para jugar la carta ya no es válido.');
        }

        this.selectedTarget = target;
    }
    async doPlay(params) {
        const {card, ability, selectedTarget} = this;
        const {player} = params;

        this.played = true;
        if (player.config?.aspectMarkerRules) {
            player.superhero.addAspectMarkersFromCard(
                card,
                TRIGGER_YOU_PLAY_CARD
            );
        }

        if (card.isEvent) {
            await ability.resolveAbility({
                ...params,
                playCardEffect: this,
                cancelEffects: this.cardEffectsCanceled,
                ...(this.preselectedEventTarget ? {
                    preselectedEventTarget: this.preselectedEventTarget,
                } : {}),
                prePlayConfirmationAcceptedFor:
                    this.prePlayConfirmationAcceptedFor,
                preselectedEffectTargets: this.preselectedEventEffects,
            });

            if (ability.paymentCancelled) {
                this.played = false;
                this.canceled = true;
                this.paymentCancelled = true;
                return;
            }

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
    cancelEffects() {
        this.cardEffectsCanceled = true;
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
        const cost = await this.getCost({
            ...params,
            card: this.card,
        });
        const requiredPaymentResources = await
            this.ability?.effect?.getRequiredPaymentResources?.({
                ...params,
                ability: this.ability,
                card: this.card,
                match: this.match,
                playCardEffect: this,
            }) ?? [];
        if (!Array.isArray(requiredPaymentResources)) {
            throw new TypeError(
                'PlayCardEffect requires an array of payment resources.'
            );
        }
        if (cost === RESOURCES_X && this.ignoreResourceCost) {
            const response = await this.openDialog({
                dialogType: DIALOG_SELECT_NUMBER,
                targetPlayer: params.player,
                title: `Elige X para ${this.card.name}`,
                subtitle: 'Elige el valor de X antes de aplicar las reducciones de coste.',
                data: {
                    label: 'Valor de X',
                    min: 0,
                    step: 1,
                },
            });
            const selectedX = response?.value;
            if (!Number.isSafeInteger(selectedX) || selectedX < 0) {
                throw new Error('PlayCardEffect received an invalid value for X.');
            }

            if (!Number.isSafeInteger(this.modifyCost)) {
                throw new Error('PlayCardEffect has an invalid cost modifier for X.');
            }
            this.xValue = selectedX - this.modifyCost;
            if (this.xValue < 0) {
                throw new Error('PlayCardEffect calculated a negative value for X.');
            }

            return new ResourceCost({
                amount: 0,
                card: this.card,
                match: this.match,
                playCardEffect: this,
                requirement: requiredPaymentResources,
                resourceType: this.card.resourceType,
            });
        }

        const amount = this.ignoreResourceCost ?
            0 :
            cost === RESOURCES_X ?
                RESOURCES_X :
                cost + this.modifyCost;

        return new ResourceCost({
            allowOverpay: this.ignoreResourceCost ?
                false :
                this.card.card?.allowOverpay ??
                    this.card.allowOverpay ??
                    false,
            amount: amount === RESOURCES_X ? RESOURCES_X : Math.max(0, amount),
            card: this.card,
            match: this.match,
            playCardEffect: this,
            requirement: [
                ...(this.ignoreResourceCost ? [] : this.card.requirement || []),
                ...requiredPaymentResources,
            ],
        });
    }
    getPaymentResourcePreferences() {
        const effects = [
            this.ability?.effect,
            ...this.card.currentSide.abilities
                .filter(ability => ability.trigger === TRIGGER_CARD_ENTER_PLAY)
                .map(ability => ability.effect),
        ].filter(Boolean);
        const preferences = [
            ...super.getPaymentResourcePreferences(),
            ...effects.flatMap(effect =>
                effect.getPaymentResourcePreferences()),
        ];

        return [...new Set(preferences)];
    }
    getExclusivePaymentResourcePreferences() {
        const effects = [
            this.ability?.effect,
            ...this.card.currentSide.abilities
                .filter(ability => ability.trigger === TRIGGER_CARD_ENTER_PLAY)
                .map(ability => ability.effect),
        ].filter(Boolean);
        const preferences = [
            ...super.getExclusivePaymentResourcePreferences(),
            ...effects.flatMap(effect =>
                effect.getExclusivePaymentResourcePreferences()),
        ];
        const exclusivePreferences = [...new Set(preferences)];
        if (exclusivePreferences.length) {
            return exclusivePreferences;
        }

        const resourcePreferences = this.getPaymentResourcePreferences();
        return resourcePreferences.length === 1 ?
            resourcePreferences :
            [];
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
        const exclusiveResourcePreferences =
            this.getExclusivePaymentResourcePreferences();
        const excludedCardIds = session ?
            session.getResourcePaymentExcludedCardIds() :
            new Set();
        const resourceUsage = session?.getRemainingResources();
        const costOnlyResourceUsage =
            session?.getRemainingCostOnlyResourceIndexes();
        const cardsToPay = await player.getCardsToPay(
            card,
            cost.resourceType,
            excludedCardIds,
            resourceUsage,
            {costOnlyResourceUsage},
        );
        const response = await this.openDialog({
            dialogType: DIALOG_PAY_COST,
            showCancel: true,
            targetPlayer: player,
            data: {
                cost: cost.amount,
                requirement: cost.requirement,
                resourceType: cost.resourceType,
                resourcePreferences,
                exclusiveResourcePreferences,
                resourceSelectionMode: Boolean(session),
                card: card.toObj(),
                cards: {
                    generators: cardsToPay.generators
                        .map(_card => _card.toObj(arguments[0])),
                    hand: cardsToPay.hand
                        .map(_card => toResourcePaymentCard(_card, {}, {
                            cardToPay: card,
                        })),
                }
            },
        });

        if (response) {
            const {paid, resources, resourceUnits} = response;

            this.resourcesPaid = resources;
            this.cardsPaid = {
                hand: paid.hand
                    .map(card => player.hand.getCard(card.id)),
                generators: paid.generators.map(card => {
                    const generator = cardsToPay.generators.find(candidate =>
                        candidate.id === card.id);
                    if (!generator) {
                        throw new Error(
                            'El generador seleccionado ya no está disponible para el pago.'
                        );
                    }

                    return generator;
                }),
            };

            return {
                ...this.cardsPaid,
                resources,
                resourceUnits,
            };
        } else {
            this.canceled = true;
            this.paymentCancelled = true;
        }
    }
    async prepare(params) {
        const {card} = this;
        const {player} = params;

        this.xValue = undefined;
        this.resourcesPaid = [];
        this.resourcesOverpaid = 0;
        this.playedFromHand = false;
        card.isPlaying = true;
        const hasUnregisteredWorkInHandAbility = card.abilities?.some(ability =>
            ability.workInHand &&
            !card.hasAbilityTrigger(ability)) ?? false;
        if (hasUnregisteredWorkInHandAbility) {
            await card.initTriggers(params, {workInHandOnly: true});
            this.workInHandTriggersInitializedForPlay = true;
        }

        await this.preselectDroppedTarget(params);

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
                const sourceContainer = source.place === PLACE_HAND ?
                    sourcePlayer.hand :
                    source.place === PLACE_TUCKED ?
                        source.host :
                        sourcePlayer.deck;
                if (source.place === PLACE_DECK ||
                    source.place === PLACE_DISCARD_PILE) {
                    await sourcePlayer.deck.checkCycle?.();
                }
                await sourceContainer.refresh();
            }
        }
        this.playedFromHand = this.removedFromHand ||
            this.removedFromPlace?.place === PLACE_HAND;

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
            const {cards, index, place, player: sourcePlayer, host} =
                this.removedFromPlace;

            if (!cards.includes(card)) {
                cards.splice(index, 0, card);
            }
            this.removedFromPlace = undefined;
            const sourceContainer = place === PLACE_HAND ?
                sourcePlayer.hand :
                place === PLACE_TUCKED ?
                    host :
                    sourcePlayer.deck;
            await sourceContainer.refresh();
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
    async selectAbility(params) {
        const {card, abilityType} = this;
        const abilities = card.isEvent && abilityType === ABILITY_ACTION ?
            await card.getAbilitiesType(ABILITY_ACTION, {
                ...params,
                card,
                match: this.match,
                playCardEffect: this,
            }) :
            card.abilities;
        if (card.isEvent && !abilities.length) {
            const error = new Error('El evento no tiene una capacidad disponible para esta jugada.');
            error.statusCode = 409;
            throw error;
        }
        return new Promise(resolve => {
            if (card.isEvent) {
                if (abilities.length > 1) {
                    // TODO: Implement dialog to select ability when event has multiple abilities
                    console.error('ELEGIR CAPACIDAD (MULTIPLE ABILITIES NOT YET SUPPORTED)');
                    return resolve(abilities[0]);
                } else {
                    return resolve(abilities[0]);
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
            await this.ability.prepareToResolve({
                ...params,
                playCardEffect: this,
                ...(this.hasPreselectedEventTarget ? {
                    preselectedTarget: this.preselectedEventEffects.size > 0,
                    preselectedEffectTargets: this.preselectedEventEffects,
                    preselectedEventTarget: this.preselectedEventTarget,
                } : {}),
            }) :
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
            this.resourcesOverpaid = 0;
            this.cardsPaid = undefined;
            this.canceled = true;
            card.isPlaying = false;
        } else {
            const triggerParams = this.getTriggersParams(paymentParams);
            if (!await this.triggerPlayCardInterrupts(triggerParams)) {
                this.canceled = true;
                card.isPlaying = false;
                return;
            }

            await this.doPlay({
                ...paymentParams,
                card,
                preselectedTarget: abilityState.preselectedTarget,
                arrowPaid: true,
            });
        }
    }
}