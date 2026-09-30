import {Effect} from './effect.js';

export class ModifyHitPointsEffect extends Effect {
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
            selectedTarget.modifyHitPoints = this.calculate(params);
        } else {
            selectedTarget.modifyHitPoints = count;
        }
    }
}
