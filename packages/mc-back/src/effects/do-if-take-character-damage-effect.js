import {DoIfEffect} from './do-if-effect.js';

export class DoIfTakeCharacterDamageEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition,
        effect: _effect,
        effectNot: _effectNot
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
        });
    }
}