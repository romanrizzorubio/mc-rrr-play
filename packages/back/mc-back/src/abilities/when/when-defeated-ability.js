import {TRIGGER_THIS_DEFEAT} from 'mc-shared';

import {ForcedInterruptAbility} from '../interrupt/forced-interrupt-ability.js';

export class WhenDefeatedAbility extends ForcedInterruptAbility {
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