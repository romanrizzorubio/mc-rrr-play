import {DoIfEffect} from "./do-if-effect.js";

export const EFFECT_DO_IF_HAS_PAID = 'do-if-has-paid';
export class DoIfHasPaidEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition,
        effect,
        effectNot,
// DoIfHasDamageEffect
        resources = [],
    }) {
        super(arguments[0]);

        this.resources = resources;
    }
    checkCondition(params) {
        const {playCardEffect} = params;

        const paid = playCardEffect.resourcesPaid.slice();
        const needed = this.resources.slice();

        while (paid.length) {
            const resourcePaid = paid.shift();

            const index = needed.indexOf(resourcePaid);
            if (index > -1) {
                needed.splice(index, 1);
            }
        }

        return !needed.length;
    }
}