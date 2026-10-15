import {Cost} from '../../model/costs/cost.js';
import {COST_TYPE_ARROW} from '../../model/costs/cost-constants.js';

export class Arrow extends Cost {
    constructor({
// Arrow
        cost,
        match = cost.match,
    }) {
        super({
            type: COST_TYPE_ARROW,
            match,
        });

        this.cost = cost;
        this.markEffectAsCost(cost);
    }
    async getEffect(params = {}) {
        return this.markEffectAsCost(
            this.cost,
            params.ability || this.ability
        );
    }
    async getCost(params) {
        return this.getEffect(params);
    }
    async pay(params, paramsToUpdate = params, preparedEffect) {
        const result = await super.pay(params, paramsToUpdate, preparedEffect);
        this.paymentCancelled = result.cancelled;
        this.paymentBlocked = result.blocked;

        return result.resolved;
    }
    toObj() {
        const {cost} = this;

        return {
            cost
        };
    }
}