import {Trigger} from "./base/trigger.js";
import {MixinYourHeroTrigger} from "./mixins/mixin-your-hero-trigger.js";

export const TRIGGER_YOUR_HERO_GET_ATTACK = 'YOUR_HERO_GET_ATTACK';
export class YourHeroGetAttackTrigger extends MixinYourHeroTrigger(Trigger) {}