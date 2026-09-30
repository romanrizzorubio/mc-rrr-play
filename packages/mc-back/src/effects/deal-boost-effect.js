import {Effect} from './effect.js';

export class DealBoostEffect extends Effect {
    constructor({
        enemyActivation,
    }) {
        super(arguments[0]);

        this.enemyActivation = enemyActivation;
    }
    async execute(_params) {
        const {enemyActivation} = this;
        const {enemy} = enemyActivation;

        if (enemy.isVillain ||
            (enemy.isMinion && enemy.villainous)) {
            const cards = await this.match.drawEncounterCards();

            enemyActivation.boostCards = enemyActivation.boostCards.concat(cards);
        }
    }
}