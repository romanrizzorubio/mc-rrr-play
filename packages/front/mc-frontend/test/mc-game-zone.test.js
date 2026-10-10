import assert from 'node:assert/strict';
import {test} from 'node:test';

import {getUpgradesForDisplay} from '../src/utils/game-zone.js';

test('includes superhero-attached upgrades with other player upgrades', () => {
    const regularUpgrade = {
        id: 'regular-upgrade',
        isUpgrade: true,
        isAttached: false,
    };
    const superheroUpgrade = {
        id: 'superhero-upgrade',
        isUpgrade: true,
        isAttached: true,
    };
    const attachedSupport = {
        id: 'attached-support',
        isUpgrade: false,
        isAttached: true,
    };

    assert.deepEqual(
        getUpgradesForDisplay(
            [regularUpgrade, superheroUpgrade],
            [superheroUpgrade, attachedSupport]
        ),
        [regularUpgrade, superheroUpgrade]
    );
});
