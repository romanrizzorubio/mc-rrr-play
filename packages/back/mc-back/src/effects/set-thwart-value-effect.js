import {Effect} from './effect.js';

export class SetThwartValueEffect extends Effect {
    constructor({value, ...params} = {}) {
        super(params);

        this.value = value;
    }
    async execute(params) {
        const {selectedTarget} = this;
        const value = this.paramsCalc ?
            await this.calculate(params) :
            this.value;

        const usesMay = params.mayEffect !== undefined;
        if (typeof selectedTarget?.setThwartValue !== 'function' ||
            (usesMay &&
                typeof selectedTarget?.setThwartAlternative !== 'function')) {
            throw new TypeError(
                'SetThwartValueEffect requires a thwart-value calculation target.'
            );
        }
        if (!Number.isFinite(value)) {
            throw new TypeError('SetThwartValueEffect requires a finite value.');
        }

        if (usesMay) {
            selectedTarget.setThwartAlternative(value, params.mayEffect);
        } else {
            selectedTarget.setThwartValue(value);
        }
    }
}
