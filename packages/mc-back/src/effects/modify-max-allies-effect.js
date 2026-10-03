import {Effect} from './effect.js';
import {GetMaxAlliesEffect} from './get-max-allies-effect.js';

export class ModifyMaxAlliesEffect extends Effect {
    constructor({
        count = 0,
    }) {
        super(arguments[0]);
        this.count = count;
    }
    execute(params) {
        const {effect} = params;
        const {count, paramsCalc} = this;
        const modifyMaxAllies = paramsCalc ?
            this.calculate(params) :
            count;

        if (!(effect instanceof GetMaxAlliesEffect)) {
            throw new Error('ModifyMaxAlliesEffect requires a GetMaxAlliesEffect context.');
        }
        if (!Number.isFinite(modifyMaxAllies)) {
            throw new Error('A maximum-allies modifier must resolve to a finite number.');
        }

        effect.modifyMaxAllies += modifyMaxAllies;
    }
}
