import {Effect} from "./effect.js";
import {DiscardFromHandEffect} from "./discard-from-hand-effect.js";

export class PayCostEffect extends Effect {
    constructor({
        hand,
        generators,
    }) {
        super(arguments[0]);

        this.hand = hand;
        this.generators = generators;
    }
    payGenerators(params) {
        const {generators} = this;

        return this.promisesSequential(generators, card => card.resolveResourceAbility({
            ...params,
            card,
        }));
    }
    payHand(params) {
        const {hand} = this;

        return this.promisesSequential(hand, card => {
            const discardFromHandEffect = new DiscardFromHandEffect({
                selectedTarget: card,
                refreshTarget: true,
                match: this.match,
            });

            return discardFromHandEffect.runEffect(params)
        })
    }

    async execute(params) {
        await this.payGenerators(params);
        await this.payHand(params);
    }
}