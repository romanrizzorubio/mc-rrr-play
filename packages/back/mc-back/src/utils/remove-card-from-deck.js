export async function removeCardFromDeck(card, deck = card?.owner?.deck) {
    let removedFromDeck = false;

    if (deck?.cards?.includes(card)) {
        deck.removeCardFromDeck(card);
        removedFromDeck = true;
    } else if (deck?.discardPile?.includes(card)) {
        deck.searchDiscard(card);
        removedFromDeck = true;
    }

    if (removedFromDeck) {
        await deck.checkCycle?.();
        await deck.refresh();
    }

    return removedFromDeck;
}
