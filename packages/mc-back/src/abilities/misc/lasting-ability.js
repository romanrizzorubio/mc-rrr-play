import {ConstantAbility} from './constant-ability.js';

export class LastingAbility extends ConstantAbility {
    constructor({
        lasting,
    }) {
        super(arguments[0]);

        this.lasting = lasting;
    }
    async resolveAbility(params) {
        return super.resolveAbility({
            ...params,
            lasting: this.lasting,
        });
    }
}