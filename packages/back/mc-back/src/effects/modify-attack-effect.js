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
        const target = selectedTarget?.effect?.isAttack ?
            selectedTarget.effect :
            selectedTarget;

        Object.entries(this.modify).forEach(([key, value]) => {
            if (key === 'keywords' &&
                value && typeof value === 'object' && !Array.isArray(value) &&
                target.keywords && typeof target.keywords === 'object') {
                Object.assign(target.keywords, value);
                return;
            }

            target[key] = value;
        });
    }
}