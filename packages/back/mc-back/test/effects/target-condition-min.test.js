import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    filterTargetCandidates,
    filterTargetsByCondition,
    splitTargetCondition,
} from '../../src/utils/target-condition-utils.js';

describe('minimum target conditions', () => {
    test('filters eligibility first and preserves all candidates tied at the minimum', () => {
        const weakest = {attack: 1, isEnemy: true, name: 'Weakest'};
        const tied = {attack: 1, isEnemy: true, name: 'Tied'};
        const stronger = {attack: 2, isEnemy: true, name: 'Stronger'};
        const ineligible = {attack: 0, isEnemy: false, name: 'Not an enemy'};
        const {condition, selectionConditions} = splitTargetCondition({
            isEnemy: true,
            attack: {operator: 'min'},
        });
        const eligible = filterTargetsByCondition(
            [weakest, tied, stronger, ineligible],
            condition,
        );

        assert.deepEqual(
            filterTargetCandidates(eligible, selectionConditions),
            [weakest, tied],
        );
    });

    test('uses the configured default for missing values', () => {
        const missing = {name: 'Missing'};
        const zero = {name: 'Zero', cost: 0};
        const positive = {name: 'Positive', cost: 2};
        const {selectionConditions} = splitTargetCondition({
            cost: {operator: 'min', defaultValue: 0},
        });

        assert.deepEqual(
            filterTargetCandidates(
                [missing, zero, positive],
                selectionConditions,
            ),
            [missing, zero],
        );
    });
});
