export function isOtherPlayerTurn(player) {
    const match = player?.match;
    const currentPlayer = match?.currentTurnPlayer;
    if (match?.phase !== 'players' || !currentPlayer) {
        return false;
    }

    const currentId = typeof currentPlayer === 'string' ?
        currentPlayer :
        currentPlayer.id ?? currentPlayer.userId ?? currentPlayer.name;
    const playerId = player.id ?? player.userId ?? player.name;

    return currentId !== playerId;
}

export function canPlayCardDuringTurn(card, player) {
    return !isOtherPlayerTurn(player) ||
        Boolean(card?.isEvent && card.abilities?.some(ability => ability.isAction));
}

export function assertOwnTurnOption(player) {
    if (isOtherPlayerTurn(player)) {
        const error = new Error(
            'Esta opción solo está disponible durante tu propio turno; a petición de otro jugador solo puedes activar capacidades de Acción.'
        );
        error.statusCode = 403;
        throw error;
    }
}
