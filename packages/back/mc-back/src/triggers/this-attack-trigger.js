import {Trigger} from './base/trigger.js';
import {MixinAttackTrigger} from './mixins/mixin-attack-trigger.js';
import {MixinThisTrigger} from './mixins/mixin-this-trigger.js';

export class ThisAttackTrigger extends MixinAttackTrigger(MixinThisTrigger(Trigger)) {
}