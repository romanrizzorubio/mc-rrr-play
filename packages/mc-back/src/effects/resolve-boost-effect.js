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