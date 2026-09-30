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
        await player.deck.discard(this.cards);

        player.deck.refresh();
    }
}