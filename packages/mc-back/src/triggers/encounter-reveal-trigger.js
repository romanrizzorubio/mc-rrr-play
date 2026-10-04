import {Trigger} from './base/trigger.js';

export class EncounterRevealTrigger extends Trigger {
    canTrigger(params) {
        if (!params.effect?.selectedTarget?.isEncounterCard) {
            return false;
        }

        return super.canTrigger(params);
    }
}
