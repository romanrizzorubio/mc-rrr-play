import {checkCondition} from '../engine/utils.js';
import {Effect} from './effect.js';

export class AddAdditionalCostEffect extends Effect {
    constructor({
        cost,
        abilityCondition = {},
        sourceCardOnly = false,
    }) {
        super(arguments[0]);

        if (!cost || Array.isArray(cost) || typeof cost.canRun !== 'function') {
            throw new TypeError('Additional cost must be a single effect.');
        }

        this.cost = cost;
        this.cost.isArrow = true;
        this.abilityCondition = abilityCondition;
        this.sourceCardOnly = sourceCardOnly;
    }
    async canRun(params) {
        const {ability, additionalCosts} = params;
        if (!ability ||
            !Array.isArray(additionalCosts) ||
            (this.sourceCardOnly && ability.card !== this.ability?.card) ||
            !checkCondition(ability, this.abilityCondition)) {
            return false;
        }

        return super.canRun(params);
    }
    execute(params) {
        if (!Array.isArray(params.additionalCosts)) {
            throw new Error('Additional cost resolved outside an ability cost check.');
        }

        params.additionalCosts.push(this.cost);
    }
}
