import {DIALOG_REVEAL_CARDS} from 'mc-shared';

import {Effect} from './effect.js';

export class DiscardFromDeckEffect extends Effect {
    constructor({
        count = 1,
    }) {
        super(arguments[0]);

        this.count = count;
        this.cards = [];
    }

    async execute(params) {
        const {player} = params;
        const {count} = this;

        this.cards = await player.deck.draw(count);
        if (this.cards.length > 0) {
            await this.openDialog({
                dialogType: DIALOG_REVEAL_CARDS,
                title: 'Cartas que se van a descartar',
                subtitle: 'En el orden en que se descartarán, desde la carta superior.',
                data: {
                    cards: this.cards.map(card => card.toObj(params)),
                },
            });
        }

        await player.deck.discard(this.cards);

        player.deck.refresh();
    }
}