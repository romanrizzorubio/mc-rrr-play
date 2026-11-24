import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Player} from '../../src/model/match/player.js';

describe('Player ability resolution', () => {
    test('resolves abilities on minions engaged with that player', async () => {
        let resolvedParams;
        const robot = {
            id: 'robot_gigante_de_edison--ms._marvel-29',
            async resolveAbility(params) {
                resolvedParams = params;
            },
        };
        const player = Object.create(Player.prototype);
        const match = {};
        player.superhero = {
            id: 'hero',
            match,
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
            match,
            abilityIndex: 1,
        });
    });
});
