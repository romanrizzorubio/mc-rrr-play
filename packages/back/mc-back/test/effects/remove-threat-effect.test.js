import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EFFECT_DEFEAT, EFFECT_REMOVE_THREAT, TARGET_THIS} from 'mc-shared';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';

test('RemoveThreatEffect uses the shared side-scheme defeat check', async () => {
    const source = {
        isSideScheme: true,
        threat: 1,
        canRemoveThreat() {
            return this.threat > 0;
        },
        removeThreat(threat) {
            this.threat = Math.max(0, this.threat - threat);
        },
        refresh() {},
    };
    let defeated = false;
    const match = {
        effectsFactory: {
            createEffect({selectedTarget, type}) {
                assert.equal(type, EFFECT_DEFEAT);
                assert.equal(selectedTarget, source);
                assert.equal(source.threat, 0);
                return {
                    async runEffect() {
                        defeated = true;
                    },
                };
            },
        },
        triggerCards: {},
    };
    const effect = new RemoveThreatEffect({
        match,
        selectedTarget: source,
        target: TARGET_THIS,
        threat: 1,
    });

    assert.equal(effect.effectType, EFFECT_REMOVE_THREAT);
    await effect.runEffect({match});

    assert.equal(defeated, true);
});
