import {Trigger} from "./base/trigger.js";
import {MixinThisTrigger} from "./mixins/mixin-this-trigger.js";

export const TRIGGER_THIS_ENTER_PLAY = 'THIS_ENTER_PLAY';
export class ThisEnterPlayTrigger extends MixinThisTrigger(Trigger) {}