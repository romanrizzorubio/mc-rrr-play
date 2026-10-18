export function isPlayCardDropTarget(card, dragPlayCard) {
    if (!card || !Array.isArray(dragPlayCard?.targetIds)) {
        return false;
    }

    const cardIds = new Set([card.id, card.parentId].filter(id =>
        id !== undefined && id !== null));

    return dragPlayCard.targetIds.some(id => cardIds.has(id));
}

export function hasPlayCardDropTarget(cards, dragPlayCard) {
    return Array.isArray(cards) &&
        cards.some(card => isPlayCardDropTarget(card, dragPlayCard));
}
