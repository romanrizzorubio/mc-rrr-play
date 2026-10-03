import {Engine} from '../../engine/engine.js';

export class Arrow extends Engine {
    constructor({
// Arrow
        cost,
    }) {
        super(arguments[0]);

        this.cost = cost;
    }
    canPay(params) {
        return this.cost.canRun({
            ...params,
            matchAll: true
        });
    }
    async pay(params) {
        const costParams = {
            ...params,
            effect: this.cost,
            matchAll: true,
        };
        await this.cost.runEffect(costParams);
        const outputParams = this.cost.outputParams || [];
        outputParams.forEach(param => {
            params[param] = costParams[param];
        });

        return this.cost.fullResolved;
    }
    toObj() {
        const {cost} = this;

        return {
            cost
        };
    }
}