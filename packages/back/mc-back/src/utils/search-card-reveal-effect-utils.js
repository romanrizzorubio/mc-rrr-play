import {
    PLACE_ASIDE_MATCH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_OUTSIDE_NEMESIS,
} from 'mc-shared';

export const SET_ASIDE_PLACES = new Set([
    PLACE_ASIDE_MATCH,
    PLACE_OUTSIDE_NEMESIS,
]);

export const removeFromPlace = new Map([
    [
        PLACE_ASIDE_MATCH,
        (effect, cards) => cards.forEach(card => {
            const index = effect.match.scenario.apart.indexOf(card);
            if (index > -1) {
                effect.match.scenario.apart.splice(index, 1);
            }
        }),
    ],
    [
        PLACE_ENCOUNTER_DECK_CARDS,
        (effect, cards) => cards.forEach(card =>
            effect.match.removeCardFromEncountersDeck(card)),
    ],
    [
        PLACE_ENCOUNTER_DISCARD,
        (effect, cards) => cards.forEach(card =>
            effect.match.scenario.deck.searchDiscard(card)),
    ],
    [
        PLACE_OUTSIDE_NEMESIS,
        (_effect, cards, player) => cards.forEach(card => {
            const index = player.superhero.nemesis.indexOf(card);
            if (index > -1) {
                player.superhero.nemesis.splice(index, 1);
            }
        }),
    ],
]);
