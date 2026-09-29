import {WhenRevealedAbility} from "./when-revealed-ability.js";
import {MixinAlteregoAbility} from "../mixins/mixin-alterego-ability.js";

export const ABILITY_WHEN_REVEALED_ALTEREGO = 'when-revealed-alterego';
export class WhenRevealedAlteregoAbility extends MixinAlteregoAbility(WhenRevealedAbility) {}