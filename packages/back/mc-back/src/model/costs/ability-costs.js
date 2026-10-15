import {
    PRIORITY_CONSTANT,
    TRIGGER_ABILITY_COST,
} from 'mc-shared';
import {CostGroup} from './cost-group.js';
import {COST_TYPE_ABILITY, COST_TYPE_ARROW} from './cost-constants.js';

export class AbilityCosts extends CostGroup {
    constructor({ability, match} = {}) {
        super({ability, match, type: COST_TYPE_ABILITY});
    }
    async getEffect(params) {
        const ability = this.ability;
        const abilityContext = params.ability || ability;
        const additionalCosts = [];

        if (typeof ability?.trigger === 'function' &&
            ability.match?.triggerCards) {
            await ability.trigger(
                PRIORITY_CONSTANT,
                [TRIGGER_ABILITY_COST],
                {
                    ...params,
                    ability: abilityContext,
                    card: abilityContext?.card,
                    effect: {},
                    additionalCosts,
                }
            );
        }

        return super.getEffect(
            {...params, ...(abilityContext ? {ability: abilityContext} : {})},
            [...this.costs, ...additionalCosts]
        );
    }
    async canPay(params) {
        const effect = await this.getEffect(params);
        if (!effect) {
            return true;
        }

        const [cost] = this.costs;
        if (this.costs.length === 1 &&
            cost.type === COST_TYPE_ARROW) {
            return cost.canPay(params, effect);
        }

        return effect.canRun({
            ...params,
            isCost: true,
            matchAll: true,
        });
    }
    async pay(params, paramsToUpdate = params) {
        const effect = await this.getEffect(params);
        if (!effect) {
            const result = {
                blocked: false,
                cancelled: false,
                effectParams: params,
                resolved: true,
            };
            this.setPaymentResult(result);

            return result;
        }

        const [cost] = this.costs;
        if (this.costs.length === 1 &&
            cost.type === COST_TYPE_ARROW) {
            const paid = await cost.pay(params, paramsToUpdate, effect);
            const result = typeof paid === 'object' ?
                paid :
                {
                    blocked: !paid && !cost.paymentCancelled,
                    cancelled: cost.paymentCancelled,
                    effectParams: params,
                    resolved: paid,
                };
            this.setPaymentResult(result);

            return result;
        }

        return super.pay(params, paramsToUpdate, effect);
    }
    setPaymentResult(result) {
        super.setPaymentResult(result);
        if (this.ability) {
            this.ability.paymentCancelled = result.cancelled;
        }
    }
}
