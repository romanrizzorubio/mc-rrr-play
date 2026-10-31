import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DefeatEffect} from '../../src/effects/defeat-effect.js';

describe('villain defeat announcements', () => {
    test('defeating a same-title villain stage announces it once before updating the defeat and attack targets', async () => {
        const order = [];
        const stageTwo = {
            isVillain: true,
            name: 'Rino',
            stage: 2,
            refresh() {},
        };
        let currentVillain;
        const stageOne = {
            abilities: [],
            isVillain: true,
            name: 'Rino',
            stage: 1,
            async defeat(_player, {defeatAnnounced}) {
                assert.equal(defeatAnnounced, true);
                order.push('advance');
                currentVillain = stageTwo;
            },
        };
        const attackEffect = {
            selectedTarget: stageOne,
        };
        const activation = {
            get selectedTarget() {
                return attackEffect.selectedTarget;
            },
            set selectedTarget(target) {
                attackEffect.selectedTarget = target;
            },
        };
        const effect = new DefeatEffect({
            activation,
            match: {
                triggerCards: {},
                scenario: {
                    async announceVillainDefeat(villain) {
                        assert.equal(villain, stageOne);
                        order.push('defeat');
                    },
                },
                get villain() {
                    return currentVillain;
                },
            },
            selectedTarget: stageOne,
        });

        await effect.execute({player: {}});

        assert.equal(effect.selectedTarget, stageTwo);
        assert.equal(attackEffect.selectedTarget, stageTwo);
        assert.deepEqual(order, ['defeat', 'advance']);
    });
});
