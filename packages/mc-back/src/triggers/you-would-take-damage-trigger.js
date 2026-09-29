import {Trigger} from "./base/trigger.js";
import {MixinYouTrigger} from "./mixins/mixin-you-trigger.js";

export const TRIGGER_YOU_WOULD_TAKE_DAMAGE = 'YOU_WOULD_TAKE_DAMAGE';
export class YouWouldTakeDamageTrigger extends MixinYouTrigger(Trigger) {}