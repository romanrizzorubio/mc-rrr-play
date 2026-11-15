import {Effect} from './effect.js';

export class ModifyRetaliateValueEffect extends Effect {
    constructor({count}) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(params) {
        const {selectedTarget} = this;
        const modifyRetaliate = this.paramsCalc ?
            await this.calculate(params) :
            this.count;

        if (!Number.isFinite(selectedTarget?.modifyRetaliate)) {
            throw new TypeError(
                'EFFECT_MODIFY_RETALIATE_VALUE requires a Retaliate-value collector.'
            );
        }
        if (!Number.isFinite(modifyRetaliate)) {
            throw new TypeError(
                'EFFECT_MODIFY_RETALIATE_VALUE requires a finite modifier.'
            );
        }

        selectedTarget.modifyRetaliate += modifyRetaliate;
    }
}
