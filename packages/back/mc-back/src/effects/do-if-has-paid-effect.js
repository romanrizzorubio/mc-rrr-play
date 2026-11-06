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
    async getRequiredPaymentResources(params) {
        if (!this.effect || !this.effectNot || !this.resources.length) {
            return [];
        }

        if (!await this.effect.canRun(params) ||
            await this.effectNot.canRun(params)) {
            return [];
        }

        return this.resources.slice();
    }
    async selectTarget(params) {
        if (!params.playCardEffect ||
            !this.effect ||
            this.effect.target !== this.target ||
            !(await this.getRequiredPaymentResources(params)).length) {
            return super.selectTarget(params);
        }

        return this.effect.selectTarget({
            ...params,
            effect: this.effect,
        });
    }
    async canRun(params) {
        if (await super.canRun(params)) {
            return true;
        }

        if (!params.playCardEffect) {
            return false;
        }

        return (await this.getRequiredPaymentResources(params)).length > 0;
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

        const paid = playCardEffect?.resourcesPaid ?? [];
        if (!Array.isArray(paid)) {
            throw new TypeError(
                'DoIfHasPaidEffect requires an array of paid resources.'
            );
        }
        const paidResources = paid.slice();
        if (this.exclusive &&
            (!paidResources.length ||
                paidResources.some(resource =>
                    !this.resources.includes(resource)))) {
            return false;
        }

        const needed = this.resources.slice();

        while (paidResources.length) {
            const resourcePaid = paidResources.shift();

            const index = needed.indexOf(resourcePaid);
            if (index > -1) {
                needed.splice(index, 1);
            }
        }

        return !needed.length;
    }
}