import {Trigger} from './base/trigger.js';

export class HeroDefendsAttackTrigger extends Trigger {
    canTrigger(params) {
        const defender = params.effect?.defender;
        const player = this.card.owner || this.card.controller;

        if (defender?.isHero && defender.owner === player &&
            params.player === player) {
            return super.canTrigger(params);
        }
    }
}
