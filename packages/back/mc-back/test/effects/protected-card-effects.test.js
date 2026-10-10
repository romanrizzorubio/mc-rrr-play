import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EFFECT_DEFEAT} from 'mc-shared';
import {CancelAttackEffect} from '../../src/effects/cancel-attack-effect.js';
import {PreventDamageEffect} from '../../src/effects/prevent-damage-effect.js';
import {PreventDefeatEffect} from '../../src/effects/prevent-defeat-effect.js';
import {PreventPlaceThreatEffect} from '../../src/effects/prevent-place-threat-effect.js';

const protectedCards = [
    {isVillain: true},
    {isMainScheme: true},
    {card: {keywords: {permanent: true}}},
];

test('effects from permanent, villain, and main scheme abilities can be prevented individually', async () => {
    for (const card of protectedCards) {
        const preventDamage = new PreventDamageEffect({});
        const preventThreat = new PreventPlaceThreatEffect({});
        const preventDefeat = new PreventDefeatEffect({});
        const damageEffect = {
            ability: {card},
            damage: 2,
            preventDamage: 0,
            takenDamage: 2,
        };
        const threatEffect = {
            ability: {card},
            preventThreat: 0,
            threat: 2,
        };
        const defeatEffect = {
            ability: {card},
            effectType: EFFECT_DEFEAT,
            prevented: false,
        };
        preventDamage.getValidTarget = async () => [{}];
        preventThreat.getValidTarget = async () => [{}];
        preventDefeat.getValidTarget = async () => [{}];

        assert.equal(await preventDamage.canRun({effect: damageEffect}), true);
        assert.equal(await preventThreat.canRun({effect: threatEffect}), true);
        assert.equal(await preventDefeat.canRun({effect: defeatEffect}), true);

        preventDamage.execute({effect: damageEffect});
        preventThreat.execute({effect: threatEffect});
        preventDefeat.execute({effect: defeatEffect});

        assert.equal(damageEffect.preventDamage, damageEffect.damage);
        assert.equal(threatEffect.preventThreat, threatEffect.threat);
        assert.equal(defeatEffect.prevented, true);
    }
});

test('a normal villain activation can be canceled', async () => {
    const villainActivation = {
        character: {isVillain: true},
        cancelActivation() {},
    };
    const cancelVillainAttack = new CancelAttackEffect({
        selectedTarget: villainActivation,
    });
    cancelVillainAttack.getValidTarget = async () => [villainActivation];

    const otherActivation = {
        character: {isMinion: true},
        cancelActivation() {},
    };
    const cancelOtherAttack = new CancelAttackEffect({
        selectedTarget: otherActivation,
    });
    cancelOtherAttack.getValidTarget = async () => [otherActivation];

    assert.equal(await cancelVillainAttack.canRun({}), true);
    assert.equal(await cancelOtherAttack.canRun({}), true);
});

test('a nested cancel-attack effect cancels the active attack from its context', async () => {
    let attackCancelled = false;
    const attackEffect = {
        cancelActivation() {
            attackCancelled = true;
        },
    };
    const enclosingEffect = {};
    const cancelAttack = new CancelAttackEffect({
        selectedTarget: enclosingEffect,
    });
    cancelAttack.getValidTarget = async () => [enclosingEffect];
    const params = {attack: {effect: attackEffect}};

    assert.equal(await cancelAttack.canRun(params), true);
    cancelAttack.execute(params);

    assert.equal(attackCancelled, true);
});
