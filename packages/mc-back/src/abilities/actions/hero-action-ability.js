import {ActionAbility} from "./action-ability.js";
import {MixinHeroAbility} from "../mixins/mixin-hero-ability.js";

export const ABILITY_HERO_ACTION = 'hero-action';
export class HeroActionAbility extends MixinHeroAbility(ActionAbility) {}