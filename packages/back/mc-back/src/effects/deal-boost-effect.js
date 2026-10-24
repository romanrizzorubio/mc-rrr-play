import {Effect} from './effect.js';

export class DealBoostEffect extends Effect {
    constructor({
        enemyActivation,
        count = 1,
    }) {
        super(arguments[0]);

        this.enemyActivation = enemyActivation;
        this.count = count;
    }
    getResolutionChildEffects() {
        return [...super.getResolutionChildEffects()]
            .filter(effect => effect !== this.enemyActivation);
    }
    async execute(params) {
        const selectedActivation = this.selectedTarget?.boostCards ?
            this.selectedTarget :
            undefined;
        const effectActivation = params.effect?.boostCards ?
            params.effect :
            undefined;
        const parameterActivation = params.enemyActivation?.boostCards ?
            params.enemyActivation :
            undefined;
        const enemyActivation = this.enemyActivation ||
            selectedActivation ||
            effectActivation ||
            parameterActivation;
        if (!enemyActivation?.enemy || !Array.isArray(enemyActivation.boostCards)) {
            throw new Error('DealBoostEffect requires an enemy activation.');
        }
        const {enemy} = enemyActivation;
        const count = this.paramsCalc ?
            await this.calculate(params) :
            this.count;
        if (!Number.isInteger(count) || count < 0) {
            throw new RangeError(
                'DealBoostEffect requires a non-negative integer count.'
            );
        }

        if (enemy.isVillain ||
            (enemy.isMinion && enemy.villainous)) {
            if (count > 0) {
                const cards = await this.match.drawEncounterCards(count);

                enemyActivation.boostCards.push(...cards);
            }
        }
    }
}