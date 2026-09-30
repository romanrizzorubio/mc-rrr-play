import {Effect} from './effect.js';

export class AddHandEffect extends Effect {
    execute(params) {
        const {cards, player} = params;

        player.hand.addCards(cards);

        player.hand.refresh();
    }
}