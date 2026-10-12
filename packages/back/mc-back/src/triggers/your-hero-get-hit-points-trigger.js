import {Trigger} from './base/trigger.js';

export class YourHeroGetHitPointsTrigger extends Trigger {
    canTrigger(params) {
        const {card} = this;
        const {effect, player} = params;
        const controller = card.isEvent ? card.owner : card.controller;
        const superhero = player?.superhero;

        if (controller === player && superhero &&
            (effect?.selectedTarget === superhero ||
                effect?.selectedTarget === superhero.currentSide)) {
            return super.canTrigger(params);
        }
    }
}
