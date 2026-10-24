import {Trigger} from './base/trigger.js';

export class SchemeGetThwartTrigger extends Trigger {
    canTrigger(params) {
        const source = this.card?.currentSide || this.card;
        const scheme = params.scheme?.currentSide || params.scheme;

        if (source !== scheme && source?.id !== scheme?.id) {
            return false;
        }

        return super.canTrigger(params);
    }
}
