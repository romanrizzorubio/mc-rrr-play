import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TARGET_INITIAL_PLAYER,
    TRAIT_MASTERS_OF_EVIL,
} from 'mc-shared';
import {Deck} from '../../src/model/match/deck.js';
import {DiscardUntilEffect} from '../../src/effects/discard-until-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';

test('DiscardUntilEffect discards through a matching card and returns it for the next effect', async () => {
    const discardedMinion = {
        isMinion: true,
        traits: ['hydra'],
    };
    const mastersOfEvilMinion = {
        isMinion: true,
        traits: [TRAIT_MASTERS_OF_EVIL],
    };
    const remainingCard = {
        isMinion: false,
        traits: [],
    };
    const deck = new Deck({owner: {match: {}}});
    deck.cards = [discardedMinion, mastersOfEvilMinion, remainingCard];

    const effect = new DiscardUntilEffect({
        condition: {
            isMinion: true,
            traits: [TRAIT_MASTERS_OF_EVIL],
        },
        match: {},
        selectedTarget: deck,
    });
    const params = {};

    await effect.execute(params);

    assert.equal(params.selectedCard, mastersOfEvilMinion);
    assert.deepEqual(deck.discardPile, [discardedMinion, mastersOfEvilMinion]);
    assert.deepEqual(deck.cards, [remainingCard]);
});

test('EngageEffect assigns a minion to the player it engages', async () => {
    const resolvingPlayer = {};
    const engagedMinions = [];
    const initialPlayer = {
        async refresh() {},
        engage(card) {
            engagedMinions.push(card);
        },
    };
    const minion = {
        isMinion: true,
        isInPlay: false,
        isPlayerCard: false,
        async initTriggers() {},
        owner: undefined,
    };
    const deck = {
        discardPile: [minion],
        async refresh() {},
        searchDiscard(card) {
            this.discardPile.splice(this.discardPile.indexOf(card), 1);
        },
    };
    minion.owner = {deck};

    const effect = new EngageEffect({
        card: minion,
        match: {},
        target: TARGET_INITIAL_PLAYER,
    });
    effect.selectedTarget = initialPlayer;

    await effect.execute({player: resolvingPlayer});

    assert.equal(minion.controller, initialPlayer);
    assert.equal(minion.engaged, initialPlayer);
    assert.deepEqual(engagedMinions, [minion]);
});
