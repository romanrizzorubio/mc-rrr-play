import {Trigger} from "./base/trigger.js";
import {MixinYouTrigger} from "./mixins/mixin-you-trigger.js";
import {MixinMinionTrigger} from "./mixins/mixin-minion-trigger.js";

export const TRIGGER_YOU_DEFEAT_MINION = 'YOU_DEFEAT_MINION';
export class YouDefeatMinionTrigger extends MixinMinionTrigger(MixinYouTrigger(Trigger)) {
    getYou(params) {
        const {effect} = params;

        return effect.character;
    }
}