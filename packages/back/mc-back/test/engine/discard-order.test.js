import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Engine} from '../../src/engine/engine.js';
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

test('discard order preference applies to the remaining and later cards', async () => {
    const match = {skipDiscardOrderDialog: false};
    const engine = new Engine();
    engine.match = match;
    let promptCount = 0;
    engine.openDialog = async () => {
        promptCount++;
        return {
            selected: {id: 'second'},
            skipDiscardOrderDialog: true,
        };
    };
    const cards = ['first', 'second', 'third'].map(createCard);

    const orderedCards = await engine.selectDiscardOrder(cards);
    const laterOrderedCards = await engine.selectDiscardOrder(cards);

    assert.deepEqual(orderedCards.map(({id}) => id), [
        'second',
        'first',
        'third',
    ]);
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
