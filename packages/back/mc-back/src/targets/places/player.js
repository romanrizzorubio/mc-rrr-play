import {
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
    PLACE_OUTSIDE_NEMESIS,
    PLACE_PLAYER_ENCOUNTERS,
} from 'mc-shared';

const getPlayer = (player, location) => {
    if (!player) {
        throw new Error(`TARGET_BY_TITLE requiere un jugador para buscar en ${location}.`);
    }

    return player;
};

export const playerPlaces = {
    [PLACE_DECK]: ({player}) => getPlayer(player, PLACE_DECK).deck.cards,
    [PLACE_DISCARD_PILE]: ({player}) =>
        getPlayer(player, PLACE_DISCARD_PILE).deck.discardPile,
    [PLACE_HAND]: ({player}) => getPlayer(player, PLACE_HAND).hand.cards,
    [PLACE_OUTSIDE_NEMESIS]: ({player}) =>
        getPlayer(player, PLACE_OUTSIDE_NEMESIS).superhero.nemesis,
    [PLACE_PLAYER_ENCOUNTERS]: ({player}) =>
        getPlayer(player, PLACE_PLAYER_ENCOUNTERS).encounters,
};
