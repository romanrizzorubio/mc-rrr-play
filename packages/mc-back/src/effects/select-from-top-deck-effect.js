import {DIALOG_SELECT_TARGET} from '../constants/dialogs.js';

import {Effect} from './effect.js';

export class SelectFromTopDeckEffect extends Effect {
    constructor({
        count = 1,
        selectCount = 1,
        title = 'Elige una carta',
    }) {
        super(arguments[0]);

        this.count = count;
        this.selectCount = selectCount;
        this.title = title;

        this.selectedCards = [];
    }

    async execute(params) {
        const {player} = params;
        const {count, selectCount, title} = this;

        const cards = await player.deck.draw(count);

        if (cards.length > 0) {
            const {selected} = await this.openDialog({
                dialogType: DIALOG_SELECT_TARGET,
                title: title,
                data: {
                    cards: cards.map(card => card.toObj(arguments[0])),
                    count: selectCount,
                },
            });

            const selectedArray = Array.isArray(selected) ? selected : [selected];
            this.selectedCards = cards.filter(card => selectedArray.some(s => s.id === card.id));
            const toDiscard = cards.filter(card => !this.selectedCards.includes(card));

            if (this.selectedCards.length > 0) {
                await player.hand.add(this.selectedCards);
            }

            if (toDiscard.length > 0) {
                await player.deck.discard(toDiscard);
            }

            player.deck.refresh();
            await player.hand.refresh();
        }
    }
}
