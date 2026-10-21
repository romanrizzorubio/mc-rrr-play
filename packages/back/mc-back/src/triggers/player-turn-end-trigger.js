import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class PlayerTurnEndTrigger extends Trigger {
    canTrigger(params) {
        if (getTriggerCardPlayer(this.card, params.player) === params.player) {
            return super.canTrigger(params);
        }
    }
}
