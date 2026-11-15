import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TARGET_INITIAL_PLAYER,
    TARGET_INITIAL_PLAYER_SUPERHERO,
} from 'mc-shared';
import {targetMap} from '../../src/targets/index.js';

describe('initial player targets', () => {
    test('resolve globally in a scenario with separate play areas', () => {
        const initialPlayer = {
            id: 'initial-player',
            superhero: {id: 'initial-player-superhero'},
        };
        const actingPlayer = {
            id: 'acting-player',
            superhero: {id: 'acting-player-superhero'},
        };
        const match = {
            initialPlayer,
            players: [initialPlayer, actingPlayer],
            scenario: {
                separatePlayAreas: true,
                zones: [
                    {players: [initialPlayer]},
                    {players: [actingPlayer]},
                ],
            },
        };

        assert.deepEqual(
            targetMap[TARGET_INITIAL_PLAYER]({match, player: actingPlayer}),
            [initialPlayer],
        );
        assert.deepEqual(
            targetMap[TARGET_INITIAL_PLAYER_SUPERHERO]({
                match,
                player: actingPlayer,
            }),
            [initialPlayer.superhero],
        );
    });

    test('returns no candidate when there is no initial player', () => {
        assert.deepEqual(
            targetMap[TARGET_INITIAL_PLAYER]({match: {players: []}}),
            [],
        );
        assert.deepEqual(
            targetMap[TARGET_INITIAL_PLAYER_SUPERHERO]({match: {players: []}}),
            [],
        );
    });
});
