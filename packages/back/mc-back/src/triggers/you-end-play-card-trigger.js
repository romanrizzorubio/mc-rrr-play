import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {EndPlayCardTrigger} from './end-play-card-trigger.js';

export class YouEndPlayCardTrigger extends EndPlayCardTrigger {
    canTrigger(params) {
        const controller = getTriggerCardPlayer(this.card, params.player);

        return controller === params.player && super.canTrigger(params);
    }
}
