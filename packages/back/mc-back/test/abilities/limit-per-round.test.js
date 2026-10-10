import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ROUND} from 'mc-shared';

import {ActionAbility} from '../../src/abilities/actions/action-ability.js';
import {Effect} from '../../src/effects/effect.js';

test('a limit is per ability instance and resets at its target boundary', async () => {
    const match = {limits: {}, triggerCards: {}};
    const createAbility = (id, player) => {
        const effect = {
            resolved: false,
            async canRun() {
                return true;
            },
            async runEffect() {
                this.resolved = true;
            },
        };

        return new ActionAbility({
            card: {
                id,
                isEvent: true,
                name: 'Limited card',
                owner: player,
            },
            effect,
            limit: {
                count: 1,
                target: TARGET_ROUND,
            },
            match,
        });
    };
    const firstPlayer = {};
    const secondPlayer = {};
    const firstCopy = createAbility('first-copy', firstPlayer);
    const secondCopy = createAbility('second-copy', secondPlayer);

    assert.equal(await firstCopy.canRun({player: firstPlayer}), true);
    assert.equal(await secondCopy.canRun({player: secondPlayer}), true);

    await firstCopy.resolveAbility({player: firstPlayer});
    assert.equal(await firstCopy.canRun({player: firstPlayer}), false);
    assert.equal(await secondCopy.canRun({player: secondPlayer}), true);

    await secondCopy.resolveAbility({player: secondPlayer});
    assert.equal(await secondCopy.canRun({player: secondPlayer}), false);

    new Effect({match}).endLimit(TARGET_ROUND);

    assert.equal(await firstCopy.canRun({player: firstPlayer}), true);
    assert.equal(await secondCopy.canRun({player: secondPlayer}), true);
});
