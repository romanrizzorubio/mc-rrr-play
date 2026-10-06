import {DIALOG_BOOST_DEALT, DIALOG_ENCOUNTERS_REVEAL} from 'mc-shared';

import {Effect} from './effect.js';

export class ResolveBoostEffect extends Effect {
    constructor({
        enemyActivation,
        card,
        cardIndex = 0,
    }) {
        super(arguments[0]);

        this.enemyActivation = enemyActivation;
        this.card = card;
        this.cardIndex = cardIndex;

        this.value = 0;
    }
    async prepare(params) {
        await super.prepare(params);

        const {card, cardIndex, enemyActivation} = this;
        const boostCards = enemyActivation.boostCards;

        if (boostCards.length > 1) {
            const cumulativeBoost = boostCards.reduce((total, boostCard, index) =>
                index <= cardIndex ? total + (boostCard.boost || 0) : total, 0);
            const cards = boostCards.map((boostCard, index) => index <= cardIndex ? {
                card: boostCard.toObj(params),
                horizontal: Boolean(boostCard.isMainScheme || boostCard.isSideScheme),
                hasBoostAbility: Boolean(boostCard.boostAbility),
            } : null);

            await this.openDialog({
                dialogType: DIALOG_BOOST_DEALT,
                title: `${enemyActivation.enemy.name} resuelve carta de aumento ${cardIndex + 1} de ${boostCards.length}`,
                data: {
                    cards,
                    cumulativeBoost,
                },
            });

            return;
        }

        await this.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Mostrando carta de Aumento',
            data: {
                card: card.toObj(params),
                horizontal: Boolean(card.isMainScheme || card.isSideScheme),
                isBoost: true,
                hasBoostAbility: Boolean(card.boostAbility),
            },
        });
    }
    async execute(params) {
        const {card, enemyActivation} = this;

        if (card.boostAbility) {
            await card.boostAbility.resolveAbility({
                ...params,
                activation: this.activation,
                enemyActivation,
                card,
            });
        }

        this.value = card.boost || 0;
    }
}