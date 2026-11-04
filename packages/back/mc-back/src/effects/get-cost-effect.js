import {RESOURCES_X} from 'mc-shared';
import {Effect} from './effect.js';

export class GetCostEffect extends Effect {
    constructor({}) {
        super(arguments[0]);

        this.cost = 0;
        this.modifyCost = 0;
    }
    async execute(_params) {
        const {selectedTarget, modifyCost} = this;

        this.cost = selectedTarget.cost === RESOURCES_X ?
            RESOURCES_X :
            selectedTarget.cost + modifyCost;
    }
}