import {Effect} from "./effect.js";

export const EFFECT_MODIFY_COST = 'modify-cost';
export class ModifyCostEffect extends Effect {
    constructor({
        count,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    execute(params) {
        const {selectedTarget, count} = this;

        selectedTarget.modifyCost = count;
    }
}