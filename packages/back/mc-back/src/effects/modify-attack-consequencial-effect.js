import {GetAttackConsequencialEffect} from './get-attack-consequencial-effect.js';
import {Effect} from './effect.js';

export class ModifyAttackConsequencialEffect extends Effect {
    constructor({
        count = 0,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    execute(params) {
        const {selectedTarget} = this;
        const modifyAttackConsequencial = this.paramsCalc ?
            this.calculate(params) :
            this.count;

        if (!(selectedTarget instanceof GetAttackConsequencialEffect)) {
            throw new Error(
                'ModifyAttackConsequencialEffect requires a GetAttackConsequencialEffect context.'
            );
        }

        selectedTarget.modifyAttackConsequencial += modifyAttackConsequencial;
    }
}
