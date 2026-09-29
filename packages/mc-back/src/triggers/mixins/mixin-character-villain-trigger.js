import {MixinVillainTrigger} from "./mixin-villain-trigger.js";

export const MixinCharacterVillainTrigger = C => class extends MixinVillainTrigger(C) {
    constructor(params) {
        super(params);
    }
    getVillain(params) {
        const {effect} = params;

        return effect.character;
    }
}