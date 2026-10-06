import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';

import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';
import {getResourceName} from '../utils/resource-name.js';

export class SpendEffect extends Effect {
    constructor({
        resources
    }) {
        super(arguments[0]);

        this.resources = resources;

        this.isPaid = false;
        this.isFullyPaid = false;
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        if (!this.allowPartialPayment(params) || !this.resources.length) {
            return true;
        }

        const excludedCardIds = params.costPaymentSession ?
            params.costPaymentSession.getExcludedCardIds() :
            new Set();
        const targets = (await this.getValidTarget(params)).flat(Infinity);

        for (const target of targets) {
            for (const resource of this.resources) {
                const resourceTypes = resource === RESOURCE_ANY ? [
                    RESOURCE_ENERGY,
                    RESOURCE_MENTAL,
                    RESOURCE_PHYSICAL,
                    RESOURCE_WILD,
                ] : [resource];

                for (const resourceType of resourceTypes) {
                    const {generators, hand} = await target.getCardsToPay(
                        params.card,
                        resourceType,
                        excludedCardIds
                    );

                    if (generators.length || hand.length) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
    allowPartialPayment(params) {
        return !this.isArrow &&
            !params.isCost &&
            !params.costPaymentSession?.requireAllCosts;
    }
    isResolved() {
        return this.isPaid;
    }
    isFullResolved() {
        return this.isFullyPaid;
    }
    getCostPaymentEffects() {
        return this.resources.length ? [this] : [];
    }
    shouldPromptForPayment() {
        return this.resources.length > 0;
    }
    getCostPaymentTitle() {
        const cost = this.resources.map(getResourceName).join(' + ');

        return this.title || `Pagar ${cost}`;
    }
    async preparePayment(params, session) {
        return this.selectedTarget.spendResources(
            this.resources,
            params.card,
            session.getExcludedCardIds(),
            {
                allowPartial: this.allowPartialPayment(params),
            }
        );
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {card} = params;
        const allowPartial = this.allowPartialPayment(params);

        this.isPaid = false;
        this.isFullyPaid = false;
        if (!this.resources.length) {
            this.isPaid = true;
            this.isFullyPaid = true;
            return;
        }

        const paid = params.costPaymentSession?.hasPayment(this) ?
            params.costPaymentSession.getPayment(this) :
            await selectedTarget.spendResources(
                this.resources,
                card,
                new Set(),
                {allowPartial}
            );

        if (paid) {
            this.isPaid = true;
            this.isFullyPaid = paid.fullyPaid ?? !allowPartial;

            const payCostEffect = new PayCostEffect({
                hand: paid.hand,
                generators: paid.generators,
                selectedTarget: card,
                match: this.match,
            });

            await payCostEffect.runEffect(params);
        } else {
            this.paymentCancelled = true;
        }
    }
}
