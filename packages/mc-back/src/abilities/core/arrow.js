import {Engine} from "../../engine/engine.js";

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
        await this.cost.runEffect({
            ...params,
            effect: this.cost,
            matchAll: true,
        });

        return this.cost.fullResolved;
    }
    toObj() {
        const {cost} = this;

        return {
            cost
        }
    }
}