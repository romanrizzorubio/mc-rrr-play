import { DIALOG_DISCARD_HAND} from 'mc-shared';

import {DiscardFromHandEffect} from './discard-from-hand-effect.js';
import {Effect} from './effect.js';

export class SelectDiscardCardEffect extends Effect {
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
        const {selectedTarget, count} = this;

        const response = await this.openDialog({
            dialogType: DIALOG_DISCARD_HAND,
            data: {
                count,
                cards: selectedTarget.hand.cards.map(card => card.toObj(arguments[0]))
            },
        });

        const {selected} = response;

        if (selected) {
            this.cards = selected.map(card => selectedTarget.hand.cards.find(c => c.id === card.id));

            const discardFromHandEffect = new DiscardFromHandEffect({
                match: this.match,
            });

            await this.promisesSequential(this.cards, async card => {
                discardFromHandEffect.selectedTarget = card;

                await discardFromHandEffect.runEffect(params);
            });
        }
    }
}