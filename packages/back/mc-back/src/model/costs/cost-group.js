import {EFFECT_SIMULTANEOUS} from 'mc-shared';
import {SimultaneousEffect} from '../../effects/simultaneous-effect.js';
import {Cost} from './cost.js';
import {COST_TYPE_ABILITY} from './cost-constants.js';

export class CostGroup extends Cost {
    constructor({
        ability,
        costs = [],
        match,
        type = COST_TYPE_ABILITY,
    } = {}) {
        super({type, match});

        this.ability = ability;
        this.costs = [];
        costs.forEach(cost => this.add(cost));
    }
    add(cost) {
        if (!(cost instanceof Cost)) {
            throw new TypeError('A cost group can contain only Cost instances.');
        }

        this.costs.push(cost);
    }
    async getEffect(params, costs = this.costs) {
        const ability = params.ability || this.ability;
        const effectParams = {
            ...params,
            ...(ability ? {ability} : {}),
        };
        const effects = [];

        for (const cost of costs) {
            const effect = await cost.getEffect(effectParams);
            if (effect) {
                effects.push(cost.markEffectAsCost(effect, ability));
            }
        }

        if (!effects.length) {
            return undefined;
        }
        if (effects.length === 1) {
            return effects[0];
        }

        const combinedEffect = new SimultaneousEffect({
            effects,
            effectType: EFFECT_SIMULTANEOUS,
            isCost: true,
            match: this.match || params.match,
            outputParams: [
                ...new Set(effects.flatMap(effect => effect.outputParams || [])),
            ],
        });

        return this.markEffectAsCost(combinedEffect, ability);
    }
    async canPay(params) {
        const effect = await this.getEffect(params);

        return !effect || effect.canRun({
            ...params,
            isCost: true,
            matchAll: true,
        });
    }
    async pay(params, paramsToUpdate = params, preparedEffect) {
        const effect = preparedEffect === undefined ?
            await this.getEffect(params) :
            preparedEffect;

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

        return super.pay(params, paramsToUpdate, effect);
    }
    setPaymentResult(result) {
        super.setPaymentResult(result);
        this.costs.forEach(cost => cost.setPaymentResult(result));
    }
}
