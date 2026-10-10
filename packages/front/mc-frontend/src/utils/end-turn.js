export function getEndTurnConfirmationReasons(player) {
    const reasons = [];
    const readyAllies = player.gameZone.cards.filter(card =>
        card.isAlly && !card.exhausted).length;
    const playableCards = player.hand.filter(card =>
        card.playable === true).length;

    if (!player.superhero.exhausted) {
        reasons.push('Tu superhéroe está preparado.');
    }
    if (readyAllies) {
        reasons.push(readyAllies === 1 ?
            'Tienes 1 aliado preparado.' :
            `Tienes ${readyAllies} aliados preparados.`);
    }
    if (playableCards) {
        reasons.push(playableCards === 1 ?
            'Tienes 1 carta jugable en la mano.' :
            `Tienes ${playableCards} cartas jugables en la mano.`);
    }

    return reasons;
}
