import {Trigger} from './base/trigger.js';

export class PlayerTurnStartTrigger extends Trigger {
    canTrigger(params) {
        if (this.card.controller === params.player) {
            return super.canTrigger(params);
        }
    }
}
