import {Trigger} from "./base/trigger.js";
import {MixinThisTrigger} from "./mixins/mixin-this-trigger.js";
import {MixinMinionTrigger} from "./mixins/mixin-minion-trigger.js";

export const TRIGGER_THIS_DEFEAT_MINION = 'THIS_DEFEAT_MINION';
export class ThisDefeatMinionTrigger extends MixinMinionTrigger(MixinThisTrigger(Trigger)) {
}