import {Trigger} from "./base/trigger.js";
import {MixinYourHeroTrigger} from "./mixins/mixin-your-hero-trigger.js";

export const TRIGGER_ENGAGE_HERO = 'ENGAGE_HERO';
export class EngageHeroTrigger extends MixinYourHeroTrigger(Trigger) {}