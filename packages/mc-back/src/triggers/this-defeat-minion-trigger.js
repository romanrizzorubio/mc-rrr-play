import {Trigger} from './base/trigger.js';
import {MixinMinionTrigger} from './mixins/mixin-minion-trigger.js';
import {MixinThisTrigger} from './mixins/mixin-this-trigger.js';

export class ThisDefeatMinionTrigger extends MixinMinionTrigger(MixinThisTrigger(Trigger)) {
}