import {Effect} from './effect.js';
import {logGameTrace} from '../utils/game-trace.js';


export class MoveToDeckEffect extends Effect {
    async execute(params) {
        const {player, selectedCards} = params;
        const targetPlayer = this.selectedTarget || player;
        const cardsToMove = selectedCards || (params.card ? [params.card] : []);

        if (targetPlayer && targetPlayer.deck && cardsToMove.length > 0) {
            cardsToMove.forEach(card => {
                // Si la carta está en el descarte, la quitamos de ahí
                targetPlayer.deck.searchDiscard(card);
                // La añadimos al mazo
                targetPlayer.deck.addToDeck([card]);
            });
            logGameTrace('deck.cards-moved', {
                match: this.match.name,
                player: targetPlayer.name,
                count: cardsToMove.length,
            });
        }
    }
}
