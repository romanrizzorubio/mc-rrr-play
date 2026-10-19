export function getTriggerCardPlayer(card, player) {
    if (card.isEvent) {
        return player;
    }

    const attachedPlayer = card.attachedTo?.owner;

    return attachedPlayer?.isPlayer ?
        attachedPlayer :
        card.controller;
}

export function isEventInPlayerHand(card, player) {
    return Boolean(card.isEvent &&
        Array.isArray(player?.hand?.cards) &&
        player.hand.cards.includes(card));
}
