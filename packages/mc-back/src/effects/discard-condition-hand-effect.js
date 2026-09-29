import {Effect} from "./effect.js";
import {RandomCardEffect} from "./random-card-effect.js";
import {DiscardFromHandEffect} from "./discard-from-hand-effect.js";

export const EFFECT_DISCARD_CONDITION_HAND = 'discard-condition-hand';
export class DiscardConditionHandEffect extends Effect {
    constructor({
        condition,
    }) {
        super(arguments[0]);

        this.condition = condition;

        this.cards = [];
    }
    async prepare(params) {
        await super.prepare(params);

        const {selectedTarget, condition} = this;

        if (!this.cards.length) {
            this.cards = selectedTarget.hand.searchCards(condition);
        }
    }
    async canRun(params) {
        await this.prepare(params);

        return !!this.cards.length &&
            super.canRun(params);
    }
    async execute(params) {
        const {cards} = this;

        const discardFromHandEffect = new DiscardFromHandEffect({
            match: this.match,
        });

        await this.promisesSequential(cards, async card => {
            discardFromHandEffect.selectedTarget = card;

            await discardFromHandEffect.runEffect(params);
        })
    }
}