import {DoIfEffect} from "./do-if-effect.js";

export const EFFECT_DO_IF_HAS_DAMAGE = 'do-if-has-damage';
export class DoIfHasDamageEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition,
        effect,
        effectNot,
// DoIfHasDamageEffect
        damage
    }) {
        super(arguments[0]);

        this.damage = damage;
    }

    checkCondition(card) {
        return card.damage >= this.damage;
    }
}