export function getUpgradesForDisplay(cards, attachedUpgrades = []) {
    return [
        ...cards.filter(card => card.isUpgrade && !card.isAttached),
        ...attachedUpgrades.filter(card => card.isUpgrade),
    ].sort((a, b) => a.id > b.id ? 1 : -1);
}
