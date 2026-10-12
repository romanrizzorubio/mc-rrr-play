import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Player} from '../../src/model/match/player.js';

test('Player resolves abilities on minions engaged with that player', async () => {
    let resolvedParams;
    const robot = {
        id: 'robot_gigante_de_edison--ms._marvel-29',
        async resolveAbility(params) {
            resolvedParams = params;
        },
    };
    const player = Object.create(Player.prototype);
    player.superhero = {
        id: 'hero',
        currentSide: {id: 'hero-side'},
    };
    player.gameZone = {
        getCard() {
            return undefined;
        },
        minions: [robot],
    };

    await player.resolveAbility(robot.id, 1);

    assert.deepEqual(resolvedParams, {
        player,
        abilityIndex: 1,
    });
});
