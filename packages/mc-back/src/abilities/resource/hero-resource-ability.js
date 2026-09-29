import {ResourceAbility} from "./resource-ability.js";
import {MixinHeroAbility} from "../mixins/mixin-hero-ability.js";

export const ABILITY_HERO_RESOURCE = 'hero-resource';
export class HeroResourceAbility extends MixinHeroAbility(ResourceAbility) {}