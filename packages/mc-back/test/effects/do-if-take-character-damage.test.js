import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ATTACKED, TARGET_SOURCE} from 'mc-shared';

import {DoIfTakeCharacterDamageEffect} from '../../src/effects/do-if-take-character-damage-effect.js';
import {StunEffect} from '../../src/effects/stun-effect.js';

test('damage condition resolves its configured source before validating its target', async () => {
    const target = {
        isInPlay: true,
        isStunned: false,
        refresh() {},
        stun() {
            this.isStunned = true;
        },
    };
    const attack = {
        selectedTarget: target,
    };
    attack.activation = {
        effect: attack,
        takenDamage: 3,
    };
    const match = {
        triggerCards: {},
    };
    const effect = new DoIfTakeCharacterDamageEffect({
        effect: new StunEffect({
            match,
            target: TARGET_ATTACKED,
        }),
        match,
        source: 'effects.0',
        target: TARGET_SOURCE,
    });
    const params = {
        effects: [attack],
        match,
        player: {},
    };

    assert.equal(await effect.canRun(params), true);
    await effect.runEffect(params);

    assert.equal(target.isStunned, true);
});
