import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_ASSIGN,
    EFFECT_ASSIGN_THREAT,
    TARGET_ALL_SCHEMES,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {AssignThreatEffect} from '../../src/effects/assign-threat-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {ResourceCost} from '../../src/model/costs/resource-cost.js';

const createScheme = ({
    id,
    isMainScheme = false,
    isSideScheme = false,
    match,
    threat,
}) => ({
    id,
    isMainScheme,
    isSideScheme,
    threat,
    canRemoveThreat({ignoreCrisis = false} = {}) {
        return this.threat > 0 &&
            (!this.isMainScheme || ignoreCrisis || !match.hasCrisis);
    },
    removeThreat(amount) {
        this.threat = Math.max(0, this.threat - amount);
    },
    refresh() {},
    toObj() {
        return {
            id: this.id,
            isMainScheme: this.isMainScheme,
            isSideScheme: this.isSideScheme,
            name: this.id,
            threat: this.threat,
        };
    },
});

describe('AssignThreatEffect', () => {
    test('distributes the requested total among schemes that can lose threat', async () => {
        let assignmentDialog;
        const match = {
            hasCrisis: true,
            triggerCards: {},
            schemes: [],
            async openDialog(dialog) {
                assignmentDialog = dialog;

                return {
                    assigned: {
                        firstSideScheme: 1,
                        secondSideScheme: 2,
                    },
                };
            },
        };
        const mainScheme = createScheme({
            id: 'mainScheme',
            isMainScheme: true,
            match,
            threat: 5,
        });
        const firstSideScheme = createScheme({
            id: 'firstSideScheme',
            isSideScheme: true,
            match,
            threat: 4,
        });
        const secondSideScheme = createScheme({
            id: 'secondSideScheme',
            isSideScheme: true,
            match,
            threat: 3,
        });
        const emptySideScheme = createScheme({
            id: 'emptySideScheme',
            isSideScheme: true,
            match,
            threat: 0,
        });
        match.schemes = [
            mainScheme,
            firstSideScheme,
            secondSideScheme,
            emptySideScheme,
        ];
        const effect = new AssignThreatEffect({
            effectType: EFFECT_ASSIGN_THREAT,
            match,
            target: TARGET_ALL_SCHEMES,
            threat: 3,
        });

        assert.equal(effect.effectType, EFFECT_ASSIGN_THREAT);
        await effect.runEffect({
            match,
            player: {hand: {cards: []}},
            playCardEffect: {targetId: secondSideScheme.id},
        });

        assert.equal(assignmentDialog.dialogType, DIALOG_ASSIGN);
        assert.equal(assignmentDialog.title, 'Quita un total de 3 de Amenaza');
        assert.equal(assignmentDialog.data.assignInitially, true);
        assert.equal(
            assignmentDialog.data.autoAssignRemainderToSingleTarget,
            true,
        );
        assert.equal(assignmentDialog.data.count, 3);
        assert.equal(assignmentDialog.data.field, 'threat');
        assert.equal(assignmentDialog.data.initialTargetId, 'secondSideScheme');
        assert.equal(assignmentDialog.data.preserveRemainderOnDecrease, true);
        assert.equal(
            assignmentDialog.data.transferIncreaseFromMostAssigned,
            true,
        );
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id, threat}) => [id, threat]),
            [
                ['firstSideScheme', 4],
                ['secondSideScheme', 3],
            ],
        );
        assert.deepEqual(
            [
                mainScheme.threat,
                firstSideScheme.threat,
                secondSideScheme.threat,
                emptySideScheme.threat,
            ],
            [5, 3, 1, 0],
        );
    });

    test('automatically removes threat when there is only one eligible scheme', async () => {
        let dialogCalls = 0;
        const match = {
            hasCrisis: false,
            triggerCards: {},
            async openDialog() {
                dialogCalls++;
            },
        };
        const mainScheme = createScheme({
            id: 'mainScheme',
            isMainScheme: true,
            match,
            threat: 2,
        });
        match.schemes = [mainScheme];
        const effect = new AssignThreatEffect({
            match,
            target: TARGET_ALL_SCHEMES,
            threat: 3,
        });

        await effect.runEffect({
            match,
            player: {hand: {cards: []}},
        });

        assert.equal(mainScheme.threat, 0);
        assert.equal(dialogCalls, 0);
    });

    test('prioritizes the scheme where an event was dropped in its assignment dialog', async () => {
        let assignmentDialog;
        const match = {
            hasCrisis: false,
            triggerCards: {},
            schemes: [],
            async openDialog(dialog) {
                assignmentDialog = dialog;

                return {
                    assigned: {
                        firstScheme: 0,
                        droppedScheme: 3,
                    },
                };
            },
        };
        const firstScheme = createScheme({
            id: 'firstScheme',
            isSideScheme: true,
            match,
            threat: 4,
        });
        const droppedScheme = createScheme({
            id: 'droppedScheme',
            isSideScheme: true,
            match,
            threat: 4,
        });
        match.schemes = [firstScheme, droppedScheme];
        const effect = new AssignThreatEffect({
            match,
            target: TARGET_ALL_SCHEMES,
            threat: 3,
        });
        const ability = new Ability({
            effect,
            match,
            name: 'Assign threat',
        });
        ability.canRun = async () => true;
        const card = {
            abilities: [ability],
            isEvent: true,
            isUpgrade: false,
            isPlaying: false,
        };
        const player = {
            deck: {
                async discard() {},
            },
            hand: {
                cards: [card],
                async discardHand(discardedCard) {
                    this.cards.splice(this.cards.indexOf(discardedCard), 1);
                },
                async refresh() {},
            },
        };
        const playCardEffect = new PlayCardEffect({
            card,
            match,
            targetId: droppedScheme.id,
        });

        await playCardEffect.prepare({card, match, player});
        playCardEffect.getResourceCost = async () => new ResourceCost({
            amount: 0,
            card,
            match,
            playCardEffect,
        });

        await playCardEffect.execute({card, match, player});

        assert.equal(assignmentDialog.data.initialTargetId, droppedScheme.id);
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id}) => id),
            [firstScheme.id, droppedScheme.id],
        );
        assert.deepEqual(
            [firstScheme.threat, droppedScheme.threat],
            [4, 1],
        );
    });

    test('does nothing when no scheme can remove threat', async () => {
        let dialogCalls = 0;
        const match = {
            hasCrisis: true,
            triggerCards: {},
            schemes: [],
            async openDialog() {
                dialogCalls++;
            },
        };
        const effect = new AssignThreatEffect({
            match,
            target: TARGET_ALL_SCHEMES,
            threat: 3,
        });

        await effect.runEffect({
            match,
            player: {hand: {cards: []}},
        });

        assert.equal(dialogCalls, 0);
    });

    test('rejects a distribution that exceeds a scheme capacity or the total', async () => {
        const match = {
            hasCrisis: false,
            triggerCards: {},
            schemes: [],
            async openDialog() {
                return {
                    assigned: {
                        firstScheme: 4,
                        secondScheme: 0,
                    },
                };
            },
        };
        const firstScheme = createScheme({
            id: 'firstScheme',
            isSideScheme: true,
            match,
            threat: 3,
        });
        const secondScheme = createScheme({
            id: 'secondScheme',
            isSideScheme: true,
            match,
            threat: 3,
        });
        match.schemes = [firstScheme, secondScheme];
        const effect = new AssignThreatEffect({
            match,
            target: TARGET_ALL_SCHEMES,
            threat: 3,
        });

        await assert.rejects(
            effect.runEffect({
                match,
                player: {hand: {cards: []}},
            }),
            /La distribución de amenaza no es válida\./,
        );
        assert.deepEqual(
            [firstScheme.threat, secondScheme.threat],
            [3, 3],
        );
    });
});
