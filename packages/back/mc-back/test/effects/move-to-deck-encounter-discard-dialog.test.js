import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DECK_POSITION_SHUFFLE,
    DIALOG_REVEAL_CARDS,
    TARGET_ENCOUNTER_DECK,
    TARGET_YOU,
} from 'mc-shared';

import {MoveToDeckEffect} from '../../src/effects/move-to-deck-effect.js';

describe('MoveToDeckEffect encounter discard dialogs', () => {
    test('shows a public dialog with matching encounter discard cards', async () => {
        const player = {name: 'Thor'};
        const returnedCard = {
            id: 'temporal',
            isInPlay: false,
            traits: ['temporal'],
            toObj() {
                return {id: this.id, name: 'Apócrifus'};
            },
        };
        const otherDiscardCard = {
            id: 'non-temporal',
            isInPlay: false,
            traits: ['hydra'],
            toObj() {
                return {id: this.id, name: 'Soldado de Hydra'};
            },
        };
        const deck = {
            isScenarioDeck: true,
            cards: [],
            discardPile: [returnedCard, otherDiscardCard],
            addToDeck(cards) {
                this.cards.push(...cards);
            },
            searchDiscard(card) {
                this.discardPile.splice(this.discardPile.indexOf(card), 1);
            },
            shuffleCount: 0,
            shuffle() {
                this.shuffleCount++;
            },
            async refresh() {},
        };
        const dialogs = [];
        const match = {
            name: 'move-to-deck-encounter-discard-test',
            initialPlayer: player,
            scenario: {deck},
            async openDialog(dialog) {
                dialogs.push(dialog);
                assert.ok(deck.discardPile.includes(returnedCard));
                assert.equal(deck.cards.includes(returnedCard), false);
                return {};
            },
        };
        const effect = new MoveToDeckEffect({
            cards: 'match.scenario.deck.discardPile',
            cardCondition: {traits: 'temporal'},
            match,
            position: DECK_POSITION_SHUFFLE,
            target: TARGET_ENCOUNTER_DECK,
        });
        effect.selectedTarget = deck;

        await effect.execute({match, player});

        assert.equal(dialogs.length, 1);
        assert.deepEqual(
            {
                dialogType: dialogs[0].dialogType,
                showToAll: dialogs[0].showToAll,
                targetPlayer: dialogs[0].targetPlayer,
                title: dialogs[0].title,
                subtitle: dialogs[0].subtitle,
                cards: dialogs[0].data.cards,
                rotatePlanCards: dialogs[0].data.rotatePlanCards,
            },
            {
                dialogType: DIALOG_REVEAL_CARDS,
                showToAll: true,
                targetPlayer: player,
                title: 'Cartas que vuelven al mazo de Encuentros',
                subtitle: 'Estas cartas se devolverán al mazo de Encuentros.',
                cards: [{id: 'temporal', name: 'Apócrifus'}],
                rotatePlanCards: true,
            }
        );
        assert.deepEqual(deck.cards, [returnedCard]);
        assert.deepEqual(deck.discardPile, [otherDiscardCard]);
        assert.equal(deck.shuffleCount, 1);
    });

    test('does not show an encounter dialog for cards moved to a player deck', async () => {
        const player = {name: 'Thor'};
        const card = {
            id: 'player-card',
            isInPlay: false,
            toObj() {
                return {id: this.id};
            },
        };
        const deck = {
            owner: player,
            isScenarioDeck: false,
            cards: [],
            discardPile: [card],
            addToDeck(cards) {
                this.cards.push(...cards);
            },
            searchDiscard(selectedCard) {
                this.discardPile.splice(this.discardPile.indexOf(selectedCard), 1);
            },
            shuffle() {},
            async refresh() {},
        };
        let dialogCount = 0;
        const match = {
            name: 'move-to-player-deck-test',
            async openDialog() {
                dialogCount++;
                return {};
            },
        };
        const effect = new MoveToDeckEffect({
            cards: 'selectedCards',
            match,
            target: TARGET_YOU,
        });
        effect.selectedTarget = deck;

        await effect.execute({match, player, selectedCards: [card]});

        assert.equal(dialogCount, 0);
        assert.deepEqual(deck.cards, [card]);
        assert.deepEqual(deck.discardPile, []);
    });
});
