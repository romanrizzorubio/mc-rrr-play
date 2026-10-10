import {Effect} from './effect.js';

export class AddHandEffect extends Effect {
    async execute(params) {
        const {cards, player} = params;

        player.hand.addCards(cards);

        await player.hand.refresh();
    }
}