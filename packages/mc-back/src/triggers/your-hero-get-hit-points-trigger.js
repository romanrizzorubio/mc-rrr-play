import {Trigger} from "./base/trigger.js";
import {MixinYourHeroTrigger} from "./mixins/mixin-your-hero-trigger.js";

export const TRIGGER_YOUR_HERO_GET_HIT_POINTS = 'YOUR_HERO_GET_HIT_POINTS';
export class YourHeroGetHitPointsTrigger extends MixinYourHeroTrigger(Trigger) {}
