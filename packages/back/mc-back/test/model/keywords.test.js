import assert from 'node:assert/strict';
import {test} from 'node:test';

import {AddKeywordEffect} from '../../src/effects/add-keyword-effect.js';
import {Keywords} from '../../src/model/commons/keywords.js';

test('numeric keyword values support per-player scaling consistently', () => {
    const match = {numPlayers: 3};
    const keywords = new Keywords({
        hint: [2, true],
        incite: [1, true],
        match,
        retaliate: [1, true],
        uses: [2, true],
    });

    assert.equal(keywords.hint, 6);
    assert.equal(keywords.incite, 3);
    assert.equal(keywords.retaliate, 3);
    assert.equal(keywords.uses, 6);

    match.numPlayers = 2;
    assert.equal(keywords.incite, 2);
    assert.equal(keywords.uses, 4);
});

test('numeric keyword values without per-player scaling remain unchanged', () => {
    const keywords = new Keywords({
        match: {numPlayers: 4},
        incite: [2, false],
        retaliate: 1,
        uses: 3,
    });

    assert.equal(keywords.incite, 2);
    assert.equal(keywords.retaliate, 1);
    assert.equal(keywords.uses, 3);
});

test('AddKeywordEffect resolves per-player values for numeric keyword modifiers', async () => {
    const match = {numPlayers: 3};
    const source = {isInPlay: true};
    const target = {
        isCard: true,
        async refresh() {},
        addKeywordModifier(_source, _ability, keyword) {
            this.modifiedKeywords = keyword;
        },
    };
    const ability = {card: source};
    const effect = new AddKeywordEffect({
        ability,
        keyword: {
            incite: [1, true],
            retaliate: [2, true],
        },
        match,
        selectedTarget: target,
    });

    await effect.execute({});

    assert.deepEqual(target.modifiedKeywords, {
        incite: 3,
        retaliate: 6,
    });
});

test('per-player numeric keywords require a valid match player count', () => {
    const keywords = new Keywords({uses: [2, true]});

    assert.throws(() => keywords.uses, /valid player count/);
});
