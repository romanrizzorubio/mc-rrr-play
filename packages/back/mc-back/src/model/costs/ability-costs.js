import {
    PRIORITY_CONSTANT,
    TRIGGER_ABILITY_COST,
} from 'mc-shared';
import {createEffectInstance} from '../../utils/create-effect-instance.js';
import {CostGroup} from './cost-group.js';
import {COST_TYPE_ABILITY, COST_TYPE_ARROW} from './cost-constants.js';

export class AbilityCosts extends CostGroup {
    constructor({ability, match} = {}) {
        super({ability, match, type: COST_TYPE_ABILITY});
        this.paymentEffect = undefined;
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
            const effectInstance = createEffectInstance(effect, {
                ability: params.ability || this.ability,
            });
            const preselectedEffectTargets = params.preselectedEffectTargets &&
                new Set([...params.preselectedEffectTargets].map(
                    preselectedEffect => {
                        const instance = effectInstance.effectInstances.get(
                            preselectedEffect
                        );
                        if (instance) {
                            instance.selectedTarget =
                                preselectedEffect.selectedTarget;
                        }

                        return instance || preselectedEffect;
                    }
                ));
            const availabilityEffect = cost.markEffectAsCost(
                effectInstance.effect,
                params.ability || this.ability
            );

            return cost.canPay({
                ...params,
                ...(preselectedEffectTargets ?
                    {preselectedEffectTargets} :
                    {}),
            }, availabilityEffect);
        }

        effect.resetResolutionState({
            preserveSelectedTarget:
                params.preselectedEffectTargets?.has(effect),
            preselectedEffectTargets: params.preselectedEffectTargets,
        });

        return effect.canRun({
            ...params,
            isCost: true,
            matchAll: true,
        });
    }
    async pay(params, paramsToUpdate = params) {
        this.paymentEffect = undefined;
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
            if (result.resolved) {
                this.paymentEffect = effect;
            }
            this.setPaymentResult(result);

            return result;
        }

        const result = await super.pay(params, paramsToUpdate, effect);
        if (result.resolved) {
            this.paymentEffect = effect;
        }

        return result;
    }
    clearPaymentEffect() {
        this.paymentEffect = undefined;
    }
    async rollbackPayment() {
        const effect = this.paymentEffect;
        this.paymentEffect = undefined;

        if (!effect?.canRollbackCost()) {
            return false;
        }

        return effect.rollbackCost();
    }
    setPaymentResult(result) {
        super.setPaymentResult(result);
        if (this.ability) {
            this.ability.paymentCancelled = result.cancelled;
        }
    }
}
