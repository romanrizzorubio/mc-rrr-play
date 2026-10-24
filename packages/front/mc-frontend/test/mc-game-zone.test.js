import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import styles from '../src/components/panels/mc-game-zone/mc-game-zone.css.js';
import {getUpgradesForDisplay} from '../src/utils/game-zone.js';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McGameZone} = await import(
    '../src/components/panels/mc-game-zone/mc-game-zone.js'
);

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

    test('shows an assigned encounter count only when multiple cards are present', () => {
        const renderEncounters = encounters => Object.assign(
            Object.create(McGameZone.prototype),
            {
                encounters,
                dragActivation: null,
                dragPlayCard: null,
            }
        ).renderEncounters();

        const singleEncounter = renderEncounters(1);
        assert.ok(singleEncounter.strings.join('').includes('<mc-card-image'));
        assert.equal(
            singleEncounter.values.some(value =>
                value?.strings?.join('').includes('class="count"')
            ),
            false
        );

        const multipleEncounters = renderEncounters(2);
        const countLabel = multipleEncounters.values.find(value =>
            value?.strings?.join('').includes('class="count"')
        );
        assert.ok(countLabel);
        assert.equal(countLabel.values[0], 2);
    });
});
