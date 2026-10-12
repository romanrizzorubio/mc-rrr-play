import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_MINION,
    EFFECT_INCLUDE_ASIDE_CARDS,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SHUFFLE_DECK,
    PLACE_OUTSIDE_NEMESIS,
    TARGET_SCENARIO,
} from 'mc-shared';
import {IncludeAsideCardsEffect} from '../../src/effects/include-aside-cards-effect.js';
import {ShuffleDeckEffect} from '../../src/effects/shuffle-deck-effect.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';

test('every hero catalog designates at least one nemesis minion', async () => {
    const {heroes} = await loadCatalog();

    for (const hero of heroes) {
        const minions = hero.config.nemesis.filter(({card}) =>
            card.type === CARD_TYPE_MINION);
        const nemesisMinions = minions.filter(({card}) =>
            card.params.nemesis === true);

        assert.ok(minions.length, `${hero._id} has no minion in its nemesis set`);
        assert.ok(nemesisMinions.length, `${hero._id} has no nemesis minion`);
        if (minions.length === 1) {
            assert.equal(nemesisMinions.length, 1);
        }
    }
});

test('Ms. Marvel designates Thomas Edison, but not Edison\'s giant robot, as nemesis', async () => {
    const {heroes} = await loadCatalog();
    const msMarvel = heroes.find(({_id}) => _id === 'ms-marvel');
    const nemesisMinions = msMarvel.config.nemesis
        .filter(({card}) => card.type === CARD_TYPE_MINION &&
            card.params.nemesis === true)
        .map(({card}) => card.params.name);

    assert.deepEqual(nemesisMinions, ['Thomas Edison']);
});

test('Shadow of the Past reveals every marked minion and shuffles the remainder', () => {
    const shadowOfThePast = standard.config.cards
        .find(({card}) => card.params.name === 'Una sombra del pasado').card;
    const effects = shadowOfThePast.params.abilities[0].params.effect
        .params.effects;
    const nemesisMinionReveal = effects.find(({type, params}) =>
        type === EFFECT_SEARCH_CARD_REVEAL && params.condition?.isMinion);
    const includeAsideIndex = effects.findIndex(({type}) =>
        type === EFFECT_INCLUDE_ASIDE_CARDS);
    const shuffleEffect = effects[includeAsideIndex + 1];

    assert.equal(nemesisMinionReveal.params.condition.isNemesis, true);
    assert.equal(nemesisMinionReveal.params.revealAll, true);
    assert.equal(shuffleEffect.type, EFFECT_SHUFFLE_DECK);
    assert.equal(shuffleEffect.params.target, TARGET_SCENARIO);
});

test('remaining nemesis cards are added to and shuffled into the encounter deck', async () => {
    const unmarkedMinion = {name: 'Edison robot', nemesis: false};
    const remainingSideScheme = {name: 'Nemesis side scheme'};
    const remainingCards = [unmarkedMinion, remainingSideScheme];
    const deck = {
        cards: [],
        shuffleCount: 0,
        addToDeck(cards) {
            this.cards.push(...cards);
        },
        async refresh() {},
        shuffle() {
            this.shuffleCount++;
            this.cards.reverse();
        },
    };
    const scenario = {
        apart: [...remainingCards],
        deck,
        name: 'Test scenario',
    };
    const match = {
        name: 'nemesis-remainder-shuffle',
        scenario,
        triggerCards: {},
    };
    const player = {
        superhero: {nemesis: [...remainingCards]},
    };
    const includeRemaining = new IncludeAsideCardsEffect({
        cards: remainingCards,
        from: PLACE_OUTSIDE_NEMESIS,
        match,
        owner: scenario,
        selectedTarget: deck,
    });
    const shuffleEncounterDeck = new ShuffleDeckEffect({
        match,
        target: TARGET_SCENARIO,
    });

    await includeRemaining.execute({player});
    await shuffleEncounterDeck.runEffect({player});

    assert.deepEqual(player.superhero.nemesis, []);
    assert.deepEqual(scenario.apart, []);
    assert.deepEqual(deck.cards, [remainingSideScheme, unmarkedMinion]);
    assert.equal(deck.shuffleCount, 1);
});

test('cards moved from match set-aside are removed from that place', async () => {
    const card = {name: 'Set-aside nemesis card'};
    const scenario = {
        apart: [card],
        name: 'Test scenario',
    };
    const deck = {
        cards: [],
        addToDeck(cards) {
            this.cards.push(...cards);
        },
        async refresh() {},
    };
    const match = {
        name: 'aside-card-transfer',
        scenario,
        triggerCards: {},
    };
    const includeAsideCard = new IncludeAsideCardsEffect({
        cards: [card],
        match,
        owner: scenario,
        selectedTarget: deck,
    });

    await includeAsideCard.execute({player: {}});

    assert.deepEqual(scenario.apart, []);
    assert.deepEqual(deck.cards, [card]);
});
