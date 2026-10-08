import {Effect} from './effect.js';

export class ModifyCostEffect extends Effect {
    constructor({
        count,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    execute(_params) {
        const {selectedTarget, count} = this;

        selectedTarget.modifyCost = (selectedTarget.modifyCost ?? 0) + count;
    }
}