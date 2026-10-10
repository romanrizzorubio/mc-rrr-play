import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRIGGER_VILLAIN_ATTACKS_YOU} from 'mc-shared';
import {ResponseAbility} from '../../src/abilities/response/response-ability.js';

test('ability conditions are checked against the triggering effect', async () => {
    const ability = new ResponseAbility({
        condition: {
            'effect.isDefended': true,
            'effect.defender.isHero': true,
        },
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
        effect: {canRun: async () => true},
        match: {},
    });
    const player = {canAttack: () => false};

    assert.equal(await ability.canRun({
        player,
        effect: {
            isDefended: true,
            defender: {isHero: true},
        },
    }), true);
    assert.equal(await ability.canRun({
        player,
        effect: {
            isDefended: false,
            defender: {isHero: true},
        },
    }), false);
});
