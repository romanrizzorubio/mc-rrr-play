import {Effect} from './effect.js';


export class MoveToHandEffect extends Effect {
    async execute(params) {
        const {card, player} = params;
        const targetPlayer = this.selectedTarget || player;

        if (card && targetPlayer && targetPlayer.hand) {
            let removedFromDeck = false;

            // Si la carta está en el mazo, la quitamos
            if (targetPlayer.deck && targetPlayer.deck.cards.includes(card)) {
                await targetPlayer.deck.searchDeck(card);
                removedFromDeck = true;
            } 
            // Si la carta está en el descarte, la quitamos
            else if (targetPlayer.deck && targetPlayer.deck.discardPile.includes(card)) {
                targetPlayer.deck.searchDiscard(card);
                removedFromDeck = true;
            }

            // La añadimos a la mano
            targetPlayer.hand.addCard(card);
            if (removedFromDeck) {
                targetPlayer.deck.refresh();
            }
            await targetPlayer.hand.refresh();
        }
    }
}
