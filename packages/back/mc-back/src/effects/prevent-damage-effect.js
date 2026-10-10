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
        const takenDamage = effect.takenDamage;
        const canPreventDamage = Array.isArray(takenDamage) ?
            takenDamage.some(damage => damage > 0) :
            takenDamage > 0;

        return canPreventDamage && super.canRun(params);
    }
    execute(params) {
        const {effect} = params;

        if (this.damage) {
            effect.preventDamage += this.damage;
        } else {
            effect.preventDamage = effect.damage;
        }
    }
}