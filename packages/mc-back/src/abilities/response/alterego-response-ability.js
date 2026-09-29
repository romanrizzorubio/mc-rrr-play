import {MixinHeroAbility} from "../mixins/mixin-hero-ability.js";
import {ResponseAbility} from "./response-ability.js";
import {MixinAlteregoAbility} from "../mixins/mixin-alterego-ability.js";

export class AlteregoResponseAbility extends MixinAlteregoAbility(ResponseAbility) {
}