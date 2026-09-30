import {Effect} from './effect.js';

export class CancelAttackEffect extends Effect {
    execute(_params) {
        const {selectedTarget} = this;

        selectedTarget.cancelActivation();
    }
}