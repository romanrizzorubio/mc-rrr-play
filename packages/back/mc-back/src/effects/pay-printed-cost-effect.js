import {RESOURCES_X} from 'mc-shared';
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
        this.resourceCost = undefined;
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
        if (!card ||
            (!(card.cost > 0) && card.cost !== RESOURCES_X)) {
            this.resourceCost = undefined;

            return [];
        }

        this.resourceCost = new ResourceCost({amount: card.cost});

        return this.resourceCost.requiresPayment ? [this] : [];
    }
    getCostPaymentTitle(params) {
        const card = this.getCard(params);

        return this.title || `Pagar el coste de ${card.name}`;
    }
    async preparePayment(params, session) {
        const {player} = params;
        const card = this.getCard(params);
        const cost = this.resourceCost ??
            new ResourceCost({amount: card.cost});
        const excludedCardIds = session.getResourcePaymentExcludedCardIds();
        const resourceUsage = session.getRemainingResources();
        const payment = cost.amount === RESOURCES_X ?
            await player.spendResourcesX(
                cost.requirement,
                card,
                cost.resourceType,
                excludedCardIds,
                resourceUsage
            ) :
            await player.spendResources(
                cost.getRequiredResources(),
                card,
                excludedCardIds,
                {
                    showCancel: true,
                    resourceUsage,
                }
            );

        return payment && {
            ...payment,
            cardToPay: card,
            ...(cost.amount === RESOURCES_X ? {} : {
                resourceRequirements: cost.getRequiredResources(),
            }),
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

        const resourceCost = this.resourceCost ??
            new ResourceCost({amount: card.cost});
        if (!resourceCost.requiresPayment) {
            this.isPaid = true;
            return;
        }

        const paid = params.costPaymentSession ?
            params.costPaymentSession.getPayment(this) :
            resourceCost.amount === RESOURCES_X ?
                await player.spendResourcesX(
                    resourceCost.requirement,
                    card,
                    resourceCost.resourceType
                ) :
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
