import {Trigger} from "./base/trigger.js";
import {MixinConditionTrigger} from "./mixins/mixin-condition-trigger.js";

export const TRIGGER_CONDITION_GET_TRAITS = 'CONDITION_GET_TRAITS';
export class ConditionGetTraitsTrigger extends MixinConditionTrigger(Trigger) {}