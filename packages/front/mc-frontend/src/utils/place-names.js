import {
    PLACE_ASIDE_MATCH,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_HAND,
    PLACE_IN_PLAY,
    PLACE_OUTSIDE_NEMESIS,
} from 'mc-shared';

const placeNames = {
    [PLACE_ASIDE_MATCH]: 'Cartas apartadas del escenario',
    [PLACE_DECK]: 'Mazo del jugador',
    [PLACE_DISCARD_PILE]: 'Descarte del jugador',
    [PLACE_ENCOUNTER_DECK_CARDS]: 'Mazo de Encuentros',
    [PLACE_ENCOUNTER_DISCARD]: 'Descarte de Encuentros',
    [PLACE_HAND]: 'Mano del jugador',
    [PLACE_IN_PLAY]: 'En juego',
    [PLACE_OUTSIDE_NEMESIS]: 'Cartas de archienemigo apartadas',
};

export const getPlaceName = place => placeNames[place] || place;
