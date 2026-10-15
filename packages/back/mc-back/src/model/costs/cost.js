import {CostPaymentSession} from '../../utils/cost-payment-session.js';
import {Engine} from '../../engine/engine.js';
import {Effect} from '../../effects/effect.js';
import {
    EFFECT_CHILD_KEYS,
    EFFECT_COMMON_CHILD_KEYS,
} from './cost-constants.js';

export class Cost extends Engine {
    constructor({type, match} = {}) {
        super();

        if (new.target === Cost) {
            throw new TypeError('Cost is an abstract class.');
        }
        if (!type) {
            throw new TypeError('A cost requires a type.');
        }

        this.type = type;
        this.match = match;
        this.paymentCancelled = false;
        this.paymentBlocked = false;
    }
    async getEffect() {
        throw new TypeError(`${this.constructor.name} must implement getEffect().`);
    }
    markEffectAsCost(effect, ability) {
        if (!(effect instanceof Effect)) {
            throw new TypeError('A cost must resolve to a single Effect.');
        }

        const visited = new Set();
        const mark = current => {
            if (!(current instanceof Effect) || visited.has(current)) {
                return;
            }

            visited.add(current);
            current.isCost = true;
            if (ability) {
                current.ability = ability;
            }

            const childKeys = [
                ...EFFECT_COMMON_CHILD_KEYS,
                ...(EFFECT_CHILD_KEYS[current.effectType] || []),
            ];
            childKeys.forEach(key => {
                const children = Array.isArray(current[key]) ?
                    current[key] :
                    [current[key]];
                children.forEach(mark);
            });
        };

        mark(effect);

        return effect;
    }
    async canPay(params, preparedEffect) {
        const effect = preparedEffect || await this.getEffect(params);

        return !effect || effect.canRun({
            ...params,
            isCost: true,
            matchAll: true,
        });
    }
    async pay(params, paramsToUpdate = params, preparedEffect) {
        const effect = preparedEffect || await this.getEffect(params);
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

        const result = await new CostPaymentSession().resolve(
            effect,
            {...params, isCost: true},
            {requireAllCosts: true}
        );

        if (result.resolved) {
            (effect.outputParams || []).forEach(param => {
                paramsToUpdate[param] = result.effectParams[param];
            });
        }
        this.setPaymentResult(result);

        return result;
    }
    setPaymentResult(result) {
        this.paymentCancelled = result.cancelled;
        this.paymentBlocked = result.blocked;
    }
}
