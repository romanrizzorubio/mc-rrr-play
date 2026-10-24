import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    EFFECT_DEFEAT,
    EFFECT_REMOVE_THREAT,
    TARGET_SCHEME,
    TARGET_THIS,
} from 'mc-shared';
import {Thwart} from '../../src/activations/thwart.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {SchemeGameCard} from '../../src/model/cards/scheme-game-card.js';

describe('RemoveThreatEffect', () => {
    test('uses the shared side-scheme defeat check', async () => {
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
                        async canRun() {
                            return true;
                        },
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

    test('can ignore Crisis for a main scheme without making empty schemes eligible', () => {
        const mainScheme = {
            threat: 3,
            isMainScheme: true,
            isScheme: true,
            isCard: true,
            match: {hasCrisis: true},
            canRemoveThreat(options) {
                return SchemeGameCard.prototype.canRemoveThreat.call(this, options);
            },
            canThwart(player, options) {
                return SchemeGameCard.prototype.canThwart.call(this, player, options);
            },
        };
        const ordinaryEffect = new RemoveThreatEffect({
            target: TARGET_SCHEME,
            threat: 1,
        });
        const ignoreCrisisEffect = new RemoveThreatEffect({
            target: TARGET_SCHEME,
            threat: 1,
            ignoreCrisis: true,
        });
        const player = {hasPatrol: false};
        const ordinaryThwart = new Thwart({effect: ordinaryEffect});
        const ignoreCrisisThwart = new Thwart({effect: ignoreCrisisEffect});

        assert.equal(mainScheme.canRemoveThreat(), false);
        assert.equal(ordinaryEffect.filterTarget(mainScheme, {}), false);
        assert.equal(ignoreCrisisEffect.filterTarget(mainScheme, {}), true);
        assert.equal(ordinaryThwart.filterTarget(mainScheme, {player}), false);
        assert.equal(ignoreCrisisThwart.filterTarget(mainScheme, {player}), true);

        player.hasPatrol = true;
        assert.equal(ignoreCrisisThwart.filterTarget(mainScheme, {player}), false);

        mainScheme.threat = 0;
        assert.equal(ignoreCrisisEffect.filterTarget(mainScheme, {}), false);
        player.hasPatrol = false;
        assert.equal(ignoreCrisisThwart.filterTarget(mainScheme, {player}), false);
    });
});
