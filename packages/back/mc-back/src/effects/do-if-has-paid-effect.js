import {DoIfEffect} from './do-if-effect.js';

export class DoIfHasPaidEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition: _condition,
        effect: _effect,
        effectNot: _effectNot,
// DoIfHasDamageEffect
        resources = [],
        exclusive = false,
    }) {
        super(arguments[0]);

        this.resources = resources;
        this.exclusive = exclusive;
    }
    getPaymentResourcePreferences() {
        return [
            ...super.getPaymentResourcePreferences(),
            ...this.resources,
        ];
    }
    getExclusivePaymentResourcePreferences() {
        return [
            ...super.getExclusivePaymentResourcePreferences(),
            ...(this.exclusive && new Set(this.resources).size === 1 ?
                this.resources :
                []),
        ];
    }
    checkCondition(params) {
        const {playCardEffect} = params;

        const paid = playCardEffect.resourcesPaid.slice();
        if (this.exclusive &&
            (!paid.length ||
                paid.some(resource => !this.resources.includes(resource)))) {
            return false;
        }

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