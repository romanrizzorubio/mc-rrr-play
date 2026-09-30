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

        Object.keys(this.modify).forEach(key => {
            selectedTarget[key] = this.modify[key];
        });
    }
}