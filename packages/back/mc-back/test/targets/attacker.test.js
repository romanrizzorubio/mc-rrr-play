import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ATTACKER} from 'mc-shared';
import {targetMap} from '../../src/targets/index.js';

test('TARGET_ATTACKER resolves the character that initiated the current attack', () => {
    const attacker = {id: 'rhino'};

    assert.deepEqual(
        targetMap[TARGET_ATTACKER]({attack: {character: attacker}}),
        [attacker],
    );
    assert.deepEqual(
        targetMap[TARGET_ATTACKER]({}),
        [],
    );
});
