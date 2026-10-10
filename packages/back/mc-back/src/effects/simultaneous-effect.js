import {CostPaymentSession} from '../utils/cost-payment-session.js';
import {ChainedEffect} from './chained-effect.js';
import {Effect} from './effect.js';

export class SimultaneousEffect extends ChainedEffect {
    async prepareCost(params, session) {
        if (session.requireAllCosts) {
            return super.prepareCost(params, session);
        }

        if (!await Effect.prototype.prepareCost.call(this, params, session)) {
            return false;
        }

        const {effectParams} = session.getPreparedEffect(this);
        const newParams = this.getEffectParams(effectParams);
        session.prepareExecutionParams(this, newParams);

        for (const effect of this.effects) {
            if (!await effect.canRun(newParams) ||
                !await effect.prepareCost(newParams, session)) {
                session.skipEffect(effect);
            }
        }

        return true;
    }
    async execute(params) {
        const session = params.costPaymentSession;
        const newParams = session?.getExecutionParams(this) ||
            this.getEffectParams(params);

        for (const effect of this.effects) {
            if (session?.isSkipped(effect)) {
                continue;
            }

            if (!session?.isPrepared(effect) &&
                !await effect.canRun(newParams)) {
                if (session?.requireAllCosts) {
                    return false;
                }

                continue;
            }

            await effect.runEffect(newParams);

            if (effect.paymentCancelled) {
                this.paymentCancelled = true;
                return false;
            }

            if (session?.requireAllCosts && !effect.isFullResolved()) {
                return false;
            }
        }

        this.outputParams.forEach(param => {
            params[param] = newParams[param];
        });
    }
    async runEffect(params) {
        const session = params.costPaymentSession;
        if (session?.isPrepared(this)) {
            return super.runEffect(params);
        }

        this.resolved = false;
        this.fullResolved = false;
        this.paymentCancelled = false;

        const result = await new CostPaymentSession().resolve(this, params);
        this.paymentCancelled = result.cancelled;
    }
}
