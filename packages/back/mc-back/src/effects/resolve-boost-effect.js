import {
    DIALOG_BOOST_DEALT,
    DIALOG_ENCOUNTERS_REVEAL,
    PRIORITY_RESPONSE,
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
        this.value = 0;
        this.cancelledBoostIcons = 0;
        this.cancelledBoostAbility = false;
    }
    getResolutionChildEffects() {
        return [...super.getResolutionChildEffects()]
            .filter(effect => effect !== this.enemyActivation);
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cancelledBoostAbility = false;
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
            const cards = boostCards.map((boostCard, index) => {
                const cardData = boostCard.toObj(params);
                const isFacedown = index > cardIndex;

                return {
                    card: isFacedown ?
                        {
                            ...cardData,
                            isFacedownCard: true,
                            canPeekFacedown: true,
                        } :
                        showUpdatedBoost && index === cardIndex ?
                            {...cardData, boost: this.boostValue} :
                            cardData,
                    horizontal: Boolean(boostCard.isMainScheme || boostCard.isSideScheme),
                    hasBoostAbility: !isFacedown && Boolean(boostCard.boostAbility),
                };
            });

            await this.openDialog({
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
            });

            return;
        }

        const cardData = card.toObj(params);

        await this.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: showUpdatedBoost ? 'Aumento actualizado' : 'Aumento',
            subtitle: showUpdatedBoost ?
                'Se muestran los iconos de aumento actualizados.' :
                undefined,
            data: {
                card: showUpdatedBoost ?
                    {...cardData, boost: this.boostValue} :
                    cardData,
                horizontal: Boolean(card.isMainScheme || card.isSideScheme),
                isBoost: true,
                hasBoostAbility: Boolean(card.boostAbility),
            },
        });
    }
    async prepare(params) {
        await super.prepare(params);

        const {card} = this;
        this.boostValue = (card.boost || 0) + this.match.amplificationIcons;

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

        this.value = this.boostValue;
    }
}