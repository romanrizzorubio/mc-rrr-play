import {ActionAbility} from "./action-ability.js";
import {MixinAlteregoAbility} from "../mixins/mixin-alterego-ability.js";
export const ABILITY_ALTEREGO_ACTION = 'alterego-action';
export class AlteregoActionAbility extends MixinAlteregoAbility(ActionAbility) {}