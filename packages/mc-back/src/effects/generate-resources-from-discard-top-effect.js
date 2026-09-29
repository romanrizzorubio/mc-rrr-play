import {Effect} from "./effect.js";
import {PayCostEffect} from "./pay-cost-effect.js";

export const EFFECT_GENERATE_RESOURCES_FROM_DISCARD_TOP = 'generate-resources-from-discard-top';
export class GenerateResourcesFromDiscardTopEffect extends Effect {
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
    async execute(params) {
        const {player, card} = params;
        const {selectedTarget} = this;

        this.isPaid = false;

        const topCard = player.deck.getDiscardTop();
        if (topCard) {
            const resources = topCard.card.resources || [];
            const paid = await selectedTarget.spendResources(resources, card);

            if (paid) {
                const payCostEffect = new PayCostEffect({
                    hand: paid.hand,
                    generators: paid.generators,
                    selectedTarget: card,
                    match: this.match,
                });

                await payCostEffect.runEffect(params);

                this.isPaid = true;
            }
        }
    }
}
