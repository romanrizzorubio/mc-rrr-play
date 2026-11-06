import {
    DIALOG_BOOST_DEALT,
    DIALOG_ENCOUNTERS_REVEAL,
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TRIGGER_BOOST_ICONS_COUNTED,
    TRIGGER_BOOST_REVEALED,
} from 'mc-shared';

import {Effect} from './effect.js';
import {getBoostIconCancellation} from '../utils/boost-icons.js';

export class ResolveBoostEffect extends Effect {
    constructor({
        enemyActivation,
        card,
        cardIndex = 0,
        previousBoost = 0,
    }) {
        super(arguments[0]);

        this.enemyActivation = enemyActivation;
        this.card = card;
        this.cardIndex = cardIndex;
        this.previousBoost = previousBoost;

        this.boostValue = 0;
        this.amplificationIcons = 0;
        this.value = 0;
        this.cancelledBoostIcons = 0;
        this.countReplaced = false;
        this.cancelledBoostAbility = false;
    }
    get boostCountWindows() {
        return [this];
    }
    get id() {
        return this.card.id;
    }
    getResolutionChildEffects() {
        return [...super.getResolutionChildEffects()]
            .filter(effect => effect !== this.enemyActivation);
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.countReplaced = false;
        this.cancelledBoostAbility = false;
    }
    checkTrigger() {
        return !this.countReplaced;
    }
    toTargetObj(params) {
        return {
            ...this.card.toObj(params),
            id: this.card.id,
            boost: this.boostValue,
        };
    }
    toObj(params) {
        return this.toTargetObj(params);
    }
    get hasCancelableBoostIcons() {
        return getBoostIconCancellation(this).remainingBoostIcons > 0;
    }
    get hasBoostAbility() {
        return Boolean(this.card.boostAbility);
    }
    getTriggersInit() {
        return super.getTriggersInit()
            .concat([TRIGGER_BOOST_REVEALED]);
    }
    getTriggersParams(params) {
        return {
            ...super.getTriggersParams(params),
            card: this.card,
            triggeredCard: this.card,
        };
    }
    async resolvePrepared(effectParams, triggersParams) {
        if (await this.trigger(
            PRIORITY_RESPONSE,
            [TRIGGER_BOOST_REVEALED],
            triggersParams,
        )) {
            await super.resolvePrepared(effectParams, triggersParams);
        }
    }
    async showBoostDialog(params, {showUpdatedBoost = false} = {}) {
        const {card, cardIndex, enemyActivation} = this;
        const boostCards = enemyActivation.boostCards;

        if (boostCards.length > 1) {
            const cumulativeBoost = this.previousBoost + this.boostValue;
            const knownEncounterCards =
                this.match?.scenario?.deck?.knownCards;
            const cards = boostCards.map((boostCard, index) => {
                const cardData = boostCard.toObj(params);
                const isFacedown = index > cardIndex;
                const isCurrentCard = index === cardIndex;
                const resolvedBoostResult =
                    enemyActivation.boostResolutionResults?.[index];
                const boostValue = isCurrentCard ?
                    this.boostValue :
                    resolvedBoostResult?.boostValue ?? cardData.boost;
                const appliedAmplificationIcons = isFacedown ?
                    0 :
                    isCurrentCard ?
                        this.amplificationIcons :
                        resolvedBoostResult?.amplificationIcons ?? 0;

                return {
                    card: isFacedown ?
                        {
                            ...cardData,
                            isFacedownCard: true,
                            canPeekFacedown:
                                knownEncounterCards?.includes(boostCard) === true,
                        } :
                            {...cardData, boost: boostValue},
                    appliedAmplificationIcons,
                    horizontal: Boolean(boostCard.isMainScheme || boostCard.isSideScheme),
                    hasBoostAbility: !isFacedown && Boolean(boostCard.boostAbility),
                };
            });

            await this.openPublicDialog({
                dialogType: DIALOG_BOOST_DEALT,
                title: showUpdatedBoost ?
                    'Aumento actualizado' :
                    `Aumento ${cardIndex + 1}/${boostCards.length}`,
                subtitle: showUpdatedBoost ?
                    'Se muestran los iconos de aumento actualizados.' :
                    undefined,
                data: {
                    cards,
                    cumulativeBoost,
                },
            }, params.player);

            return;
        }

        const cardData = card.toObj(params);

        await this.openPublicDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: showUpdatedBoost ? 'Aumento actualizado' : 'Aumento',
            subtitle: showUpdatedBoost ?
                'Se muestran los iconos de aumento actualizados.' :
                undefined,
            data: {
                card: {...cardData, boost: this.boostValue},
                horizontal: Boolean(card.isMainScheme || card.isSideScheme),
                isBoost: true,
                hasBoostAbility: Boolean(card.boostAbility),
                appliedAmplificationIcons: this.amplificationIcons,
            },
        }, params.player);
    }
    async prepare(params) {
        await super.prepare(params);

        const {card} = this;
        this.amplificationIcons = this.match.amplificationIcons;
        this.boostValue = (card.boost || 0) + this.amplificationIcons;

        await this.showBoostDialog(params);
    }
    async execute(params) {
        const {card, enemyActivation} = this;

        if (card.boostAbility && !this.cancelledBoostAbility) {
            const previousBoostValue = this.boostValue;

            await card.boostAbility.resolveAbility({
                ...params,
                activation: this.activation,
                enemyActivation,
                card,
                effect: this,
            });

            if (this.boostValue !== previousBoostValue) {
                await this.showBoostDialog(params, {showUpdatedBoost: true});
            }
        }

        const previousBoostValue = this.boostValue;
        const triggerTypes = [TRIGGER_BOOST_ICONS_COUNTED];
        const triggerParams = {
            ...params,
            card,
            triggeredCard: card,
            countedCard: card,
            effect: this,
        };
        await this.trigger(PRIORITY_CONSTANT, triggerTypes, triggerParams);
        if (await this.trigger(
            PRIORITY_FORCED_INTERRUPT,
            triggerTypes,
            triggerParams
        )) {
            await this.trigger(
                PRIORITY_INTERRUPT,
                triggerTypes,
                triggerParams
            );
        }

        if (this.boostValue !== previousBoostValue && !this.countReplaced) {
            await this.showBoostDialog(params, {showUpdatedBoost: true});
        }
        this.value = this.boostValue;
    }
}