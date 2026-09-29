import {Trigger} from "./base/trigger.js";
import {MixinThisTrigger} from "./mixins/mixin-this-trigger.js";

export const TRIGGER_THIS_GET_THWART = 'THIS_GET_THWART';
export class ThisGetThwartTrigger extends MixinThisTrigger(Trigger) {}