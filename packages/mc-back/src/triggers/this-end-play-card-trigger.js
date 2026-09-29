import {MixinThisTrigger} from "./mixins/mixin-this-trigger.js";
import {EndPlayCardTrigger} from "./end-play-card-trigger.js";

export const TRIGGER_THIS_END_PLAY_CARD = 'THIS_END_PLAY_CARD';
export class ThisEndPlayCardTrigger extends MixinThisTrigger(EndPlayCardTrigger) {}