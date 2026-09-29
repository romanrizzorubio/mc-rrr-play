import {Trigger} from "./base/trigger.js";
import {MixinThisTrigger} from "./mixins/mixin-this-trigger.js";

export const TRIGGER_THIS_FLIP = 'THIS_FLIP';
export class ThisFlipTrigger extends MixinThisTrigger(Trigger) {}
