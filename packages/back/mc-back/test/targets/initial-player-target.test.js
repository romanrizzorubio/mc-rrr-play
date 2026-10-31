import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_INITIAL_PLAYER} from 'mc-shared';
import {targetMap} from '../../src/targets/index.js';

describe('TARGET_INITIAL_PLAYER', () => {
    test('resolves to the initial player in the acting player pool', () => {
        const initialPlayer = {id: 'initial-player'};
        const match = {
            initialPlayer,
            players: [initialPlayer],
        };

        assert.deepEqual(
            targetMap[TARGET_INITIAL_PLAYER]({
                match,
                player: initialPlayer,
            }),
            [initialPlayer],
        );
        assert.deepEqual(
            targetMap[TARGET_INITIAL_PLAYER]({
                match: {players: [initialPlayer]},
                player: initialPlayer,
            }),
            [],
        );
    });
});
