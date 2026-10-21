import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import styles from '../src/components/panels/mc-game-zone/mc-game-zone.css.js';
import {getUpgradesForDisplay} from '../src/utils/game-zone.js';

describe('game zone', () => {
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

    test('keeps a minimum-size drop area for playing cards', () => {
        assert.match(
            styles.cssText,
            /\.play-card-drop-zone\s*\{[^}]*min-width:\s*300px;[^}]*min-height:\s*200px;/s
        );
    });
});
