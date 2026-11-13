import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_HERO, TARGET_YOUR_HERO} from 'mc-shared';
import {groupTargets} from '../../src/targets/groups.js';

describe('Hero target selectors', () => {
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
        assert.deepEqual(
            groupTargets[TARGET_YOUR_HERO]({player: alterEgoPlayer}),
            [],
        );
    });
});
