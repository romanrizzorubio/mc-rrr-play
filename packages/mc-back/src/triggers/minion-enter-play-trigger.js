import {Trigger} from './base/trigger.js';

export class MinionEnterPlayTrigger extends Trigger {
    canTrigger(params) {
        if (params.card?.isMinion) {
            return super.canTrigger(this.getMinionParams(params));
        }
    }
    getMinionParams(params) {
        return {
            ...params,
            triggeredCard: params.card,
        };
    }
    runCard(params) {
        return super.runCard(this.getMinionParams(params));
    }
}
