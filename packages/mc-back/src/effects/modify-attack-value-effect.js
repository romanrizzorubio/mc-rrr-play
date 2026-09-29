import {Effect} from "./effect.js";

export const EFFECT_MODIFY_ATTACK_VALUE = 'modify-attack-value';
export class ModifyAttackValueEffect extends Effect {
    constructor({
        count,
        characterTarget,
        characters,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.count = count;
    }
    execute(params) {
        const {selectedTarget, count, paramsCalc} = this;

        if (paramsCalc) {
            selectedTarget.modifyAttack = this.calculate(params);
        } else {
            selectedTarget.modifyAttack = count;
        }
    }
}