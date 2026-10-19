import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    TRIGGER_THIS_DEFEAT,
} from 'mc-shared';
import {ConstantAbility} from './constant-ability.js';

export class EndLastingAbility extends ConstantAbility {
    constructor({
// Ability
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
// ConstantAbility
        trigger: _trigger,
// EndLastingAbility
        lasting,
        priority = _trigger === TRIGGER_THIS_DEFEAT ?
            PRIORITY_FORCED_INTERRUPT :
            PRIORITY_CONSTANT,
    }) {
        super(arguments[0]);

        this.lasting = lasting;
        this.priority = priority;

        this.isEndLasting = true;
    }

    initTriggers(card) {
        this.initTrigger({
            type: this.trigger,
            priority: this.priority,
            ability: this,
            card,
        });
    }
}