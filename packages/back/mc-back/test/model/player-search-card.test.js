import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Player} from '../../src/model/match/player.js';

test('Player.searchCard finds minions engaged with that player', () => {
    const madameHydra = {name: 'Madame Hydra'};
    const player = Object.create(Player.prototype);
    player.superhero = {};
    player.gameZone = {
        minions: [madameHydra],
        searchCard: () => undefined,
    };
    player.hand = {cards: []};

    assert.equal(player.searchCard({name: 'Madame Hydra'}), madameHydra);
});
