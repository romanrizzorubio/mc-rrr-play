import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {AddAccelerationTokenEffect} from '../../src/effects/add-acceleration-token-effect.js';
import {Delayed} from '../../src/engine/delayed.js';
import {Match} from '../../src/model/match/match.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

describe('scenario delayed effects', () => {
    test('preserves pending phase effects across match snapshots', async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'scenario-delayed-effects-snapshot-test',
        });
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'scenario',
            scenarioCards: [],
            sets: [],
            villains: [],
        });
        const scheme = {accelerationTokens: 0};
        const player = {name: 'Hulka'};
        scenario.pendingTestScheme = scheme;
        match.scenario = scenario;
        scenario.createDelayedEffect(new Delayed({
            card: {id: 'source'},
            player,
            effect: new AddAccelerationTokenEffect({
                count: 2,
                match,
                selectedTarget: scheme,
            }),
        }));

        const restoredMatch = restoreMatch(serializeMatch(match), match.mc);
        const restoredScenario = restoredMatch.scenario;

        assert.ok(restoredScenario.delayedEffects[0] instanceof Delayed);
        assert.ok(
            restoredScenario.delayedEffects[0].effect instanceof
                AddAccelerationTokenEffect
        );
        await restoredScenario.resolveDelayedEffects({
            player: restoredScenario.delayedEffects[0].player,
        });

        assert.equal(restoredScenario.pendingTestScheme.accelerationTokens, 2);
        assert.equal(restoredScenario.delayedEffects.length, 0);
    });
});
