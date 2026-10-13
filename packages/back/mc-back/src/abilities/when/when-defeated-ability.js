import {TRIGGER_THIS_DEFEAT} from 'mc-shared';

import {ForcedResponseAbility} from '../response/forced-response-ability.js';

export class WhenDefeatedAbility extends ForcedResponseAbility {
    constructor({
        name = 'Cuando se derrote',
// Ability
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
    }) {
        super({
            ...arguments[0],
            name,
            trigger: TRIGGER_THIS_DEFEAT,
        });

        this.isWhenDefeated = true;
    }
    getTriggerDialogTitle() {
        return `Resolviendo «Cuando se derrote» de ${this.card.name}`;
    }
}