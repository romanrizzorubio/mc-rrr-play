import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PLACE_DECK,
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
    const encounterDeck = {
        cards: [deckMinion, otherMinion],
        discardPile: [discardedMinion],
        knownCards: [],
        markKnown(cards) {
            this.knownCards.push(...cards);
        },
        async refresh() {},
    };
    const effect = new SearchCardsEffect({
        locations: [PLACE_ENCOUNTER_DECK_CARDS, PLACE_ENCOUNTER_DISCARD],
        filter: {
            isMinion: true,
            traits: [TRAIT_MASTERS_OF_EVIL],
        },
        match: {
            scenario: {
                deck: encounterDeck,
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
    assert.deepEqual(encounterDeck.knownCards, [deckMinion]);
    assert.equal(params.selectedCard, discardedMinion);
});

test('SearchCardsEffect automatically selects its only mandatory match', async () => {
    const card = createCard('mjolnir', 'Mjolnir');
    let dialogCalls = 0;
    const effect = new SearchCardsEffect({
        locations: [PLACE_DECK, PLACE_DISCARD_PILE],
        filter: {name: 'Mjolnir'},
        requireMatch: true,
        match: {
            async openDialog() {
                dialogCalls++;
            },
        },
    });
    const player = {
        deck: {cards: [], discardPile: [card]},
        hand: {cards: []},
    };
    const params = {player};

    await effect.execute(params);

    assert.equal(dialogCalls, 0);
    assert.deepEqual(params.selectedCards, [card]);
    assert.equal(params.selectedCard, card);
    assert.equal(params.card, card);
});

test('SearchCardsEffect automatically selects its only mandatory payment match', async () => {
    const card = createCard('mjolnir', 'Mjolnir');
    let dialogCalls = 0;
    const effect = new SearchCardsEffect({
        locations: [PLACE_DISCARD_PILE],
        filter: {name: 'Mjolnir'},
        match: {
            async openDialog() {
                dialogCalls++;
            },
        },
    });
    const player = {
        deck: {discardPile: [card]},
        hand: {cards: []},
    };
    const params = {player};
    const session = {
        getExcludedCardIds: () => new Set(),
    };

    const payment = await effect.preparePayment(params, session);

    assert.equal(dialogCalls, 0);
    assert.deepEqual(payment.cards, [card]);
    assert.deepEqual(params.selectedCards, [card]);
});

for (const [choice, optionalSelection] of [
    ['cancelling', {showCancel: true}],
    ['selecting up to the limit', {upTo: true}],
]) {
    test(`SearchCardsEffect keeps a dialog for ${choice} with one match`, async () => {
        const card = createCard('mjolnir', 'Mjolnir');
        let dialogCalls = 0;
        const effect = new SearchCardsEffect({
            locations: [PLACE_DISCARD_PILE],
            ...optionalSelection,
            match: {
                async openDialog() {
                    dialogCalls++;

                    return {selected: []};
                },
            },
        });

        await effect.execute({
            player: {
                deck: {discardPile: [card]},
                hand: {cards: []},
            },
        });

        assert.equal(dialogCalls, 1);
    });
}
