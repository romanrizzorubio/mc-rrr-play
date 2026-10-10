import {Effect} from './effect.js';

export class PreventDamageEffect extends Effect {
    constructor({
// PreventDamageEffect
        damage = 0
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    canRun(params) {
        const {effect} = params;
        const takenDamage = params.triggeredTarget ?
            params.triggeredTargetDamage :
            effect.takenDamage;
        const canPreventDamage = Array.isArray(takenDamage) ?
            takenDamage.some(damage => damage > 0) :
            takenDamage > 0;

        return canPreventDamage && super.canRun(params);
    }
    execute(params) {
        const {effect} = params;

        if (params.triggeredTarget) {
            const targets = Array.isArray(effect.selectedTarget) ?
                effect.selectedTarget :
                [effect.selectedTarget];
            const targetIndex = targets.findIndex(target =>
                target?.id === params.triggeredTarget.id &&
                target.name === params.triggeredTarget.name
            );
            if (targetIndex < 0) {
                throw new Error('PreventDamageEffect could not find the triggered damage target.');
            }

            const prevention = Array.isArray(effect.preventDamage) ?
                effect.preventDamage.slice() :
                targets.map(() => effect.preventDamage || 0);

            if (this.damage) {
                prevention[targetIndex] += this.damage;
            } else {
                prevention[targetIndex] = Array.isArray(effect.damage) ?
                    effect.damage[targetIndex] :
                    effect.damage;
            }

            effect.preventDamage = Array.isArray(effect.selectedTarget) ?
                prevention :
                prevention[0];
            return;
        }

        if (this.damage) {
            effect.preventDamage += this.damage;
        } else {
            effect.preventDamage = effect.damage;
        }
    }
}