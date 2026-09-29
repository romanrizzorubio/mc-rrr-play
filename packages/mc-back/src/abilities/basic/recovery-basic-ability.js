import {BasicAbility} from "./basic-ability.js";
import {RecoveryEffect} from "../../effects/recovery-effect.js";

export class RecoveryBasicAbility extends BasicAbility {
    constructor() {
        super(arguments[0]);

        this.effect = new RecoveryEffect({
            match: this.match,
            ability: this,
        });
    }
    async resolveAbility(params) {
        const {card} = this;

        const damage = card.recovery;

        return super.resolveAbility({
            ...params,
            damage,
        });
    }
    toObj() {
        return {
            ...super.toObj(arguments[0]),
        }
    }
}