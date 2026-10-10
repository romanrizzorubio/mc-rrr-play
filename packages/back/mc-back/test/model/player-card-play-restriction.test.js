import assert from 'node:assert/strict';
import test from 'node:test';

import {TRAIT_AVENGER} from 'mc-shared';
import basicUpgrades from '../../../mc-data/seed/catalog/aspects/basic/upgrades.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';

test('Honorary Avenger requires its trait on the current identity side', () => {
    const honoraryAvenger = basicUpgrades.find(card =>
        card._id === 'basic-honorary-avenger');
    assert.ok(honoraryAvenger);

    const card = new PlayerCard({
        paramsToPlay: honoraryAvenger.card.params.paramsToPlay,
    });
    const currentSide = {
        traits: [],
    };
    const superhero = {
        currentSide,
        otherSide: {
            traits: [TRAIT_AVENGER],
        },
        get traits() {
            return this.currentSide.traits;
        },
    };
    const player = {
        superhero,
        get traits() {
            return this.superhero.traits;
        },
    };

    assert.equal(card.canPlay({player}), false);

    currentSide.traits.push(TRAIT_AVENGER);
    assert.equal(card.canPlay({player}), true);
});
