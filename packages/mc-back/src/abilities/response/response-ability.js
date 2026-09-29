import {Ability} from "../core/ability.js";
import {PRIORITY_RESPONSE} from "../../constants/priorities.js";
import {MixinTriggeableAbility} from "../mixins/mixin-triggeable-ability.js";
export const ABILITY_RESPONSE = 'response';
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