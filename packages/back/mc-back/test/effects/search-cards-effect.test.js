import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TRAIT_MASTERS_OF_EVIL,
} from 'mc-shared';
import {SearchCardsEffect} from '../../src/effects/search-cards-effect.js';

const createCard = (id, name) => ({
    id,
    name,
    toObj() {
        return {id: this.id, name: this.name};
    },
});

test('SearchCardsEffect shows all copies but returns only one card per name', async () => {
    const cards = [
        createCard('first-copy', 'First card'),
        createCard('second-copy', 'First card'),
        createCard('third-card', 'Second card'),
    ];
    const player = {
        deck: {discardPile: cards},
        hand: {cards: []},
    };
    const effect = new SearchCardsEffect({
        count: 3,
        distinctNames: true,
        locations: [PLACE_DISCARD_PILE],
    });
    let dialog;
    effect.openDialog = async (options) => {
        dialog = options;
        return {
            selected: [
                {id: options.data.cards[0].id},
                {id: options.data.cards[1].id},
                {id: options.data.cards[2].id},
            ],
        };
    };
    const params = {player};

    await effect.execute(params);

    assert.equal(dialog.data.distinctNames, true);
    assert.deepEqual(dialog.data.cards.map(({name}) => name), [
        'First card',
        'First card',
        'Second card',
    ]);
    assert.deepEqual(params.selectedCards.map(({id}) => id), [
        'first-copy',
        'third-card',
    ]);
});

test('SearchCardsEffect searches the encounter deck and discard pile in order', async () => {
    const deckCard = createCard('deck-card', 'Madame Hydra');
    const discardedCard = createCard('discard-card', 'Madame Hydra');
    const encounterDeck = {
        cards: [deckCard],
        discardPile: [discardedCard],
    };
    const player = {
        deck: {cards: [], discardPile: []},
        hand: {cards: []},
    };
    const effect = new SearchCardsEffect({
        firstMatch: true,
        locations: [PLACE_ENCOUNTER_DECK_CARDS, PLACE_ENCOUNTER_DISCARD],
        reverseLocations: [PLACE_ENCOUNTER_DISCARD],
        filter: {name: 'Madame Hydra'},
        match: {scenario: {deck: encounterDeck}},
        requireMatch: true,
    });
    const params = {player};

    assert.equal(await effect.canRun(params), true);
    await effect.execute(params);
    assert.equal(params.selectedCard, deckCard);

    encounterDeck.cards = [];
    encounterDeck.discardPile = [
        createCard('older-discard-card', 'Madame Hydra'),
        discardedCard,
    ];
    assert.deepEqual(await effect.getOptions(params), [discardedCard]);

    const effectWithDefaultOrder = new SearchCardsEffect({
        firstMatch: true,
        locations: [PLACE_ENCOUNTER_DISCARD],
        filter: {name: 'Madame Hydra'},
        match: effect.match,
    });
    assert.deepEqual(await effectWithDefaultOrder.getOptions(params), [
        encounterDeck.discardPile[0],
    ]);
});

test('SearchCardsEffect offers every matching encounter minion for selection', async () => {
    const createMastersMinion = id => ({
        ...createCard(id, id),
        isMinion: true,
        traits: [TRAIT_MASTERS_OF_EVIL],
    });
    const deckMinion = createMastersMinion('deck-minion');
    const discardedMinion = createMastersMinion('discard-minion');
    const otherMinion = {
        ...createCard('other-minion', 'Other minion'),
        isMinion: true,
        traits: [],
    };
    const effect = new SearchCardsEffect({
        locations: [PLACE_ENCOUNTER_DECK_CARDS, PLACE_ENCOUNTER_DISCARD],
        filter: {
            isMinion: true,
            traits: [TRAIT_MASTERS_OF_EVIL],
        },
        match: {
            scenario: {
                deck: {
                    cards: [deckMinion, otherMinion],
                    discardPile: [discardedMinion],
                },
            },
        },
    });
    const player = {hand: {cards: []}};
    let dialog;
    effect.openDialog = async options => {
        dialog = options;

        return {selected: [{id: discardedMinion.id}]};
    };
    const params = {player};

    await effect.execute(params);

    assert.deepEqual(dialog.data.cards.map(({id}) => id), [
        deckMinion.id,
        discardedMinion.id,
    ]);
    assert.equal(params.selectedCard, discardedMinion);
});
