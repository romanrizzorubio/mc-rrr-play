import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class SurgeTrigger extends Trigger {
    runCard(params) {
        const player = getTriggerCardPlayer(this.card, params.player);

        return super.runCard({
            ...params,
            player,
        });
    }
}
