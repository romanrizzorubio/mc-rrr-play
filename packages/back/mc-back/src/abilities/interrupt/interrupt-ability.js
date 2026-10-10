import {PRIORITY_INTERRUPT} from 'mc-shared';
import {Ability} from '../core/ability.js';
import {MixinTriggeableAbility} from '../mixins/mixin-triggeable-ability.js';

export class InterruptAbility extends MixinTriggeableAbility(Ability) {
    get isInterrupt() {
        return true;
    }
    initTriggers(card) {
        this.initTrigger({
            type: this.trigger,
            priority: PRIORITY_INTERRUPT,
            ability: this,
            card
        });
    }
}