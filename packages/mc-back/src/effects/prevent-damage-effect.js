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

        return effect.takenDamage > 0 && super.canRun(params);
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