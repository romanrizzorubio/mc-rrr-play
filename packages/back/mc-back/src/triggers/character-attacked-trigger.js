import {CharacterWouldTakeDamageTrigger} from './character-would-take-damage-trigger.js';

export class CharacterAttackedTrigger extends CharacterWouldTakeDamageTrigger {
    canTrigger(params) {
        return Boolean(params.effect?.isAttack) &&
            super.canTrigger(params, {requireDamage: false});
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
    getInterruptName(params) {
        const target = this.getTarget(params);

        return `${target.name} va a ser atacado.`;
    }
}
