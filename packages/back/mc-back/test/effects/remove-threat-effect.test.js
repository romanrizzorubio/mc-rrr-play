import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_ASSIGN,
    EFFECT_DEFEAT,
    EFFECT_REMOVE_THREAT,
    TARGET_ALL_SCHEMES,
    TARGET_SCHEME,
    TARGET_THIS,
} from 'mc-shared';
import {Thwart} from '../../src/activations/thwart.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {SchemeGameCard} from '../../src/model/cards/scheme-game-card.js';

describe('RemoveThreatEffect', () => {
    test('scales per-player threat removal by the number of players', async () => {
        const source = {
            isSideScheme: true,
            threat: 10,
            canRemoveThreat() {
                return this.threat > 0;
            },
            removeThreat(threat) {
                this.threat -= threat;
            },
            refresh() {},
        };
        const match = {
            numPlayers: 2,
            triggerCards: {},
        };
        const effect = new RemoveThreatEffect({
            match,
            selectedTarget: source,
            target: TARGET_THIS,
            threat: [3, true],
        });

        await effect.runEffect({match});

        assert.equal(effect.threat, 6);
        assert.equal(source.threat, 4);
    });

    test('distributes threat removal across eligible schemes', async () => {
        let assignmentDialog;
        const createScheme = (id, threat) => ({
            id,
            threat,
            isSideScheme: true,
            canRemoveThreat() {
                return this.threat > 0;
            },
            removeThreat(amount) {
                this.threat -= amount;
            },
            refresh() {},
            toObj() {
                return {id: this.id, name: this.id, threat: this.threat};
            },
        });
        const firstScheme = createScheme('first', 4);
        const secondScheme = createScheme('second', 3);
        const match = {
            triggerCards: {},
            async openDialog(dialog) {
                assignmentDialog = dialog;

                return {assigned: {first: 1, second: 2}};
            },
        };
        const effect = new RemoveThreatEffect({
            distribute: true,
            match,
            selectedTarget: [firstScheme, secondScheme],
            target: TARGET_ALL_SCHEMES,
            threat: 3,
        });

        await effect.runEffect({
            match,
            player: {hand: {cards: []}},
        });

        assert.equal(assignmentDialog.dialogType, DIALOG_ASSIGN);
        assert.equal(assignmentDialog.data.count, 3);
        assert.deepEqual([firstScheme.threat, secondScheme.threat], [3, 1]);
    });

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
