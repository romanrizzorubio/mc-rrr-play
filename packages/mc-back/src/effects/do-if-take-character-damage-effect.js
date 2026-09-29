import {DoIfEffect} from "./do-if-effect.js";

export const EFFECT_DO_IF_TAKE_DAMAGE = 'do-if-take-damage';
export class DoIfTakeCharacterDamageEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition,
        effect,
        effectNot
    }) {
        super(arguments[0]);

        this.condition = condition;
    }
    prepare(params) {
        this.selectedTarget = this.getSource(params);
    }
    checkCondition() {
        return !!this.selectedTarget.activation.takenDamage;
    }
    execute(params) {
        return super.execute({
            ...params,
            attack: this.selectedTarget,
        })
    }
}