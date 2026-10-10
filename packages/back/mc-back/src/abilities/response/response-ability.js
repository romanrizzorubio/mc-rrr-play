import {PRIORITY_RESPONSE} from 'mc-shared';
import {Ability} from '../core/ability.js';
import {MixinTriggeableAbility} from '../mixins/mixin-triggeable-ability.js';

export class ResponseAbility extends MixinTriggeableAbility(Ability) {
    initTriggers(card) {
        this.initTrigger({
            type: this.trigger,
            priority: PRIORITY_RESPONSE,
            ability: this,
            card
        });
    }
}