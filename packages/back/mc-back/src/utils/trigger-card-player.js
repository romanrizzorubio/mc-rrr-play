export function getTriggerCardPlayer(card, player) {
    return card.isEvent ? player : card.controller;
}

export function isEventInPlayerHand(card, player) {
    return Boolean(card.isEvent &&
        Array.isArray(player?.hand?.cards) &&
        player.hand.cards.includes(card));
}
