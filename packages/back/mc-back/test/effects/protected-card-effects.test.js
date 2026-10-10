import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    EFFECT_CANCEL_ACTIVATION,
    EFFECT_CANCEL_ATTACK,
    EFFECT_CANCEL_SCHEME,
    EFFECT_DEFEAT,
} from 'mc-shared';
import {CancelActivationEffect} from '../../src/effects/cancel-activation-effect.js';
import {PreventDamageEffect} from '../../src/effects/prevent-damage-effect.js';
import {PreventDefeatEffect} from '../../src/effects/prevent-defeat-effect.js';
import {PreventPlaceThreatEffect} from '../../src/effects/prevent-place-threat-effect.js';
import {EFFECT_MAP} from '../../src/factory/effects/effects-map.js';

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
    const cancelVillainActivation = new CancelActivationEffect({
        selectedTarget: villainActivation,
    });
    cancelVillainActivation.getValidTarget = async () => [villainActivation];

    const otherActivation = {
        character: {isMinion: true},
        cancelActivation() {},
    };
    const cancelOtherActivation = new CancelActivationEffect({
        selectedTarget: otherActivation,
    });
    cancelOtherActivation.getValidTarget = async () => [otherActivation];

    assert.equal(await cancelVillainActivation.canRun({}), true);
    assert.equal(await cancelOtherActivation.canRun({}), true);
});

test('a current scheme activation can be canceled from its context', async () => {
    let schemeCancelled = false;
    let selectedActivationCancelled = false;
    const schemeActivation = {
        isScheme: true,
        cancelActivation() {
            schemeCancelled = true;
        },
    };
    const selectedActivation = {
        cancelActivation() {
            selectedActivationCancelled = true;
        },
    };
    const cancelActivation = new CancelActivationEffect({
        selectedTarget: selectedActivation,
    });
    cancelActivation.getValidTarget = async () => [selectedActivation];
    const params = {effect: schemeActivation};

    assert.equal(await cancelActivation.canRun(params), true);
    cancelActivation.execute(params);

    assert.equal(schemeCancelled, true);
    assert.equal(selectedActivationCancelled, false);
});

test('a nested cancel-activation effect cancels the active attack from its context', async () => {
    let attackCancelled = false;
    const attackEffect = {
        cancelActivation() {
            attackCancelled = true;
        },
    };
    const enclosingEffect = {};
    const cancelActivation = new CancelActivationEffect({
        selectedTarget: enclosingEffect,
    });
    cancelActivation.getValidTarget = async () => [enclosingEffect];
    const params = {attack: {effect: attackEffect}};

    assert.equal(await cancelActivation.canRun(params), true);
    cancelActivation.execute(params);

    assert.equal(attackCancelled, true);
});

test('the old attack and scheme effect types resolve to the unified implementation', () => {
    assert.equal(EFFECT_MAP[EFFECT_CANCEL_ACTIVATION], CancelActivationEffect);
    assert.equal(EFFECT_MAP[EFFECT_CANCEL_ATTACK], CancelActivationEffect);
    assert.equal(EFFECT_MAP[EFFECT_CANCEL_SCHEME], CancelActivationEffect);
});
