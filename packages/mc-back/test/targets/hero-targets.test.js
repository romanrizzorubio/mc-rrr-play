import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_HERO, TARGET_YOUR_HERO} from 'mc-shared';
import {Superhero} from '../../src/model/match/superhero.js';
import {groupTargets} from '../../src/targets/groups.js';

test('TARGET_HERO selects any hero while TARGET_YOUR_HERO selects only yours', () => {
    const firstHeroSide = {};
    const secondHeroSide = {};
    const firstPlayer = {
        isHero: true,
        superhero: {currentSide: firstHeroSide},
    };
    const secondPlayer = {
        isHero: true,
        superhero: {currentSide: secondHeroSide},
    };
    const alterEgoPlayer = {isHero: false};
    const match = {
        players: [firstPlayer, secondPlayer, alterEgoPlayer],
        get heroes() {
            return this.players.filter(player => player.isHero);
        },
    };

    assert.deepEqual(groupTargets[TARGET_HERO]({match}), [
        firstHeroSide,
        secondHeroSide,
    ]);
    assert.deepEqual(groupTargets[TARGET_YOUR_HERO]({player: firstPlayer}), [
        firstHeroSide,
    ]);
    assert.deepEqual(groupTargets[TARGET_YOUR_HERO]({player: alterEgoPlayer}), []);

    assert.equal(Superhero.targetsIdentity(TARGET_YOUR_HERO, true, false), true);
    assert.equal(Superhero.targetsIdentity(TARGET_YOUR_HERO, false, true), false);
});
