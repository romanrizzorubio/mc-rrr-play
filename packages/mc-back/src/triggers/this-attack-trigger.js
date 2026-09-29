import {Trigger} from "./base/trigger.js";
import {MixinThisTrigger} from "./mixins/mixin-this-trigger.js";
import {MixinAttackTrigger} from "./mixins/mixin-attack-trigger.js";

export const TRIGGER_THIS_ATTACK = 'THIS_ATTACK';
export class ThisAttackTrigger extends MixinAttackTrigger(MixinThisTrigger(Trigger)) {}