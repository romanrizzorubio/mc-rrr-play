import {Effect} from './effect.js';

export class DealBoostEffect extends Effect {
    constructor({
        enemyActivation,
    }) {
        super(arguments[0]);

        this.enemyActivation = enemyActivation;
    }
    async execute(params) {
        const selectedActivation = this.selectedTarget?.boostCards ?
            this.selectedTarget :
            undefined;
        const contextActivation = params.effect?.boostCards ?
            params.effect :
            undefined;
        const enemyActivation = this.enemyActivation ||
            selectedActivation ||
            contextActivation;
        if (!enemyActivation?.enemy || !Array.isArray(enemyActivation.boostCards)) {
            throw new Error('DealBoostEffect requires an enemy activation.');
        }
        const {enemy} = enemyActivation;

        if (enemy.isVillain ||
            (enemy.isMinion && enemy.villainous)) {
            const cards = await this.match.drawEncounterCards();

            enemyActivation.boostCards = enemyActivation.boostCards.concat(cards);
        }
    }
}