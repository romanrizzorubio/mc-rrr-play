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
    }
    isResolved() {
        return this.isPaid;
    }
    isFullResolved() {
        return this.isPaid;
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
            session.getExcludedCardIds()
        );
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {card} = params;

        this.isPaid = false;
        if (!this.resources.length) {
            this.isPaid = true;
            return;
        }

        const paid = params.costPaymentSession ?
            params.costPaymentSession.getPayment(this) :
            await selectedTarget.spendResources(this.resources, card);

        if (paid) {
            const payCostEffect = new PayCostEffect({
                hand: paid.hand,
                generators: paid.generators,
                selectedTarget: card,
                match: this.match,
            });

            await payCostEffect.runEffect(params);

            this.isPaid = true;
        } else {
            this.paymentCancelled = true;
        }
    }
}
