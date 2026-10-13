import {Effect} from './effect.js';

export class ModifyBoostIconsEffect extends Effect {
    constructor({count = 0}) {
        super(arguments[0]);

        this.count = count;
    }
    async execute(params) {
        const {selectedTarget} = this;
        const count = this.paramsCalc ?
            await this.calculate(params) :
            this.count;

        if (!Number.isFinite(count)) {
            throw new TypeError('ModifyBoostIconsEffect count must be finite.');
        }
        if (!Number.isFinite(selectedTarget?.boostValue)) {
            throw new TypeError(
                'ModifyBoostIconsEffect requires a boost resolution target.'
            );
        }

        selectedTarget.boostValue = Math.max(
            0,
            selectedTarget.boostValue + count
        );
    }
}
