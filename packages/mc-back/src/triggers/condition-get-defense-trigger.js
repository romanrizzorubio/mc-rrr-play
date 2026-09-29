import {Trigger} from "./base/trigger.js";
import {MixinConditionTrigger} from "./mixins/mixin-condition-trigger.js";

export const TRIGGER_CONDITION_GET_DEFENSE = 'CONDITION_GET_DEFENSE';
export class ConditionGetDefenseTrigger extends MixinConditionTrigger(Trigger) {}