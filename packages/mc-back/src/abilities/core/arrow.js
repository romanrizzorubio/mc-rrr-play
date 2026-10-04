import {Engine} from '../../engine/engine.js';
import {CostPaymentSession} from '../../utils/cost-payment-session.js';

export class Arrow extends Engine {
    constructor({
// Arrow
        cost,
    }) {
        super(arguments[0]);

        this.cost = cost;
        this.paymentCancelled = false;
        this.paymentBlocked = false;
    }
    canPay(params) {
        return this.cost.canRun({
            ...params,
            matchAll: true
        });
    }
    async pay(params) {
        const session = new CostPaymentSession();
        this.paymentCancelled = false;
        this.paymentBlocked = false;

        const result = await session.resolve(this.cost, params, {
            requireAllCosts: true,
        });
        this.paymentCancelled = result.cancelled;
        this.paymentBlocked = result.blocked;

        if (result.resolved) {
            const outputParams = this.cost.outputParams || [];
            outputParams.forEach(param => {
                params[param] = result.effectParams[param];
            });
        }

        return result.resolved;
    }
    toObj() {
        const {cost} = this;

        return {
            cost
        };
    }
}