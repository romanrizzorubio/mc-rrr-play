import {Effect} from "./effect.js";
import {ValidTarget} from "../engine/valid-target.js";

export const EFFECT_MODIFY_DEFENSE_VALUE = 'modify-defense-value';
export class ModifyDefenseValueEffect extends Effect {
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
            selectedTarget.modifyDefense += this.calculate(params);
        } else {
            selectedTarget.modifyDefense += count;
        }
    }
}