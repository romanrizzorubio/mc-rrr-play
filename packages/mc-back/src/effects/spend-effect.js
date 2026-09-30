import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';

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
    async execute(params) {
        const {selectedTarget} = this;
        const {card} = params;

        this.isPaid = false;

        const paid = await selectedTarget.spendResources(this.resources, card);

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
