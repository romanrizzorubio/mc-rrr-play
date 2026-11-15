import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TARGET_ALL_UPGRADES_YOU_CONTROL,
    TRAIT_TECH,
} from 'mc-shared';
import {playerControlledTargets} from '../../src/targets/player-controlled.js';
import {ValidTarget} from '../../src/targets/valid-target.js';

describe('TARGET_ALL_UPGRADES_YOU_CONTROL', () => {
    test('resolves every controlled upgrade that matches its condition', async () => {
        const firstTechUpgrade = {
            id: 'tech-1',
            traits: [TRAIT_TECH],
        };
        const secondTechUpgrade = {
            id: 'tech-2',
            traits: [TRAIT_TECH],
        };
        const otherUpgrade = {
            id: 'other',
            traits: [],
        };
        const player = {
            upgrades: [firstTechUpgrade, otherUpgrade, secondTechUpgrade],
        };
        const condition = {traits: TRAIT_TECH};
        const validTarget = new ValidTarget({condition});
        const selected = await validTarget.selectTarget({
            condition,
            player,
            target: TARGET_ALL_UPGRADES_YOU_CONTROL,
        });

        assert.deepEqual(
            playerControlledTargets[TARGET_ALL_UPGRADES_YOU_CONTROL]({
                condition,
                player,
            }),
            [firstTechUpgrade, secondTechUpgrade],
        );
        assert.deepEqual(selected, [firstTechUpgrade, secondTechUpgrade]);
        assert.equal(
            validTarget.isMultipleTarget({
                target: TARGET_ALL_UPGRADES_YOU_CONTROL,
            }),
            true,
        );
    });
});
