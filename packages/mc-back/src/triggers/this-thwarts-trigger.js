import {Trigger} from "./base/trigger.js";
import {MixinThisTrigger} from "./mixins/mixin-this-trigger.js";

export const TRIGGER_THIS_THWARTS = 'THIS_THWARTS';
export class ThisThwartsTrigger extends MixinThisTrigger(Trigger) {}