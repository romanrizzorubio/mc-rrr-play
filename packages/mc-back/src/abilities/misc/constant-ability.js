import {PRIORITY_CONSTANT} from '../../constants/priorities.js';
import {Ability} from '../core/ability.js';
import {MixinTriggeableAbility} from '../mixins/mixin-triggeable-ability.js';

export class ConstantAbility extends MixinTriggeableAbility(Ability) {
    constructor({
        once,
    }) {
        super(arguments[0]);

        this.once = once;
    }
    initTriggers(card, _params) {
        this.initTrigger({
            type: this.trigger,
            priority: PRIORITY_CONSTANT,
            ability: this,
            card
        });
    }
    async resolveAbility(params) {
        await super.resolveAbility(params);

        if (this.once && this.card) {
            this.card.endTriggers();
        }
    }
}