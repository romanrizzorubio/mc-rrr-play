import {GetattackConsequentialEffect} from './get-attack-consequencial-effect.js';
import {Effect} from './effect.js';

export class ModifyattackConsequentialEffect extends Effect {
    constructor({
        count = 0,
    }) {
        super(arguments[0]);

        this.count = count;
    }
    execute(params) {
        const {selectedTarget} = this;
        const modifyattackConsequential = this.paramsCalc ?
            this.calculate(params) :
            this.count;

        if (!(selectedTarget instanceof GetattackConsequentialEffect)) {
            throw new Error(
                'ModifyattackConsequentialEffect requires a GetattackConsequentialEffect context.'
            );
        }

        selectedTarget.modifyattackConsequential += modifyattackConsequential;
    }
}
