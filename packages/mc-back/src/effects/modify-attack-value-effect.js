import {Effect} from './effect.js';

export class ModifyAttackValueEffect extends Effect {
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
            selectedTarget.modifyAttack = this.calculate(params);
        } else {
            selectedTarget.modifyAttack = count;
        }
    }
}