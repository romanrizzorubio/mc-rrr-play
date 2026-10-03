import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Attack} from '../../src/activations/attack.js';
import {RetaliateTrigger} from '../../src/triggers/retaliate-trigger.js';

test('does not offer retaliation for an enemy removed from play by the attack', async () => {
    const target = {
        card: {retaliate: 1},
        isInPlay: true,
        getLife: async () => 3,
    };
    const match = {enemies: [target]};
    const attack = new Attack({
        effect: {
            character: {},
            match,
            ranged: false,
        },
    });
    const trigger = new RetaliateTrigger(attack, target);

    assert.equal(await trigger.canTrigger(), true);

    match.enemies = [];

    assert.equal(await trigger.canTrigger(), false);
});
