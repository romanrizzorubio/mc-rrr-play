import {InterruptAbility} from "./interrupt-ability.js";
import {MixinHeroAbility} from "../mixins/mixin-hero-ability.js";

export const ABILITY_HERO_INTERRUPT = 'hero-interrupt';
export class HeroInterruptAbility extends MixinHeroAbility(InterruptAbility) {
}