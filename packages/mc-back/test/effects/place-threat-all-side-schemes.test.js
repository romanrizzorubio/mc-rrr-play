import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ALL_SIDE_SCHEMES} from 'mc-shared';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';

test('PlaceThreatEffect applies threat to every side scheme target', async () => {
    const sideSchemes = [0, 0].map(() => ({
        isSideScheme: true,
        threat: 0,
        placeThreat(count) {
            this.threat += count;
        },
        refresh() {},
    }));
    const player = {name: 'Player'};
    const match = {
        initialPlayer: player,
        players: [player],
        sideSchemes,
        triggerCards: {},
    };
    const effect = new PlaceThreatEffect({
        match,
        target: TARGET_ALL_SIDE_SCHEMES,
        threat: 1,
    });

    await effect.runEffect({player});

    assert.deepEqual(sideSchemes.map(({threat}) => threat), [1, 1]);
});
