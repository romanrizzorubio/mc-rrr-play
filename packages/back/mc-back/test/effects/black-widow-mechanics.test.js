import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CALC_COUNT,
    TARGET_UPGRADE_YOU_CONTROL,
    TRAIT_PREPARATION,
} from 'mc-shared';
import {CancelBoostAbilityEffect} from '../../src/effects/cancel-boost-ability-effect.js';
import {DiscardFromGameEffect} from '../../src/effects/discard-from-game-effect.js';
import {ModifyActivationEffect} from '../../src/effects/modify-activation-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';

test('highest-cost discard selection filters preparation upgrades and preserves ties', async () => {
    const firstHighest = {
        abilities: [],
        cost: 3,
        traits: [TRAIT_PREPARATION],
    };
    const secondHighest = {
        abilities: [],
        cost: 3,
        traits: [TRAIT_PREPARATION],
    };
    const otherPreparation = {
        abilities: [],
        cost: 2,
        traits: [TRAIT_PREPARATION],
    };
    const otherUpgrade = {
        abilities: [],
        cost: 9,
        traits: [],
    };
    const player = {
        upgrades: [
            firstHighest,
            secondHighest,
            otherPreparation,
            otherUpgrade,
        ],
    };
    const effect = new DiscardFromGameEffect({
        target: TARGET_UPGRADE_YOU_CONTROL,
        condition: {
            traits: TRAIT_PREPARATION,
            cost: {operator: 'max', defaultValue: 0},
        },
        refreshTarget: true,
    });

    assert.deepEqual(effect.getValidTarget({player}), [
        firstHighest,
        secondHighest,
    ]);
    assert.equal(effect.highestCost, undefined);

    let offeredTargets;
    effect.validTarget.selectSingleTarget = async targets => {
        offeredTargets = targets;

        return targets[0];
    };
    assert.strictEqual(await effect.selectTarget({player}), firstHighest);
    assert.deepEqual(offeredTargets, [firstHighest, secondHighest]);

    assert.equal(effect.getValidTarget({
        player: {upgrades: [otherUpgrade]},
    }).length, 0);
});

test('highest-cost discard refreshes its candidate set before selection', async () => {
    const staleUpgrade = {
        abilities: [],
        cost: 5,
        traits: [TRAIT_PREPARATION],
    };
    const currentUpgrade = {
        abilities: [],
        cost: 2,
        traits: [TRAIT_PREPARATION],
    };
    const effect = new DiscardFromGameEffect({
        selectedTarget: staleUpgrade,
        target: TARGET_UPGRADE_YOU_CONTROL,
        condition: {
            traits: TRAIT_PREPARATION,
            cost: {operator: 'max', defaultValue: 0},
        },
        refreshTarget: true,
    });

    assert.deepEqual(effect.getValidTarget({
        player: {upgrades: [currentUpgrade]},
    }), [currentUpgrade]);
});

test('target max conditions treat missing card costs as their configured default', () => {
    const noCostPreparation = {
        abilities: [],
        traits: [TRAIT_PREPARATION],
    };
    const zeroCostPreparation = {
        abilities: [],
        cost: 0,
        traits: [TRAIT_PREPARATION],
    };
    const higherCostPreparation = {
        abilities: [],
        cost: 2,
        traits: [TRAIT_PREPARATION],
    };
    const effect = new DiscardFromGameEffect({
        target: TARGET_UPGRADE_YOU_CONTROL,
        condition: {
            traits: TRAIT_PREPARATION,
            cost: {operator: 'max', defaultValue: 0},
        },
    });

    assert.deepEqual(effect.getValidTarget({
        player: {
            upgrades: [
                noCostPreparation,
                zeroCostPreparation,
                higherCostPreparation,
            ],
        },
    }), [higherCostPreparation]);
    assert.deepEqual(effect.getValidTarget({
        player: {
            upgrades: [noCostPreparation, zeroCostPreparation],
        },
    }), [noCostPreparation, zeroCostPreparation]);
});

test('boost ability cancellation suppresses only the current boost ability', async () => {
    let resolved = false;
    const card = {
        boost: 1,
        boostAbility: {
            async resolveAbility() {
                resolved = true;
            },
        },
    };
    const boostEffect = new ResolveBoostEffect({
        card,
        enemyActivation: {boostCards: [card]},
        match: {amplificationIcons: 0},
        selectedTarget: {},
    });
    boostEffect.boostValue = 1;

    const cancelAbility = new CancelBoostAbilityEffect({
        selectedTarget: boostEffect,
    });
    await cancelAbility.execute({});
    await boostEffect.execute({player: {}});

    assert.equal(boostEffect.cancelledBoostAbility, true);
    assert.equal(resolved, false);
    assert.equal(boostEffect.value, 1);
});

test('activation modifiers add a fixed or calculated value without implicit multiplication', async () => {
    const attackEffect = {
        isAttack: true,
        isScheme: false,
        modifyAttack: 0,
        modifyScheme: 0,
    };
    const schemeEffect = {
        isAttack: false,
        isScheme: true,
        modifyAttack: 0,
        modifyScheme: 0,
    };
    const noUpgradeEffect = {
        isAttack: true,
        isScheme: false,
        modifyAttack: 0,
        modifyScheme: 0,
    };
    const fixedAttackEffect = {
        isAttack: true,
        isScheme: false,
        modifyAttack: 0,
        modifyScheme: 0,
    };
    const explicitlyMultipliedAttackEffect = {
        isAttack: true,
        isScheme: false,
        modifyAttack: 0,
        modifyScheme: 0,
    };
    const paramsCalc = {
        target: 'player.upgrades',
        formula: CALC_COUNT,
    };

    await new ModifyActivationEffect({
        selectedTarget: {effect: attackEffect},
        attack: true,
        scheme: true,
        paramsCalc,
    }).execute({player: {upgrades: [{}, {}, {}]}});

    await new ModifyActivationEffect({
        selectedTarget: {effect: schemeEffect},
        attack: true,
        scheme: true,
        paramsCalc,
    }).execute({player: {upgrades: [{}, {}]}});

    await new ModifyActivationEffect({
        selectedTarget: {effect: noUpgradeEffect},
        attack: true,
        paramsCalc,
    }).execute({player: {upgrades: []}});

    await new ModifyActivationEffect({
        selectedTarget: {effect: fixedAttackEffect},
        attack: true,
        count: 3,
    }).execute({});

    await new ModifyActivationEffect({
        selectedTarget: {effect: explicitlyMultipliedAttackEffect},
        attack: true,
        paramsCalc: {...paramsCalc, multiply: 2},
    }).execute({player: {upgrades: [{}, {}]}});

    assert.equal(attackEffect.modifyAttack, 3);
    assert.equal(attackEffect.modifyScheme, 0);
    assert.equal(schemeEffect.modifyAttack, 0);
    assert.equal(schemeEffect.modifyScheme, 2);
    assert.equal(noUpgradeEffect.modifyAttack, 0);
    assert.equal(fixedAttackEffect.modifyAttack, 3);
    assert.equal(explicitlyMultipliedAttackEffect.modifyAttack, 4);
});
