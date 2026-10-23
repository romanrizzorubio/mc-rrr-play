import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    PLACE_HAND,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_IN_PLAY,
    TARGET_ALL_PLAYERS,
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

describe('SearchCardsEffect', () => {
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
    let shuffleCount = 0;
    const encounterDeck = {
        cards: [deckCard],
        discardPile: [discardedCard],
        shuffle() {
            shuffleCount++;
        },
        async refresh() {},
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
        match: {
            name: 'test-match',
            scenario: {deck: encounterDeck, name: 'test-scenario'},
        },
        requireMatch: true,
    });
    const params = {player};

    assert.equal(await effect.canRun(params), true);
    await effect.execute(params);
    assert.equal(params.selectedCard, deckCard);
    assert.equal(shuffleCount, 1);

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

test('SearchCardsEffect applies referential priority and keeps all highest-tier matches', async () => {
    const sourceCard = {
        ...createCard('source-mockingbird', 'Mockingbird'),
        set: 'Hawkeye',
        isEncounterCard: true,
    };
    const sameSetCard = {
        ...createCard('same-set-mockingbird', 'Mockingbird'),
        set: 'Hawkeye',
        isPlayerCard: true,
    };
    const secondSameSetCard = {
        ...createCard('second-same-set-mockingbird', 'Mockingbird'),
        set: 'Hawkeye',
        isPlayerCard: true,
    };
    const basicCard = {
        ...createCard('basic-mockingbird', 'Mockingbird'),
        set: 'basic',
        isPlayerCard: true,
    };
    const otherEncounterCard = {
        ...createCard('encounter-mockingbird', 'Mockingbird'),
        set: 'Standard',
        isEncounterCard: true,
    };
    const player = {
        superhero: {set: 'Hawkeye', isSuperhero: true},
        deck: {
            cards: [sameSetCard],
            discardPile: [secondSameSetCard],
        },
        hand: {cards: [basicCard]},
        gameZone: {cards: []},
    };
    const effect = new SearchCardsEffect({
        locations: [
            PLACE_HAND,
            PLACE_DECK,
            PLACE_DISCARD_PILE,
            PLACE_IN_PLAY,
            PLACE_ENCOUNTER_DISCARD,
            PLACE_ENCOUNTER_DECK_CARDS,
        ],
        filter: {name: 'Mockingbird'},
        match: {
            players: [],
            scenario: {
                deck: {
                    cards: [otherEncounterCard],
                    discardPile: [sourceCard],
                },
            },
        },
    });
    effect.match.players = [player];
    effect.ability = {card: sourceCard};

    assert.deepEqual(
        await effect.getOptions({player}),
        [sourceCard]
    );

    effect.match.scenario.deck.discardPile = [];
    assert.deepEqual(await effect.getOptions({player}), [
        sameSetCard,
        secondSameSetCard,
    ]);

    player.deck.cards = [];
    player.deck.discardPile = [];
    assert.deepEqual(await effect.getOptions({player}), [otherEncounterCard]);
    effect.ability = {
        card: {
            ...createCard('player-source', 'Player source'),
            set: 'Leadership',
            isPlayerCard: true,
            owner: player,
        },
    };
    player.deck.cards = [sameSetCard];
    assert.deepEqual(await effect.getOptions({player}), [sameSetCard]);

    player.deck.cards = [];
    assert.deepEqual(await effect.getOptions({player}), [basicCard]);

    player.gameZone.cards = [sourceCard];
    effect.ability = {card: sourceCard};
    effect.firstMatch = true;
    assert.deepEqual(await effect.getOptions({player}), [sourceCard]);

    player.deck.cards = [];
    player.gameZone.cards = [];
    effect.firstMatch = false;
    assert.deepEqual(await effect.getOptions({player}), [otherEncounterCard]);
});

test('SearchCardsEffect offers every matching encounter minion for selection', async () => {
    const createMastersMinion = id => ({
        ...createCard(id, id),
        isMinion: true,
        traits: [TRAIT_MASTERS_OF_EVIL],
    });
    const deckMinion = createMastersMinion('deck-minion');
    const discardedMinion = createMastersMinion('discard-minion');
    let shuffleCount = 0;
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
        shuffle() {
            shuffleCount++;
            this.knownCards = [];
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
            name: 'test-match',
            scenario: {
                deck: encounterDeck,
                name: 'test-scenario',
            },
        },
    });
    const player = {hand: {cards: []}};
    let dialog;
    effect.openDialog = async options => {
        dialog = options;
        assert.deepEqual(encounterDeck.knownCards, [deckMinion]);

        return {selected: [{id: discardedMinion.id}]};
    };
    const params = {player};

    await effect.execute(params);

    assert.deepEqual(dialog.data.cards.map(({id}) => id), [
        deckMinion.id,
        discardedMinion.id,
    ]);
    assert.deepEqual(encounterDeck.knownCards, []);
    assert.equal(shuffleCount, 1);
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
            name: 'test-match',
            async openDialog() {
                dialogCalls++;
            },
        },
    });
    let shuffleCount = 0;
    const player = {
        deck: {
            cards: [],
            discardPile: [card],
            shuffle() {
                shuffleCount++;
            },
            async refresh() {},
        },
        hand: {cards: []},
    };
    const params = {player};

    await effect.execute(params);

    assert.equal(dialogCalls, 0);
    assert.deepEqual(params.selectedCards, [card]);
    assert.equal(params.selectedCard, card);
    assert.equal(params.card, card);
    assert.equal(shuffleCount, 1);
});

test('SearchCardsEffect shuffles every player deck searched, even when there is no match', async () => {
    const shuffledPlayers = [];
    const players = ['one', 'two'].map(name => ({
        name,
        deck: {
            cards: [],
            shuffle() {
                shuffledPlayers.push(name);
            },
            async refresh() {},
        },
    }));
    const effect = new SearchCardsEffect({
        locations: [PLACE_DECK],
        players: TARGET_ALL_PLAYERS,
        match: {
            name: 'test-match',
            players,
        },
    });

    await effect.execute({player: players[0]});

    assert.deepEqual(shuffledPlayers, ['one', 'two']);
});

test('SearchCardsEffect does not shuffle when searching only a discard pile', async () => {
    let shuffleCount = 0;
    const card = createCard('discarded-card', 'Discarded card');
    const player = {
        deck: {
            cards: [],
            discardPile: [card],
            shuffle() {
                shuffleCount++;
            },
            async refresh() {},
        },
        hand: {cards: []},
    };
    const effect = new SearchCardsEffect({
        locations: [PLACE_DISCARD_PILE],
        match: {name: 'test-match'},
    });
    effect.openDialog = async () => ({selected: [{id: card.id}]});

    await effect.execute({player});

    assert.equal(shuffleCount, 0);
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
});
