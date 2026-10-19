import {TARGET_REVEALED_ABILITY} from 'mc-shared';

import {path} from '../engine/utils.js';

import {Effect} from './effect.js';

export class ResolveAbilityEffect extends Effect {
    constructor({
        target = TARGET_REVEALED_ABILITY,
    }) {
        super({...arguments[0], target});
    }
    getAbility(params) {
        const ability = this.selectedTarget || path(params, this.target);
        if (ability !== undefined &&
            typeof ability.resolveAbility !== 'function') {
            throw new TypeError('ResolveAbilityEffect requires a resolvable ability.');
        }

        return ability;
    }
    async canRun(params) {
        const ability = this.getAbility(params);

        return Boolean(ability && await super.canRun(params));
    }
    async execute(params) {
        const ability = this.getAbility(params);
        if (!ability) {
            throw new Error('ResolveAbilityEffect could not find its configured ability.');
        }

        await ability.resolveAbility({
            ...params,
            card: ability.card,
            triggeredCard: params.triggeredCard || params.card,
            preselectedTarget: false,
        });
    }
}
