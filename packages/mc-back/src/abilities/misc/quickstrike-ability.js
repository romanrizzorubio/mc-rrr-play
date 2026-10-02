import {CHARACTER_ENGAGED,TRIGGER_ENGAGE_HERO} from 'mc-shared';
import {QuickStrikeEffect} from '../../effects/quickstrike-effect.js';

import {ConstantAbility} from './constant-ability.js';

export class QuickstrikeAbility extends ConstantAbility {
    constructor({}) {
        super(arguments[0]);

        this.trigger = TRIGGER_ENGAGE_HERO;

        this.effect = new QuickStrikeEffect({
            minion: this.card,
            target: CHARACTER_ENGAGED,
            match: this.match,
        });
    }
    getTitle() {
        return 'Ataque veloz';
    }
}