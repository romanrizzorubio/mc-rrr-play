import {
    TARGET_ENCOUNTER_DECK,
    TARGET_ENCOUNTER_DECK_CARDS,
    TARGET_ENCOUNTER_DISCARD,
    TARGET_PLAYER_EXTRA_DECK,
    TARGET_PLAYER_EXTRA_DECK_DISCARD,
    TARGET_PLAYER_DISCARD,
    TARGET_ANY_PLAYER,
    TARGET_TOP_CARD,
} from 'mc-shared';

const getPlayerExtraDeck = ({player, effect, targetEffect}) => {
    const target = targetEffect || effect;
    const deckId = target?.deckId;
    if (!player || typeof deckId !== 'string') {
        return undefined;
    }

    return typeof player.getExtraDeck === 'function' ?
        player.getExtraDeck(deckId) :
        player.extraDecks?.[deckId];
};

export const deckAndDeckTargets = {
    [TARGET_ENCOUNTER_DECK]: ({match}) => [match.scenario.deck],
    [TARGET_ENCOUNTER_DECK_CARDS]: ({match}) => match.scenario.deck.cards,
    [TARGET_ENCOUNTER_DISCARD]: ({match}) => match.scenario.deck.discardPile,
    [TARGET_PLAYER_DISCARD]: ({player}) => {
        if (!player || !player.deck) {
            return [];
        }

        return player.deck.discardPile;
    },
    [TARGET_PLAYER_EXTRA_DECK]: params => {
        const deck = getPlayerExtraDeck(params);
        const target = params.targetEffect || params.effect;

        if (target?.position === TARGET_TOP_CARD) {
            return deck?.cards?.length ? [deck.cards[0]] : [];
        }

        return deck ? [deck] : [];
    },
    [TARGET_PLAYER_EXTRA_DECK_DISCARD]: params => {
        const deck = getPlayerExtraDeck(params);

        return deck?.discardPile || [];
    },
    [TARGET_ANY_PLAYER]: ({match}) => match.players,
};
