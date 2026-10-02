import {Effect} from './effect.js';

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
    async execute() {
        const {selectedTarget, count, showDialog} = this;

        for (let i = 0 ; i < count ; i++) {
            this.cards.push(await selectedTarget.hand.discardRandom(showDialog));
        }

        await selectedTarget.hand.refresh();
    }
}