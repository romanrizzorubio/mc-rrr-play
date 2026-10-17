import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class YourHeroGetHitPointsTrigger extends Trigger {
    canTrigger(params) {
        const {card} = this;
        const {effect, player} = params;
        const controller = getTriggerCardPlayer(card, player);
        const superhero = player?.superhero;

        if (controller === player && superhero &&
            (effect?.selectedTarget === superhero ||
                effect?.selectedTarget === superhero.currentSide)) {
            return super.canTrigger(params);
        }
    }
}
