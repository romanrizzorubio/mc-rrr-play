import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class YouPlayCardTrigger extends Trigger {
    canTrigger(params) {
        const {card} = this;
        const controller = getTriggerCardPlayer(card, params.player);

        if (controller &&
            (!controller.isPlayer || controller === params.player)) {
            return super.canTrigger(params);
        }
    }
}
