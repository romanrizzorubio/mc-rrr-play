import {Trigger} from "./base/trigger.js";
import {MixinYouTrigger} from "./mixins/mixin-you-trigger.js";
import {MixinAttackTrigger} from "./mixins/mixin-attack-trigger.js";
import {MixinBasicTrigger} from "./mixins/mixin-basic-trigger.js";

export const TRIGGER_YOU_ATTACK = 'YOU_ATTACK';
export class YouAttackTrigger extends MixinBasicTrigger(MixinAttackTrigger(MixinYouTrigger(Trigger))) {
    getYou(params) {
        const {effect} = params;

        return effect.character;
    }
}
