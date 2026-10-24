import {
    PLACE_ENCOUNTER_DECK,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_PLAYER_ENCOUNTERS,
    PLACE_SCENARIO_EXTRA_DECK,
} from 'mc-shared';

export const ENCOUNTER_CARD_SOURCE_HANDLERS = new Map([
    [PLACE_PLAYER_ENCOUNTERS, {
        hasCard: (_effect, card, params) =>
            Boolean(params.player?.encounters?.includes(card)),
        canGet: (_effect, params) =>
            Boolean(params.player?.encounters?.length),
        take: (_effect, card, params) => {
            const encounters = params.player.encounters;
            encounters.splice(encounters.indexOf(card), 1);
        },
        get: (_effect, params) => {
            if (!params.player) {
                throw new Error('A player is required to get a dealt encounter card.');
            }

            return params.player.encounters.shift();
        },
    }],
    [PLACE_ENCOUNTER_DECK, {
        hasCard: (effect, card) =>
            effect.getEncounterDeck().cards.includes(card),
        canGet: effect => {
            const {cards, discardPile} = effect.getEncounterDeck();

            return Boolean(cards.length || discardPile.length);
        },
        take: async (effect, card) => {
            await effect.getEncounterDeck().searchDeck(card);
        },
        get: async effect => {
            const [card] = await effect.match.drawEncounterCards();

            return card;
        },
    }],
    [PLACE_ENCOUNTER_DISCARD, {
        hasCard: (effect, card) =>
            effect.getEncounterDeck().discardPile.includes(card),
        canGet: () => false,
        take: async (effect, card) => {
            const deck = effect.getEncounterDeck();
            deck.searchDiscard(card);
            await deck.refresh();
        },
        get: () => {
            throw new Error('A card source is required to get from the encounter discard.');
        },
    }],
    [PLACE_SCENARIO_EXTRA_DECK, {
        hasCard: (effect, card) =>
            effect.getExtraDeck().cards.includes(card),
        canGet: effect => {
            const deck = effect.getExtraDeck();

            return Boolean(
                deck.cards.length ||
                (deck.hasDiscard && deck.discardPile.length)
            );
        },
        take: async (effect, card) => {
            const deck = effect.getExtraDeck();
            deck.cards.splice(deck.cards.indexOf(card), 1);
            await deck.refresh();
        },
        get: async effect => {
            const deck = effect.getExtraDeck();
            const card = deck.hasDiscard ?
                (await deck.draw(1))[0] :
                deck.cards.shift();
            await deck.refresh();

            return card;
        },
    }],
]);
