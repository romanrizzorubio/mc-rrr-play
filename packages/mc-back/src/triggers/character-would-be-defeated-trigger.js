import {Trigger} from './base/trigger.js';

export class CharacterWouldBeDefeatedTrigger extends Trigger {
    canTrigger(params) {
        const owner = this.card.controller || this.card.owner;
        const superhero = owner?.superhero;
        const target = params.effect?.selectedTarget;

        if (superhero &&
            (target === superhero ||
                target === superhero.currentSide ||
                target?.parent === superhero ||
                (target?.isPlayer && target.superhero === superhero))) {
            return super.canTrigger(params);
        }
    }
}
