import {Trigger} from './base/trigger.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

export class HeroDefendsAttackTrigger extends Trigger {
    canTrigger(params) {
        const defender = params.effect?.defender;
        const player = this.card.isEvent ?
            getTriggerCardPlayer(this.card, params.player) :
            this.card.owner || this.card.controller;

        if (defender?.isHero && defender.owner === player &&
            params.player === player) {
            return super.canTrigger(params);
        }
    }
}
