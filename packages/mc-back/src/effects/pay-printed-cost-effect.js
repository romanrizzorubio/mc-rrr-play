import {RESOURCE_ANY} from 'mc-shared';

import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';


export class PayPrintedCostEffect extends Effect {
    constructor() {
        super(arguments[0]);

        this.isPaid = false;
    }

    isResolved() {
        return this.isPaid;
    }
    isFullResolved() {
        return this.isPaid;
    }
    getCard(params) {
        return params.selectedCard || params.card || this.selectedTarget;
    }
    getCostPaymentEffects(params) {
        const card = this.getCard(params);

        return card && card.cost > 0 ? [this] : [];
    }
    getCostPaymentTitle(params) {
        const card = this.getCard(params);

        return this.title || `Pagar el coste de ${card.name}`;
    }
    async preparePayment(params, session) {
        const {player} = params;
        const card = this.getCard(params);
        const requiredResources = Array(card.cost).fill(RESOURCE_ANY);

        return player.spendResources(
            requiredResources,
            card,
            session.getExcludedCardIds()
        );
    }

    async execute(params) {
        const {player} = params;
        const card = this.getCard(params);

        this.isPaid = false;
        
        if (!card) {
            this.isPaid = true;
            return;
        }

        const cost = card.cost;
        if (cost === 0) {
            this.isPaid = true;
            return;
        }

        // Generamos un array de recursos universales para representar el coste impreso
        const requiredResources = Array(cost).fill(RESOURCE_ANY);
        
        const paid = params.costPaymentSession ?
            params.costPaymentSession.getPayment(this) :
            await player.spendResources(requiredResources, card);

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
