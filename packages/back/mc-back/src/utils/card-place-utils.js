import {
    PLACE_ASIDE_MATCH,
    PLACE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_OUTSIDE_NEMESIS,
} from 'mc-shared';

const removeCardFrom = (collection, card) => {
    const index = collection.indexOf(card);
    if (index > -1) {
        collection.splice(index, 1);
    }
};

export const SET_ASIDE_PLACES = new Set([
    PLACE_ASIDE_MATCH,
    PLACE_OUTSIDE_NEMESIS,
]);

export const removeFromPlace = new Map([
    [
        PLACE_ASIDE_MATCH,
        (effect, cards) => cards.forEach(card =>
            removeCardFrom(effect.match.scenario.apart, card)),
    ],
    [
        PLACE_DECK,
        (_effect, cards, player) => {
            cards.forEach(card => player.deck.removeCardFromDeck(card));

            return player.deck;
        },
    ],
    [
        PLACE_ENCOUNTER_DECK_CARDS,
        (effect, cards) => {
            cards.forEach(card =>
                effect.match.removeCardFromEncountersDeck(card));

            return effect.match.scenario.deck;
        },
    ],
    [
        PLACE_ENCOUNTER_DISCARD,
        (effect, cards) => {
            const deck = effect.match.scenario.deck;
            cards.forEach(card => deck.searchDiscard(card));

            return deck;
        },
    ],
    [
        PLACE_OUTSIDE_NEMESIS,
        (effect, cards, player) => cards.forEach(card => {
            removeCardFrom(player.superhero.nemesis, card);
            removeCardFrom(effect.match.scenario.apart, card);
        }),
    ],
]);
