export function getPlayerSeatId(player) {
    return player?.id ?? player?.userId ?? player?.name;
}

export function findPlayerSeat(players, identifier) {
    const exactSeat = players.find(player => player.id === identifier);
    if (exactSeat) {
        return exactSeat;
    }
    const matches = players.filter(player =>
        player.userId === identifier || player.name === identifier);

    return matches.length === 1 ? matches[0] : undefined;
}

export function isActionRequestSeat(match, request, role, player) {
    const identifier = request[`${role}Id`] ?? request[`${role}UserId`];

    return findPlayerSeat(match.players, identifier) === player;
}
