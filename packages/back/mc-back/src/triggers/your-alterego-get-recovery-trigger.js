import {Trigger} from './base/trigger.js';

export class YourAlteregoGetRecoveryTrigger extends Trigger {
    canTrigger(params) {
        const player = this.card.controller || this.card.owner;
        const target = params.effect?.selectedTarget;

        return player?.isAlterEgo &&
            target === player.superhero.currentSide &&
            super.canTrigger(params);
    }
}
