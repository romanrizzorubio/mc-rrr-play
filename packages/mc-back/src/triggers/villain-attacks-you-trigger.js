import {MixinYouTrigger} from "./mixins/mixin-you-trigger.js";
import {VillainAttacksTrigger} from "./villain-attacks-trigger.js";

export const TRIGGER_VILLAIN_ATTACKS_YOU = 'VILLAIN_ATTACKS_YOU';
export class VillainAttacksYouTrigger extends MixinYouTrigger(VillainAttacksTrigger) {}