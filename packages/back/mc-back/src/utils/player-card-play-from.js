import {
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
} from 'mc-shared';

const placeCards = {
    [PLACE_DECK]: player => player.deck?.cards,
    [PLACE_DISCARD_PILE]: player => player.deck?.discardPile,
    [PLACE_HAND]: player => player.hand?.cards,
};

export const getPlayerCardPlayFromCards = (place, player) => {
    const getCards = placeCards[place];
    if (!getCards) {
        throw new Error(`Unsupported player card play-from place: ${place}.`);
    }

    if (!player) {
        throw new TypeError(`Cannot resolve player card play-from place: ${place}.`);
    }

    const cards = getCards(player);
    if (cards === undefined) {
        return [];
    }
    if (!Array.isArray(cards)) {
        throw new TypeError(`Cannot resolve player card play-from place: ${place}.`);
    }

    return cards;
};

export const getPlayerCardLocation = (card, player) => {
    if (!player) {
        return undefined;
    }

    for (const place of Object.keys(placeCards)) {
        const cards = getPlayerCardPlayFromCards(place, player);
        const index = cards.indexOf(card);

        if (index > -1) {
            return {place, cards, index, player};
        }
    }
};

export const getPlayerCardPlayFromLocation = (card, playFrom, player) => {
    const source = getPlayerCardLocation(card, player);

    return source && playFrom?.includes(source.place) ? source : undefined;
};

export const findPlayerCardToPlayFrom = (player, cardId) => {
    for (const place of Object.keys(placeCards)) {
        const card = getPlayerCardPlayFromCards(place, player).find(candidate =>
            candidate.id === cardId &&
            candidate.card.playFrom?.includes(place));

        if (card) {
            return card;
        }
    }
};
