import {Effect} from './effect.js';

export class ReturnHandEffect extends Effect {
    async execute() {
        const {selectedTarget} = this;
        const player = selectedTarget.controller || selectedTarget.owner;
        if (!player?.hand) {
            throw new TypeError('ReturnHandEffect requires a card with an owner.');
        }

        if (selectedTarget.isInPlay) {
            await selectedTarget.remove();
            await player.gameZone.refresh();
        } else {
            const deck = selectedTarget.owner?.deck;
            let removedFromDeck = false;

            if (deck?.discardPile.includes(selectedTarget)) {
                deck.searchDiscard(selectedTarget);
                removedFromDeck = true;
            } else if (deck?.cards.includes(selectedTarget)) {
                deck.removeCardFromDeck(selectedTarget);
                removedFromDeck = true;
            }

            if (removedFromDeck) {
                await deck.refresh();
            }
        }

        if (!player.hand.cards.includes(selectedTarget)) {
            player.hand.addCards([selectedTarget]);
        }

        await player.hand.refresh();
        await selectedTarget.refresh();
    }
}
