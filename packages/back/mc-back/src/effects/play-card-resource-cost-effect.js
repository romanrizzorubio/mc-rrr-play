import {RESOURCES_X, TARGET_YOU} from 'mc-shared';
import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';

export class PlayCardResourceCostEffect extends Effect {
    constructor({
        resourceCost,
        playCardEffect,
        match = playCardEffect.match,
    }) {
        super({
            match,
            target: TARGET_YOU,
            isCost: true,
        });

        this.resourceCost = resourceCost;
        this.playCardEffect = playCardEffect;
        this.isPaid = false;
    }
    getResolutionChildEffects() {
        const effects = super.getResolutionChildEffects();

        // The owning play effect is context, not a child to reset during payment.
        effects.delete(this.playCardEffect);

        return effects;
    }
    getCostPaymentEffects() {
        return [this];
    }
    getCostPaymentTitle() {
        return this.title || `Pagar el coste de ${this.resourceCost.card.name}`;
    }
    async preparePayment(params, session) {
        return this.playCardEffect.payCost(
            params,
            session,
            this.resourceCost
        );
    }
    isResolved() {
        return this.isPaid;
    }
    isFullResolved() {
        return this.isPaid;
    }
    async execute(params) {
        const payment = params.costPaymentSession.getPayment(this);
        const payCostEffect = new PayCostEffect({
            generators: payment.generators,
            hand: payment.hand,
            match: this.match,
            selectedTarget: this.resourceCost.card,
        });

        await payCostEffect.runEffect(params);
        if (!payCostEffect.resolved || payCostEffect.paymentCancelled) {
            this.paymentCancelled = payCostEffect.paymentCancelled;

            return;
        }

        this.playCardEffect.resourcesPaid = payment.resources;
        const isVariableCost = this.resourceCost.amount === RESOURCES_X;
        const requiredResourceCount = isVariableCost ?
            payment.resources.length :
            this.resourceCost.getRequiredResources().length +
                this.resourceCost.requirement.length;
        this.playCardEffect.resourcesOverpaid =
            !isVariableCost && this.resourceCost.allowOverpay ?
                Math.max(0, payment.resources.length - requiredResourceCount) :
                0;
        this.isPaid = true;
    }
}
