import assert from 'node:assert/strict';
import {test} from 'node:test';

import {RESOURCE_PHYSICAL, TARGET_ENEMY} from 'mc-shared';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DoIfHasPaidEffect} from '../../src/effects/do-if-has-paid-effect.js';
import {StunEffect} from '../../src/effects/stun-effect.js';

async function resolveChainToNextStage(nextStageName) {
    const firstStage = {
        abilities: [],
        isStunned: false,
        isInPlay: true,
        isVillain: true,
        name: 'Villano',
        refresh() {},
        stun() {
            this.isStunned = true;
        },
    };
    const nextStage = {
        abilities: [],
        isStunned: false,
        isInPlay: false,
        isVillain: true,
        name: nextStageName,
        refresh() {},
        stun() {
            this.isStunned = true;
        },
    };
    let villain = firstStage;
    const match = {
        get villain() {
            return villain;
        },
        get enemies() {
            return [this.villain];
        },
        triggerCards: {},
    };

    const damageEffect = {
        target: TARGET_ENEMY,
        selectedTarget: firstStage,
        canRun: async () => true,
        isFullResolved: () => true,
        paymentCancelled: false,
        async runEffect() {
            firstStage.isInPlay = false;
            nextStage.isInPlay = true;
            villain = nextStage;
        },
    };
    const stunEffect = new StunEffect({match, target: TARGET_ENEMY});
    const conditionalStunEffect = new DoIfHasPaidEffect({
        effect: stunEffect,
        match,
        resources: [RESOURCE_PHYSICAL],
        target: TARGET_ENEMY,
    });
    const effect = new ChainedEffect({
        effects: [damageEffect, conditionalStunEffect],
        match,
        selectedTarget: firstStage,
        target: TARGET_ENEMY,
    });

    await effect.execute({
        match,
        playCardEffect: {resourcesPaid: [RESOURCE_PHYSICAL]},
    });

    return {firstStage, nextStage};
}

test('a chained effect follows a same-title villain stage after damage', async () => {
    const {nextStage} = await resolveChainToNextStage('Villano');

    assert.equal(nextStage.isStunned, true);
});

test('a chained effect does not follow a villain stage with a different title', async () => {
    const {firstStage, nextStage} = await resolveChainToNextStage('Otro villano');

    assert.equal(firstStage.isStunned, true);
    assert.equal(nextStage.isStunned, false);
});
