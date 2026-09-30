import {Effect} from './effect.js';

export class ModifyHandSizeEffect extends Effect {
    constructor({
        count,
        characterTarget,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.count = count;
    }
    execute(params) {
        const {selectedTarget, count, paramsCalc} = this;

        if (paramsCalc) {
            selectedTarget.modifyHandSize = this.calculate(params);
        } else {
            selectedTarget.modifyHandSize = count;
        }
    }
}
