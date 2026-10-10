import assert from 'node:assert/strict';
import {test} from 'node:test';

import {AccelerateSchemeEffect} from '../../src/effects/accelerate-scheme-effect.js';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';

test('villain phase acceleration marks its threat placement', async () => {
    const match = {accelerationPlus: 2};
    const selectedTarget = {accelerationValue: 1};
    const player = {name: 'Player'};
    const originalRunEffect = PlaceThreatEffect.prototype.runEffect;
    let placedThreatEffect;

    PlaceThreatEffect.prototype.runEffect = async function runEffect() {
        placedThreatEffect = this;
    };

    try {
        const effect = new AccelerateSchemeEffect({match, selectedTarget});

        await effect.execute({player});
    } finally {
        PlaceThreatEffect.prototype.runEffect = originalRunEffect;
    }

    assert.ok(placedThreatEffect);
    assert.equal(placedThreatEffect.threat, 3);
    assert.equal(placedThreatEffect.isAccelerationThreat, true);
    assert.equal(new PlaceThreatEffect({
        match,
        selectedTarget,
        threat: 2,
    }).isAccelerationThreat, false);
});

test('completing the main scheme advances the scenario instead of defeating a card', async () => {
    const player = {name: 'Player'};
    const calls = [];
    const match = {
        scenario: {
            async completeMainScheme(...args) {
                calls.push(args);
            },
        },
    };
    const selectedTarget = {
        card: {value: 5},
        isMainScheme: true,
        match,
        threat: 4,
        value: 5,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {
            assert.fail('A completed main scheme should be refreshed with the stage transition.');
        },
    };
    const effect = new PlaceThreatEffect({
        match,
        selectedTarget,
        threat: 1,
    });

    await effect.execute({player});

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], selectedTarget);
    assert.equal(calls[0][1].player, player);
});

test('placing threat below the main scheme threshold refreshes it normally', async () => {
    let refreshCount = 0;
    const match = {
        scenario: {
            async completeMainScheme() {
                assert.fail('The main scheme is still below its threshold.');
            },
        },
    };
    const selectedTarget = {
        isMainScheme: true,
        match,
        threat: 3,
        value: 5,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {
            refreshCount++;
        },
    };
    const effect = new PlaceThreatEffect({
        match,
        selectedTarget,
        threat: 1,
    });

    await effect.execute({});

    assert.equal(refreshCount, 1);
});
