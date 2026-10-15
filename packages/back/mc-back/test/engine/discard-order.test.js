import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Engine} from '../../src/engine/engine.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

const createCard = id => ({
    id,
    toObj() {
        return {id: this.id};
    },
});

test('leftmost card ends on top of the discard pile and later order prompts are skipped', async () => {
    const match = {skipDiscardOrderDialog: false};
    const engine = new Engine();
    engine.match = match;
    let promptCount = 0;
    engine.openDialog = async () => {
        promptCount++;
        return {
            selected: [
                {id: 'second'},
                {id: 'first'},
                {id: 'third'},
            ],
            skipDiscardOrderDialog: true,
        };
    };
    const cards = ['first', 'second', 'third'].map(createCard);

    const orderedCards = await engine.selectDiscardOrder(cards);
    const laterOrderedCards = await engine.selectDiscardOrder(cards);
    const discardPile = [];
    for (const card of orderedCards) {
        discardPile.push(card);
    }

    assert.deepEqual(orderedCards.map(({id}) => id), [
        'third',
        'first',
        'second',
    ]);
    assert.equal(discardPile.at(-1).id, 'second');
    assert.deepEqual(laterOrderedCards.map(({id}) => id), [
        'first',
        'second',
        'third',
    ]);
    assert.equal(match.skipDiscardOrderDialog, true);
    assert.equal(promptCount, 1);
});

test('new matches start with discard order prompts enabled and persist the setting', () => {
    const match = new Match({mc: {}, name: 'new-match'});

    assert.equal(match.skipDiscardOrderDialog, false);

    match.skipDiscardOrderDialog = true;
    const snapshot = serializeMatch(match);
    const matchNode = snapshot.nodes.find(({type}) => type === 'Match');
    const properties = Object.fromEntries(matchNode.properties);
    const restoredMatch = restoreMatch(snapshot, {});

    assert.equal(properties.skipDiscardOrderDialog, true);
    assert.equal(restoredMatch.skipDiscardOrderDialog, true);
});

test('rejects incomplete or duplicated discard-order selections', async () => {
    const engine = new Engine();
    engine.match = {skipDiscardOrderDialog: false};
    engine.openDialog = async () => ({
        selected: [{id: 'first'}, {id: 'first'}],
    });

    await assert.rejects(
        engine.selectDiscardOrder([
            createCard('first'),
            createCard('second'),
        ]),
        /selección del orden de descarte no es válida/i
    );
});

test('persists known deck cards as references to cards in that deck', () => {
    const match = new Match({mc: {}, name: 'known-deck'});
    const deck = new Deck({owner: {name: 'Scenario'}});
    const knownCard = {id: 'known-card'};
    deck.cards = [knownCard];
    deck.markKnown([knownCard]);
    match.scenario = {deck};

    const restoredMatch = restoreMatch(serializeMatch(match), {});
    const restoredDeck = restoredMatch.scenario.deck;

    assert.equal(restoredDeck.knownCards[0], restoredDeck.cards[0]);
});
