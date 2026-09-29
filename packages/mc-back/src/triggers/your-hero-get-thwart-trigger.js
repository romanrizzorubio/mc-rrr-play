import {Trigger} from "./base/trigger.js";
import {MixinYourHeroTrigger} from "./mixins/mixin-your-hero-trigger.js";

export const TRIGGER_YOUR_HERO_GET_THWART = 'YOUR_HERO_GET_THWART';
export class YourHeroGetThwartTrigger extends MixinYourHeroTrigger(Trigger) {}