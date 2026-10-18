import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    EFFECT_DEFEAT,
    EFFECT_PLACE_DAMAGE,
    EFFECT_TAKE_DAMAGE,
} from 'mc-shared';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';

function createDamageTarget({hitPoints = 1} = {}) {
    return {
        abilities: [],
        damage: 0,
        hitPoints,
        isCharacter: true,
        isInPlay: true,
        isVillain: false,
        async defeat() {
            this.isInPlay = false;
        },
        async getLife() {
            return this.hitPoints - this.damage;
        },
    };
}

function createTakeDamageEffect(target, {removeWithoutDefeat = false} = {}) {
    const match = {
        villain: undefined,
    };
    match.effectsFactory = {
        createEffect({type, ...params}) {
            if (type === EFFECT_PLACE_DAMAGE) {
                return {
                    async runEffect() {
                        target.damage += params.damage;
                        if (removeWithoutDefeat) {
                            target.isInPlay = false;
                        }
                    },
                };
            }
            if (type === EFFECT_DEFEAT) {
                const effect = new DefeatEffect({
                    ...params,
                    match,
                    effectType: type,
                });
                effect.canRun = async () => true;
                effect.trigger = async () => true;

                return effect;
            }

            throw new Error(`Unexpected effect type ${type}`);
        },
    };

    return new TakeDamageEffect({
        damage: 1,
        match,
        selectedTarget: target,
    });
}

test('TakeDamageEffect reports only an actual defeat, not another exit from play', async () => {
    const defeatedTarget = createDamageTarget();
    const defeatedEffect = createTakeDamageEffect(defeatedTarget);

    await defeatedEffect.execute({player: {}});

    assert.equal(defeatedEffect.defeated, true);
    assert.equal(defeatedTarget.isInPlay, false);

    const removedTarget = createDamageTarget({
        hitPoints: 2,
    });
    const removedEffect = createTakeDamageEffect(removedTarget, {
        removeWithoutDefeat: true,
    });

    await removedEffect.execute({player: {}});

    assert.equal(removedTarget.isInPlay, false);
    assert.equal(removedEffect.defeated, false);
});

test('DealDamageEffect exposes its defeat result to chained conditions', async () => {
    const makeDamageEffect = defeated => new DealDamageEffect({
        activation: {getOverkill: () => false},
        damage: 1,
        isAttack: true,
        match: {
            effectsFactory: {
                createEffect({type, damage}) {
                    assert.equal(type, EFFECT_TAKE_DAMAGE);

                    return {
                        defeated,
                        takenDamage: damage,
                        async runEffect() {},
                    };
                },
            },
        },
        selectedTarget: {isInPlay: false},
    });
    const defeatedAttack = makeDamageEffect(true);
    const removedAttack = makeDamageEffect(false);
    const ifDefeated = new DoIfEffect({
        condition: {'effects.0.defeated': true},
    });

    await defeatedAttack.execute({});
    await removedAttack.execute({});

    assert.equal(ifDefeated.checkCondition({effects: [defeatedAttack]}), true);
    assert.equal(ifDefeated.checkCondition({effects: [removedAttack]}), false);
});
