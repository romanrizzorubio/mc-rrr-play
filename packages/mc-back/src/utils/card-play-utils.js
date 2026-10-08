export const canPlayCard = async (card, params) => {
    if (typeof card?.canPlay !== 'function') {
        throw new TypeError('Playability checks require a game card.');
    }
    if (!params.player) {
        throw new TypeError('Playability checks require a player.');
    }

    return card.canPlay({
        ...params,
        checkOnly: true,
    });
};
