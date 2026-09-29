import {Effect} from "./effect.js";

export const EFFECT_MOVE_TO_DECK = 'move-to-deck';

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
            this.match.logger.info(`${targetPlayer.name} mueve ${cardsToMove.length} carta(s) a su mazo.`);
        }
    }
}
