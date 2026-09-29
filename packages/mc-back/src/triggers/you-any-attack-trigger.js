import {Trigger} from "./base/trigger.js";
import {MixinYouTrigger} from "./mixins/mixin-you-trigger.js";
import {MixinAttackTrigger} from "./mixins/mixin-attack-trigger.js";

export const TRIGGER_YOU_ANY_ATTACK = 'YOU_ANY_ATTACK';
export class YouAnyAttackTrigger extends MixinAttackTrigger(MixinYouTrigger(Trigger)) {
    getYou(params) {
        const {effect} = params;

        return effect.character;
    }
}
