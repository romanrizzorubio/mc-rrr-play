import {
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
    PLACE_TUCKED,
} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';

const placeCards = {
    [PLACE_DECK]: player => player.deck?.cards,
    [PLACE_DISCARD_PILE]: player => player.deck?.discardPile,
    [PLACE_HAND]: player => player.hand?.cards,
};

const getTuckedCardHosts = player => [...new Set([
    player?.superhero,
    ...(player?.superhero?.heroCards || []),
    ...(player?.superhero?.getAttachedCards?.() || []),
    ...(player?.gameZone?.cards || []),
].filter(host => Array.isArray(host?.tuckedCards)))];

export const getPlayerCardPlayFromCards = (place, player) => {
    if (place === PLACE_TUCKED) {
        return getTuckedCardHosts(player)
            .flatMap(host => host.tuckedCards);
    }

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

export const canPlayFromLocation = (card, playFrom, source) => {
    if (playFrom?.includes(source.place)) {
        return true;
    }
    if (source.place !== PLACE_TUCKED) {
        return false;
    }

    const condition = source.host?.card?.playTuckedCardsCondition;

    return Boolean(condition && checkCondition(card, condition));
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

    for (const host of getTuckedCardHosts(player)) {
        const index = host.tuckedCards.indexOf(card);
        if (index > -1) {
            return {
                place: PLACE_TUCKED,
                cards: host.tuckedCards,
                index,
                player,
                host,
            };
        }
    }
};

export const getPlayerCardPlayFromLocation = (card, playFrom, player) => {
    const source = getPlayerCardLocation(card, player);

    return source && canPlayFromLocation(card, playFrom, source) ?
        source :
        undefined;
};

export const findPlayerCardToPlayFrom = (player, cardId) => {
    for (const place of [...Object.keys(placeCards), PLACE_TUCKED]) {
        for (const card of getPlayerCardPlayFromCards(place, player)) {
            const source = getPlayerCardLocation(card, player);
            if (card.id === cardId &&
                source?.place === place &&
                canPlayFromLocation(card, card.card.playFrom, source)) {
                return card;
            }
        }
    }
};
