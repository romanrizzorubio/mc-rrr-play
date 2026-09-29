import {Trigger} from "./base/trigger.js";
import {MixinVillainTrigger} from "./mixins/mixin-villain-trigger.js";

export const TRIGGER_VILLAIN_ATTACKS = 'VILLAIN_ATTACKS';
export class VillainAttacksTrigger extends MixinVillainTrigger(Trigger) {
    getVillain(params) {
        const {effect} = params;

        return effect.character;
    }
}