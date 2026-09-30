import {Effect} from './effect.js';

export class ModifySurgeEffect extends Effect {
    constructor({
        surge = true,
    }) {
        super(arguments[0]);

        this.surge = surge;
    }
    get keepTriggering() {
        return true;
    }
    execute(_params) {
        const {selectedTarget, surge} = this;

        selectedTarget.addedSurge = surge;
    }
}