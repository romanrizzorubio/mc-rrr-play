import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class YourSuperheroGetTraitsTrigger extends Trigger {
    canTrigger(params) {
        const {effect, player} = params;
        const controller = getTriggerCardPlayer(this.card, player);
        const superhero = player?.superhero;

        if (controller === player &&
            superhero &&
            (effect?.selectedTarget === superhero ||
                effect?.selectedTarget === superhero.currentSide)) {
            return super.canTrigger(params);
        }
    }
}
