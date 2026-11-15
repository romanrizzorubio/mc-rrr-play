import {TARGET_ATTACHED} from 'mc-shared';
import {CharacterWouldTakeDamageTrigger} from './character-would-take-damage-trigger.js';

export class AttachedWouldDealtDamageTrigger extends CharacterWouldTakeDamageTrigger {
    constructor(params) {
        super({...params, target: TARGET_ATTACHED});
    }
    getTargetIndexes(params, options) {
        return this.card?.attachedTo ?
            super.getTargetIndexes(params, options) :
            [];
    }
    getTarget(params, targetIndex) {
        return this.card?.attachedTo ?
            super.getTarget(params, targetIndex) :
            undefined;
    }
    getInterruptName(params) {
        return super.getInterruptName({
            ...params,
            triggeredTargetDamage: params.triggeredTarget ?
                params.triggeredTargetDamage : undefined,
        });
    }
    getTargetDamage(params, target = this.getTarget(params), targetIndex) {
        if (!target) {
            return 0;
        }

        const {effect} = params;
        const index = Number.isInteger(targetIndex) ?
            targetIndex :
            Array.isArray(effect.selectedTarget) ?
                effect.selectedTarget.indexOf(target) : 0;
        const damage = Array.isArray(effect.damage) ?
            effect.damage[index] : effect.damage;
        const prevention = Array.isArray(effect.preventDamage) ?
            effect.preventDamage[index] : effect.preventDamage;

        return Math.max(0, (damage ?? 0) - (prevention ?? 0));
    }
}