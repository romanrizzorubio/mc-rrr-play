import {Ability} from "../core/ability.js";
import {Arrow} from "../core/arrow.js";
import {ExhaustEffect} from "../../effects/exhaust-effect.js";
import {TARGET_CARD} from "../../constants/targets.js";
import {DealConsequencialDamageEffect} from "../../effects/deal-consequencial-damage-effect.js";

export class BasicAbility extends Ability {
    constructor() {
        super(arguments[0]);

        this.arrow = new Arrow({
            cost: new ExhaustEffect({
                target: TARGET_CARD,
                match: this.match,
                isArrow: true,
            }),
        });

        this.isBasic = true;
    }
    applyConsequencial(params, damage) {
        const dealConsequencialDamageEffect = new DealConsequencialDamageEffect({
            match: this.match,
            selectedTarget: this.card,
            damage,
        });

        return dealConsequencialDamageEffect.runEffect(params);
    }
    async resolveAbility(params) {
        const {card} = params;

        await super.resolveAbility(params);

        if (this.resolved && card.isAlly) {
            await this.applyConsequencial(params);
        }
    }
}