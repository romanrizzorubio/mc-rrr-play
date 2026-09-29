import {Effect} from "./effect.js";
import {RandomCardEffect} from "./random-card-effect.js";
import {DiscardFromHandEffect} from "./discard-from-hand-effect.js";

export const EFFECT_DISCARD_RANDOM = 'discard-random';
export class DiscardRandomEffect extends Effect {
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

        const randomCardEffect = new RandomCardEffect({
            count,
            showDialog,
            selectedTarget,
            match: this.match,
        });

        await randomCardEffect.runEffect(params);

        this.cards = randomCardEffect.cards;

        const discardFromHandEffect = new DiscardFromHandEffect({
            match: this.match,
        });

        await this.promisesSequential(this.cards, async card => {
            discardFromHandEffect.selectedTarget = card;

            await discardFromHandEffect.runEffect(params);
        })
    }
}