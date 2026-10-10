import {Effect} from './effect.js';


export class MoveToHandEffect extends Effect {
    async execute(params) {
        const {card, player} = params;
        const targetPlayer = this.selectedTarget || player;

        if (card && targetPlayer && targetPlayer.hand) {
            let removedFromDeck = false;
            const sourceDeck = [card.owner?.deck, targetPlayer.deck]
                .find(deck => deck &&
                    (deck.cards.includes(card) || deck.discardPile.includes(card)));

            if (sourceDeck?.cards.includes(card)) {
                await sourceDeck.searchDeck(card);
                removedFromDeck = true;
            } else if (sourceDeck?.discardPile.includes(card)) {
                sourceDeck.searchDiscard(card);
                removedFromDeck = true;
            }

            targetPlayer.hand.addCard(card);
            if (removedFromDeck) {
                sourceDeck.refresh();
            }
            await targetPlayer.hand.refresh();
        }
    }
}
