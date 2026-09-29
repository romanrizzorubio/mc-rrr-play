import {WhenRevealedAbility} from "./when-revealed-ability.js";
import {MixinHeroAbility} from "../mixins/mixin-hero-ability.js";

export const ABILITY_WHEN_REVEALED_HERO = 'when-revealed-hero';
export class WhenRevealedHeroAbility extends MixinHeroAbility(WhenRevealedAbility) {}