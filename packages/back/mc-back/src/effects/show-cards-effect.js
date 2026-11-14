import {DIALOG_REVEAL_CARDS} from 'mc-shared';

import {Effect} from './effect.js';

export class ShowCardsEffect extends Effect {
    constructor(params) {
        super(params);

        this.subtitle = params.subtitle;
    }
    async execute(params) {
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget : [this.selectedTarget];
        const cards = targets.filter(Boolean);
        if (!cards.length) {
            return;
        }

        await this.openPublicDialog({
            dialogType: DIALOG_REVEAL_CARDS,
            title: this.title,
            subtitle: this.subtitle,
            data: {
                cards: cards.map(card => card.toObj(params)),
            },
        }, params.player);
    }
}
