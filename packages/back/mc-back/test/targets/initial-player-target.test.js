import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_INITIAL_PLAYER} from 'mc-shared';
import {targetMap} from '../../src/targets/index.js';

test('TARGET_INITIAL_PLAYER resolves to the match initial player', () => {
    const initialPlayer = {id: 'initial-player'};

    assert.deepEqual(
        targetMap[TARGET_INITIAL_PLAYER]({match: {initialPlayer}}),
        [initialPlayer],
    );
    assert.deepEqual(
        targetMap[TARGET_INITIAL_PLAYER]({match: {}}),
        [],
    );
});
