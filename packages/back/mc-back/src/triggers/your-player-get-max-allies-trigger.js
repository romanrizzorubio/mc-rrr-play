import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class YourPlayerGetMaxAlliesTrigger extends Trigger {
    async canRun(params) {
        return getTriggerCardPlayer(this.card, params.player) === params.player &&
            await super.canRun(params);
    }
}
