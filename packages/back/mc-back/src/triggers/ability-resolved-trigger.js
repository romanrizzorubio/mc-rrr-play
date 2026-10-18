import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class AbilityResolvedTrigger extends Trigger {
    canTrigger(params) {
        const {player, resolvedAbility, resolvedAbilityController} = params;
        const controller = getTriggerCardPlayer(this.card, player);

        if (!resolvedAbility?.card ||
            resolvedAbilityController !== player ||
            controller !== player) {
            return false;
        }

        return super.canTrigger(params);
    }
}
