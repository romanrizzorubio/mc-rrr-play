import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_TARGET,
    TARGET_ALL_DECKS,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SUPPORTS,
    TARGET_ANY_DECK,
    TARGET_SUPPORT_YOU_CONTROL,
} from 'mc-shared';
import {DealEncounterEffect} from '../../src/effects/deal-encounter-effect.js';
import {DiscardFromGameEffect} from '../../src/effects/discard-from-game-effect.js';
import {LookAtTopCardsEffect} from '../../src/effects/look-at-top-cards-effect.js';
import {ShuffleDeckEffect} from '../../src/effects/shuffle-deck-effect.js';

describe('ALL and ANY concrete effect resolution', () => {
    const createGame = () => {
        const actor = {id: 'actor'};
        const decks = ['scenario', 'first', 'excluded', 'last'].map(id => ({
            id,
            eligible: id !== 'excluded',
            isPlayerDeck: id !== 'scenario',
            isScenarioDeck: id === 'scenario',
            shuffled: 0,
            knownCards: [],
            cards: [
                {id: `${id}-top`, toObj() { return {id: this.id}; }},
                {id: `${id}-second`, toObj() { return {id: this.id}; }},
            ],
            markKnown(cards) { this.knownCards.push(...cards); },
            async refresh() {},
            shuffle() { this.shuffled++; },
            toObj() { return {id: this.id}; },
        }));
        const players = decks.slice(1).map(deck => ({
            id: deck.id,
            eligible: deck.eligible,
            deck,
            gameZone: {
                encounterCards: [],
                dealEncounterCard(cards) { this.encounterCards.push(...cards); },
                async refresh() {},
            },
        }));
        const supports = players.map(player => ({
            id: `${player.id}-support`,
            eligible: player.eligible,
            controller: player,
            discarded: false,
            async discard() { this.discarded = true; },
            toObj() { return {id: this.id}; },
        }));
        actor.supports = supports;
        const dialogs = [];
        let encounters = 0;
        const match = {
            name: 'concrete-target-resolution',
            triggerCards: {},
            players,
            scenario: {deck: decks[0]},
            searchCards: () => supports,
            async drawEncounterCards(count) {
                return Array.from({length: count}, () => ({id: `encounter-${encounters++}`}));
            },
            async openDialog(dialog) {
                dialogs.push(dialog);
                return dialog.dialogType === DIALOG_SELECT_TARGET ?
                    {selected: dialog.data.cards.at(-1)} : {};
            },
        };
        return {actor, decks, dialogs, match, players, supports};
    };

    test('looking at ALL decks looks at every eligible top card without choosing a deck', async () => {
        const {actor, decks, dialogs, match} = createGame();
        const effect = new LookAtTopCardsEffect({
            match, target: TARGET_ALL_DECKS, condition: {eligible: true},
        });
        assert.equal(await effect.canRun({player: actor}), true);
        await effect.runEffect({match, player: actor});
        assert.deepEqual(effect.cards.map(card => card.id),
            ['scenario-top', 'first-top', 'last-top']);
        assert.deepEqual(decks.map(deck => deck.knownCards.map(card => card.id)),
            [['scenario-top'], ['first-top'], [], ['last-top']]);
        assert.deepEqual(decks.map(deck => deck.cards.length), [2, 2, 2, 2]);
        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_REVEAL_CARDS);
        assert.deepEqual(dialogs[0].data.cards.map(card => card.id),
            ['scenario-top', 'first-top', 'last-top']);
    });

    test('looking at ANY deck selects from the same filtered pool but shows only that deck', async () => {
        const {actor, decks, dialogs, match} = createGame();
        const effect = new LookAtTopCardsEffect({
            match, target: TARGET_ANY_DECK, condition: {eligible: true},
        });
        await effect.runEffect({match, player: actor});
        assert.equal(dialogs.length, 2);
        assert.equal(dialogs[0].dialogType, DIALOG_SELECT_TARGET);
        assert.equal(dialogs[0].targetPlayer, actor.id);
        assert.deepEqual(dialogs[0].data.cards.map(deck => deck.id),
            ['scenario', 'first', 'last']);
        assert.equal(dialogs[1].dialogType, DIALOG_REVEAL_CARDS);
        assert.deepEqual(effect.cards.map(card => card.id), ['last-top']);
        assert.deepEqual(decks.map(deck => deck.knownCards.length), [0, 0, 0, 1]);
    });

    test('a top-card look filters empty decks without removing them from the general ALL pool', async () => {
        const {actor, decks, dialogs, match} = createGame();
        decks.forEach(deck => { deck.cards = []; });
        const effect = new LookAtTopCardsEffect({match, target: TARGET_ALL_DECKS});
        assert.ok(!await effect.canRun({player: actor}));
        await effect.runEffect({match, player: actor});
        assert.deepEqual(effect.cards, []);
        assert.deepEqual(dialogs, []);
    });

    test('deck eligibility rejects targets without a card collection', async () => {
        const {actor, decks, match} = createGame();
        delete decks[0].cards;
        const effect = new LookAtTopCardsEffect({match, target: TARGET_ALL_DECKS});
        assert.deepEqual(effect.getValidTarget({player: actor}).map(deck => deck.id),
            ['first', 'excluded', 'last']);
    });

    test('shuffling ALL decks also reaches empty decks and skips condition-excluded decks', async () => {
        const {actor, decks, dialogs, match} = createGame();
        decks[1].cards = [];
        const effect = new ShuffleDeckEffect({
            match, target: TARGET_ALL_DECKS, condition: {eligible: true},
        });
        await effect.runEffect({match, player: actor});
        assert.deepEqual(decks.map(deck => deck.shuffled), [1, 1, 0, 1]);
        assert.deepEqual(dialogs, []);
    });

    test('shuffling ANY deck touches only the selected deck', async () => {
        const {actor, decks, dialogs, match} = createGame();
        const effect = new ShuffleDeckEffect({
            match, target: TARGET_ANY_DECK, condition: {eligible: true},
        });
        await effect.runEffect({match, player: actor});
        assert.deepEqual(decks.map(deck => deck.shuffled), [0, 0, 0, 1]);
        assert.equal(dialogs.length, 1);
    });

    test('discarding ALL supports leaves permanents from other sets in play', async () => {
        const {actor, dialogs, match, supports} = createGame();
        supports[0].permanent = true;
        supports[0].set = 'ship-command';
        const effect = new DiscardFromGameEffect({
            match,
            target: TARGET_ALL_SUPPORTS,
            condition: {eligible: true},
            ability: {card: {set: 'kang'}},
        });
        await effect.runEffect({match, player: actor});
        assert.deepEqual(supports.map(support => support.discarded), [false, false, true]);
        assert.deepEqual(dialogs, []);
    });

    test('discarding one controlled support skips permanents from other sets', async () => {
        const {actor, dialogs, match, supports} = createGame();
        supports[0].permanent = true;
        supports[0].set = 'ship-command';
        const effect = new DiscardFromGameEffect({
            match,
            target: TARGET_SUPPORT_YOU_CONTROL,
            condition: {eligible: true},
            ability: {card: {set: 'kang'}},
        });
        await effect.runEffect({match, player: actor});
        assert.deepEqual(supports.map(support => support.discarded), [false, false, true]);
        assert.deepEqual(dialogs, []);
    });

    test('rejects a preselected permanent support when the discard source is from another set', async () => {
        const {actor, match, supports} = createGame();
        supports[0].permanent = true;
        supports[0].set = 'ship-command';
        const effect = new DiscardFromGameEffect({
            match,
            target: TARGET_SUPPORT_YOU_CONTROL,
            selectedTarget: supports[0],
            ability: {card: {set: 'kang'}},
        });

        assert.deepEqual(effect.getValidTarget({match, player: actor}), []);
        assert.equal(Boolean(await effect.canRun({match, player: actor})), false);
        assert.equal(supports[0].discarded, false);
    });

    test('allows a discard ability from the permanent support set to target it', async () => {
        const {actor, dialogs, match, supports} = createGame();
        supports[0].permanent = true;
        supports[0].set = 'ship-command';
        supports[2].eligible = false;
        const effect = new DiscardFromGameEffect({
            match,
            target: TARGET_SUPPORT_YOU_CONTROL,
            selectedTarget: supports[0],
            ability: {card: {set: 'ship-command'}},
        });

        assert.equal(await effect.canRun({match, player: actor}), true);
        await effect.runEffect({match, player: actor});

        assert.equal(supports[0].discarded, true);
        assert.deepEqual(dialogs, []);
    });

    test('dealing encounters to ALL players distributes separate cards to each eligible player', async () => {
        const {actor, dialogs, match, players} = createGame();
        const effect = new DealEncounterEffect({
            match, target: TARGET_ALL_PLAYERS, count: 2, condition: {eligible: true},
        });
        await effect.runEffect({match, player: actor});
        assert.deepEqual(players.map(player =>
            player.gameZone.encounterCards.map(card => card.id)),
        [['encounter-0', 'encounter-1'], [], ['encounter-2', 'encounter-3']]);
        assert.deepEqual(dialogs, []);
    });
});
