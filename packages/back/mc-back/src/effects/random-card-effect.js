import {path, random} from '../engine/utils.js';

import {Effect} from './effect.js';

export class RandomCardEffect extends Effect {
    constructor({
        count = 1,
        showDialog = true,
        removeFromSource = false,
    }) {
        super(arguments[0]);

        this.count = count;
        this.showDialog = showDialog;
        this.removeFromSource = removeFromSource;

        this.cards = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
    }
    getSourceCards(params) {
        if (!this.source) {
            return undefined;
        }

        const cards = path(params, this.source);
        if (!Array.isArray(cards)) {
            throw new TypeError('RandomCardEffect source must resolve to a card array.');
        }

        return cards;
    }
    async execute(params) {
        const {selectedTarget, count, showDialog} = this;
        this.cards = [];

        if (Array.isArray(selectedTarget)) {
            const availableCards = selectedTarget.slice();
            const sourceCards = this.removeFromSource ?
                this.getSourceCards(params) :
                undefined;

            for (let i = 0; i < count && availableCards.length; i++) {
                const index = random(0, availableCards.length - 1);
                const [card] = availableCards.splice(index, 1);

                this.cards.push(card);

                if (sourceCards) {
                    const sourceIndex = sourceCards.indexOf(card);
                    if (sourceIndex === -1) {
                        throw new Error(
                            'RandomCardEffect selected a card outside its source.'
                        );
                    }

                    sourceCards.splice(sourceIndex, 1);
                }
            }

            return;
        }

        for (let i = 0 ; i < count ; i++) {
            this.cards.push(await selectedTarget.hand.discardRandom(showDialog));
        }

        await selectedTarget.hand.refresh();
    }
}