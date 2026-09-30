import {
    TARGET_ENCOUNTER_DECK,
    TARGET_ENCOUNTER_DECK_CARDS,
    TARGET_ENCOUNTER_DISCARD,
    TARGET_ANY_PLAYER,
} from '../constants/targets.js';

export const deckAndDeckTargets = {
    [TARGET_ENCOUNTER_DECK]: ({match}) => [match.scenario.deck],
    [TARGET_ENCOUNTER_DECK_CARDS]: ({match}) => match.scenario.deck.cards,
    [TARGET_ENCOUNTER_DISCARD]: ({match}) => match.scenario.deck.discardPile,
    [TARGET_ANY_PLAYER]: ({match}) => match.players,
};
