import {Effect} from "./effect.js";

export const EFFECT_MODIFY_THWART_VALUE = 'modify-thwart-value';
export class ModifyThwartValueEffect extends Effect {
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
            selectedTarget.modifyThwart = this.calculate(params);
        } else {
            selectedTarget.modifyThwart = count;
        }
    }
}