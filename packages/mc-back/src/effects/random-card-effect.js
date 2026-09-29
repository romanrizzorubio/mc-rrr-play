import {Effect} from "./effect.js";

export const EFFECT_RANDOM_CARD = 'random-card';
export class RandomCardEffect extends Effect {
    constructor({
        count = 1,
        showDialog = true,
    }) {
        super(arguments[0]);

        this.count = count;
        this.showDialog = showDialog;

        this.cards = [];
    }
    async execute(params) {
        const {selectedTarget, count, showDialog} = this;

        for (let i = 0 ; i < count ; i++) {
            this.cards.push(await selectedTarget.hand.discardRandom(showDialog));
        }

        selectedTarget.hand.refresh();
    }
}