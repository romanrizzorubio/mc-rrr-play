import {CHARACTER_ENGAGED,TRIGGER_ENGAGE_HERO} from 'mc-shared';
import {QuickStrikeEffect} from '../../effects/quickstrike-effect.js';

import {ForcedResponseAbility} from '../response/forced-response-ability.js';

export class QuickstrikeAbility extends ForcedResponseAbility {
    constructor({}) {
        super(arguments[0]);

        this.trigger = TRIGGER_ENGAGE_HERO;

        this.effect = new QuickStrikeEffect({
            minion: this.card,
            target: CHARACTER_ENGAGED,
            match: this.match,
        });
    }
    canTrigger(params) {
        if (params.card !== this.card) {
            return false;
        }

        return super.canTrigger(params);
    }
    getTitle() {
        return 'Ataque veloz';
    }
    getTriggerDialogTitle() {
        return 'Se activa el Ataque veloz';
    }
}