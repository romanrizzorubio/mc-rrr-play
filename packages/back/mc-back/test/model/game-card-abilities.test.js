import assert from 'node:assert/strict';
import {test} from 'node:test';

import {GameCard} from '../../src/model/cards/game-card.js';

test('binds a boost ability to its game card', () => {
    const ability = {};
    const boostAbility = {};
    const gameCard = new GameCard({
        card: {id: 'boost-card'},
        abilities: [ability],
        boostAbility,
    });

    assert.equal(ability.card, gameCard);
    assert.equal(boostAbility.card, gameCard);
});
