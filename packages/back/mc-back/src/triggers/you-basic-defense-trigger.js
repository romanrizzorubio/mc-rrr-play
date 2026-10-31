import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class YouBasicDefenseTrigger extends Trigger {
    async canTrigger(params) {
        const {effect, player} = params;

        return Boolean(player &&
            this.card &&
            getTriggerCardPlayer(this.card, player) === player &&
            effect?.hasBasicDefenseFor?.(player) &&
            await super.canTrigger(params));
    }
}
