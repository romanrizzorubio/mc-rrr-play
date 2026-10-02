import {DIALOG_ENCOUNTERS_REVEAL} from 'mc-shared';

import {Effect} from './effect.js';

export class ResolveBoostEffect extends Effect {
    constructor({
        enemyActivation,
        card,
    }) {
        super(arguments[0]);

        this.enemyActivation = enemyActivation;
        this.card = card;

        this.value = 0;
    }
    async prepare(params) {
        await super.prepare(params);

        const {card} = this;

        await this.openDialog({
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Mostrando carta de Aumento',
            data: {
                card: card.toObj(params),
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
                enemyActivation,
                card,
            });
        }

        this.value = card.boost || 0;
    }
}