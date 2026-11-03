import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRIGGER_PHASE_ENDS} from 'mc-shared';
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
            at: TRIGGER_PHASE_ENDS,
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
        assert.equal(
            restoredScenario.delayedEffects[0].at,
            TRIGGER_PHASE_ENDS
        );
        await restoredScenario.resolveDelayedEffects({
            player: restoredScenario.delayedEffects[0].player,
        });

        assert.equal(restoredScenario.pendingTestScheme.accelerationTokens, 2);
        assert.equal(restoredScenario.delayedEffects.length, 0);
    });

    test('after-resolution effects do not consume pending phase-end effects', async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'scenario-delayed-effects-timing-test',
        });
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'scenario',
            scenarioCards: [],
            sets: [],
            villains: [],
        });
        let immediateResolutions = 0;
        let phaseEndResolutions = 0;
        scenario.createDelayedEffect(new Delayed({
            at: TRIGGER_PHASE_ENDS,
            effect: {
                async runEffect() {
                    phaseEndResolutions++;
                },
            },
        }));
        scenario.createDelayedEffect(new Delayed({
            effect: {
                async runEffect() {
                    immediateResolutions++;
                },
            },
        }));

        await scenario.resolveDelayedEffects({}, {afterResolution: true});

        assert.equal(immediateResolutions, 1);
        assert.equal(phaseEndResolutions, 0);
        assert.equal(scenario.delayedEffects.length, 1);

        await scenario.resolveDelayedEffects({});

        assert.equal(phaseEndResolutions, 1);
        assert.equal(scenario.delayedEffects.length, 0);
    });
});
