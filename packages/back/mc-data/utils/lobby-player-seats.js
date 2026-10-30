export function getLobbyPlayerSeats(lobby) {
    const counts = new Map();
    const positions = new Map();
    lobby.players.forEach(player => {
        counts.set(player.userId, (counts.get(player.userId) || 0) + 1);
    });

    return lobby.players.map(player => {
        const position = (positions.get(player.userId) || 0) + 1;
        positions.set(player.userId, position);

        return {
            ...player,
            id: player.id || `${lobby.id}:seat:${player.userId}:${player.hero}`,
            name: counts.get(player.userId) > 1 ?
                `${player.name} (${position})` :
                player.name,
        };
    });
}
