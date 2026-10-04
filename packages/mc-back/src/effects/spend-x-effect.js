import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';
import {getResourceName} from '../utils/resource-name.js';

export class SpendXEffect extends Effect {
    constructor({
        resourceType,
    }) {
        super(arguments[0]);

        this.resourceType = resourceType;
        this.resources = 0;
        this.paid = [];
        this.isPaid = false;
    }
    isResolved() {
        return this.isPaid;
    }
    isFullResolved() {
        return this.isPaid;
    }
    getCostPaymentEffects() {
        return [this];
    }
    getCostPaymentTitle() {
        const resource = this.resourceType ?
            `de ${getResourceName(this.resourceType)}` :
            'que quieras';

        return this.title || `Pagar los recursos ${resource}`;
    }
    async preparePayment(params, session) {
        return this.selectedTarget.spendResourcesX(
            this.resources,
            params.card,
            this.resourceType,
            session.getExcludedCardIds()
        );
    }
    async execute(params) {
        const {selectedTarget, resourceType} = this;
        const {card} = params;
//TODO wild resources
        this.isPaid = false;
        const paid = params.costPaymentSession ?
            params.costPaymentSession.getPayment(this) :
            await selectedTarget.spendResourcesX(this.resources, card, resourceType);

        if (paid) {
            this.paid = paid.resources;

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
