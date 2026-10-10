import {
    EFFECT_SIMULTANEOUS,
    PRIORITY_CONSTANT,
    TRIGGER_ABILITY_COST,
} from 'mc-shared';
import {Engine} from '../../engine/engine.js';
import {CostPaymentSession} from '../../utils/cost-payment-session.js';
import {SimultaneousEffect} from '../../effects/simultaneous-effect.js';

export class Arrow extends Engine {
    constructor({
// Arrow
        cost,
        match = cost.match,
    }) {
        super(arguments[0]);

        this.cost = cost;
        this.match = match;
        this.paymentCancelled = false;
        this.paymentBlocked = false;
    }
    async getCost(params) {
        const {ability} = params;
        if (!ability) {
            return this.cost;
        }

        const additionalCosts = [];
        await this.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_ABILITY_COST],
            {
                ...params,
                ability,
                card: ability.card,
                effect: {},
                additionalCosts,
            }
        );

        if (!additionalCosts.length) {
            this.cost.ability = ability;

            return this.cost;
        }

        const cost = new SimultaneousEffect({
            effects: [this.cost, ...additionalCosts],
            effectType: EFFECT_SIMULTANEOUS,
            isArrow: true,
            match: this.match,
            outputParams: [
                ...new Set([
                    ...(this.cost.outputParams || []),
                    ...additionalCosts.flatMap(additionalCost =>
                        additionalCost.outputParams || []
                    ),
                ]),
            ],
        });
        cost.ability = ability;

        return cost;
    }
    async canPay(params) {
        const cost = await this.getCost(params);

        return cost.canRun({
            ...params,
            isCost: true,
            matchAll: true
        });
    }
    async pay(params, paramsToUpdate = params) {
        const session = new CostPaymentSession();
        this.paymentCancelled = false;
        this.paymentBlocked = false;
        const cost = await this.getCost(params);

        const result = await session.resolve(cost, params, {
            requireAllCosts: true,
        });
        this.paymentCancelled = result.cancelled;
        this.paymentBlocked = result.blocked;

        if (result.resolved) {
            const outputParams = cost.outputParams || [];
            outputParams.forEach(param => {
                paramsToUpdate[param] = result.effectParams[param];
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