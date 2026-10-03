import {Trigger} from './base/trigger.js';

export class AttachedGetStatTrigger extends Trigger {
    canTrigger(params) {
        const {attachedTo} = this.card;
        const {selectedTarget} = params.effect;

        if (attachedTo && attachedTo.id === selectedTarget.id) {
            return super.canTrigger(params);
        }

        return false;
    }
}
