import {Effect} from './effect.js';

export class ModifyCostEffect extends Effect {
    constructor({
        count,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(params) {
        const {selectedTarget, count} = this;
        const modifier = this.paramsCalc ?
            await this.calculate(params) :
            count;

        if (!Number.isFinite(modifier)) {
            throw new Error('ModifyCostEffect requires a finite cost modifier.');
        }

        selectedTarget.modifyCost = (selectedTarget.modifyCost ?? 0) + modifier;
    }
}