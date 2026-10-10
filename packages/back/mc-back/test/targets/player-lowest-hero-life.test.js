import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_PLAYER_LOWEST_HERO_LIFE} from 'mc-shared';
import {targetMap} from '../../src/targets/index.js';

const resolve = players =>
    targetMap[TARGET_PLAYER_LOWEST_HERO_LIFE]({match: {players}});

test('selects the hero-form players whose superheroes have the least life', () => {
    const players = [
        {isHero: true, name: 'First', superhero: {life: 8}},
        {isHero: false, name: 'Alter ego', superhero: {life: 1}},
        {isHero: true, name: 'Second', superhero: {life: 4}},
        {isHero: true, name: 'Third', superhero: {life: 4}},
    ];

    assert.deepEqual(resolve(players), [players[2], players[3]]);
});

test('returns no target when no player is in hero form', () => {
    assert.deepEqual(resolve([
        {isHero: false, superhero: {life: 1}},
    ]), []);
});
