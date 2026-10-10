import {Effect} from './effect.js';

export class ModifyDefenseValueEffect extends Effect {
    constructor({
        count,
        characterTarget,
        characters: _characters,
    }) {
        super(arguments[0]);

        this.characterTarget = characterTarget;
        this.count = count;
    }
    execute(params) {
        const {selectedTarget, count} = this;

        if (this.paramsCalc) {
            selectedTarget.modifyDefense += this.calculate(params);
        } else {
            selectedTarget.modifyDefense += count;
        }
    }
}