import {Effect} from './effect.js';
import {PayCostEffect} from './pay-cost-effect.js';

export class SpendXEffect extends Effect {
    constructor({
        resourceType,
    }) {
        super(arguments[0]);

        this.resourceType = resourceType;
        this.resources = 0;
        this.paid = [];
    }
    async execute(params) {
        const {selectedTarget, resourceType} = this;
        const {card} = params;
//TODO wild resources
        const paid = await selectedTarget.spendResourcesX(this.resources, card, resourceType);

        if (paid) {
            this.paid = paid.resources;

            const payCostEffect = new PayCostEffect({
                hand: paid.hand,
                generators: paid.generators,
                selectedTarget: card,
                match: this.match,
            });

            await payCostEffect.runEffect(params);
        }
    }
}
