import {Effect} from './effect.js';

export class ModifyAttackEffect extends Effect {
    constructor({
        modify
    }) {
        super(arguments[0]);

        this.modify = modify;
    }
    execute(_params) {
        const {selectedTarget} = this;

        Object.entries(this.modify).forEach(([key, value]) => {
            if (key === 'keywords' &&
                value && typeof value === 'object' && !Array.isArray(value) &&
                selectedTarget.keywords && typeof selectedTarget.keywords === 'object') {
                Object.assign(selectedTarget.keywords, value);
                return;
            }

            selectedTarget[key] = value;
        });
    }
}