import {Trigger} from "./base/trigger.js";
import {MixinYourHeroTrigger} from "./mixins/mixin-your-hero-trigger.js";

export const TRIGGER_YOUR_HERO_GET_HAND_SIZE = 'YOUR_HERO_GET_HAND_SIZE';
export class YourHeroGetHandSizeTrigger extends MixinYourHeroTrigger(Trigger) {}
