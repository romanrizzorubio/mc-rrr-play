import {Trigger} from "./base/trigger.js";
import {MixinResolvedTrigger} from "./mixins/mixin-resolved-trigger.js";

export const TRIGGER_END_PLAY_CARD = 'END_PLAY_CARD';
export class EndPlayCardTrigger extends MixinResolvedTrigger(Trigger) {}