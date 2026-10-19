import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';
import {ResourceCost} from '../model/costs/resource-cost.js';


export class PayPrintedCostEffect extends Effect {
    constructor({
        deckId,
        position,
    }) {
        super(arguments[0]);

        this.deckId = deckId;
        this.position = position;
        this.isPaid = false;
    }

    isResolved() {
        return this.isPaid;
    }
    isFullResolved() {
        return this.isPaid;
    }
    getCard(params) {
        const selectedTarget = this.selectedTarget;
        const selectedTargetCard = selectedTarget &&
            selectedTarget.cost !== undefined ?
            selectedTarget :
            undefined;

        return params.selectedCard ||
            selectedTargetCard ||
            params.card ||
            selectedTarget;
    }
    getCostPaymentEffects(params) {
        const card = this.getCard(params);
        if (!card || !(card.cost > 0)) {
            return [];
        }

        const cost = new ResourceCost({amount: card.cost});

        return cost.requiresPayment ? [this] : [];
    }
    getCostPaymentTitle(params) {
        const card = this.getCard(params);

        return this.title || `Pagar el coste de ${card.name}`;
    }
    async preparePayment(params, session) {
        const {player} = params;
        const card = this.getCard(params);
        const cost = new ResourceCost({amount: card.cost});

        const payment = await player.spendResources(
            cost.getRequiredResources(),
            card,
            session.getResourcePaymentExcludedCardIds(),
            {
                showCancel: true,
                resourceUsage: session.getRemainingResources(),
            }
        );

        return payment && {
            ...payment,
            cardToPay: card,
            resourceRequirements: cost.getRequiredResources(),
        };
    }

    async execute(params) {
        const {player} = params;
        const card = this.getCard(params);

        this.isPaid = false;
        
        if (!card) {
            this.isPaid = true;
            return;
        }

        const resourceCost = new ResourceCost({amount: card.cost});
        if (!resourceCost.requiresPayment) {
            this.isPaid = true;
            return;
        }

        const paid = params.costPaymentSession ?
            params.costPaymentSession.getPayment(this) :
            await player.spendResources(
                resourceCost.getRequiredResources(),
                card
            );

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
