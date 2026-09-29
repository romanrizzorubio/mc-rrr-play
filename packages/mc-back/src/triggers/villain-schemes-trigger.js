import {Trigger} from "./base/trigger.js";
import {MixinCharacterVillainTrigger} from "./mixins/mixin-character-villain-trigger.js";

export const TRIGGER_VILLAIN_SCHEMES = 'VILLAIN_SCHEMES';
export class VillainSchemesTrigger extends MixinCharacterVillainTrigger(Trigger) {}