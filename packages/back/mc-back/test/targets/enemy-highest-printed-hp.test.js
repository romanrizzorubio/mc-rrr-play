import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ENEMY_HIGHEST_PRINTED_HP} from 'mc-shared';
import {AttachEffect} from '../../src/effects/attach-effect.js';

const enemy = (id, printedHP, attached = []) => ({
    id,
    abilities: [],
    attached,
    currentSide: {
        card: {hitPoints: printedHP},
    },
});

test('highest printed HP considers eligible villains and minions, then keeps ties', async () => {
    const blockedVillain = enemy('villain', 15, [
        {card: {id: 'goblin-gimmicks--glider'}},
    ]);
    const firstHighest = enemy('first', 12);
    const tiedHighest = enemy('tied', 12);
    const lower = enemy('lower', 10);
    const match = {
        villain: blockedVillain,
        minions: [firstHighest, tiedHighest, lower],
    };
    const attachment = {
        id: 'goblin-gimmicks--glider',
        maxAttach: 1,
        canAttach(target) {
            return target.attached.filter(({card}) => card.id === this.id).length <
                this.maxAttach;
        },
    };
    const effect = new AttachEffect({
        card: attachment,
        match,
        target: TARGET_ENEMY_HIGHEST_PRINTED_HP,
    });

    assert.deepEqual(await effect.getValidTarget({match}), [
        firstHighest,
        tiedHighest,
    ]);
});

test('highest printed HP returns no target when every enemy is ineligible', async () => {
    const attachment = {
        id: 'goblin-gimmicks--glider',
        canAttach: () => false,
    };
    const match = {
        villain: enemy('villain', 15),
        minions: [enemy('minion', 12)],
    };
    const effect = new AttachEffect({
        card: attachment,
        match,
        target: TARGET_ENEMY_HIGHEST_PRINTED_HP,
    });

    assert.deepEqual(await effect.getValidTarget({match}), []);
});
