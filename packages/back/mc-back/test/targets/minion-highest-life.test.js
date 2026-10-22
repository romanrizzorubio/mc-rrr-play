import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_MINION} from 'mc-shared';
import {AttachEffect} from '../../src/effects/attach-effect.js';

const minion = (id, hitPoints, damage = 0, attached = []) => ({
    id,
    abilities: [],
    attached,
    damage,
    hitPoints,
    get life() {
        return this.hitPoints - this.damage;
    },
});

const defensiveProgramming = {
    id: 'zola--defensive-programming',
    maxAttach: 1,
    canAttach(target) {
        return target.attached.filter(({card}) =>
            card.id === this.id).length < this.maxAttach;
    },
};

describe('minion with highest remaining life target', () => {
    test('filters ineligible minions before comparing remaining life and keeps ties', async () => {
        const blockedHighest = minion('blocked-highest', 14, 0, [
            {card: {id: defensiveProgramming.id}},
        ]);
        const firstEligibleHighest = minion('eligible-highest-a', 10, 2);
        const tiedEligibleHighest = minion('eligible-highest-b', 12, 4);
        const lowerEligible = minion('eligible-lower', 15, 8);
        const match = {
            minions: [
                blockedHighest,
                firstEligibleHighest,
                tiedEligibleHighest,
                lowerEligible,
            ],
        };
        const effect = new AttachEffect({
            card: defensiveProgramming,
            condition: {life: {operator: 'max'}},
            match,
            target: TARGET_MINION,
        });

        assert.deepEqual(await effect.getValidTarget({match}), [
            firstEligibleHighest,
            tiedEligibleHighest,
        ]);
    });

    test('returns no target when every minion already has a copy attached', async () => {
        const attachedMinion = minion('already-attached', 8, 0, [
            {card: {id: defensiveProgramming.id}},
        ]);
        const match = {minions: [attachedMinion]};
        const effect = new AttachEffect({
            card: defensiveProgramming,
            condition: {life: {operator: 'max'}},
            match,
            target: TARGET_MINION,
        });

        assert.deepEqual(await effect.getValidTarget({match}), []);
    });

    test('ranks active-side hit points using the same generic selector', async () => {
        const activeSideHighest = minion('active-side-highest', 8);
        activeSideHighest.currentSide = {
            card: {hitPoints: 4},
            hitPoints: 12,
        };
        const printedHighest = minion('printed-highest', 10);
        printedHighest.currentSide = {
            card: {hitPoints: 12},
            hitPoints: 10,
        };
        const match = {minions: [activeSideHighest, printedHighest]};
        const effect = new AttachEffect({
            card: {canAttach: () => true},
            condition: {'currentSide.hitPoints': {operator: 'max'}},
            match,
            target: TARGET_MINION,
        });

        assert.deepEqual(await effect.getValidTarget({match}), [
            activeSideHighest,
        ]);
    });
});
