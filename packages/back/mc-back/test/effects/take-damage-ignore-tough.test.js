import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EFFECT_PLACE_DAMAGE} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';

function createDamageEffect({
    ignoreTough = false,
    isAttack = false,
    multipleTargets = true,
    piercing = false,
} = {}) {
    let toughRemoved = 0;
    const target = {
        damage: 0,
        isTough: true,
        async getLife() {
            return 10 - this.damage;
        },
        removeTough() {
            toughRemoved++;
            this.isTough = false;
        },
        async refresh() {},
    };
    const match = {
        activationsFactory: {
            createActivation: ({effect}) => new Attack({effect}),
        },
        enemies: [],
        effectsFactory: {
            createEffect({type, selectedTarget, damage}) {
                assert.equal(type, EFFECT_PLACE_DAMAGE);

                return {
                    async runEffect() {
                        selectedTarget.damage += damage;
                    },
                };
            },
        },
        triggerCards: {},
    };
    const effect = new TakeDamageEffect({
        damage: 2,
        ignoreTough,
        isAttack,
        keywords: {piercing},
        match,
    });
    effect.selectedTarget = multipleTargets ? [target] : target;

    return {effect, target, toughRemoved: () => toughRemoved};
}

test('damage that ignores Tough leaves the status and still places damage', async () => {
    const {effect, target, toughRemoved} = createDamageEffect({
        ignoreTough: true,
    });

    await effect.runEffect({match: effect.match});

    assert.equal(target.damage, 2);
    assert.equal(target.isTough, true);
    assert.equal(toughRemoved(), 0);
});

test('ordinary damage still consumes Tough and prevents damage', async () => {
    const {effect, target, toughRemoved} = createDamageEffect();

    await effect.runEffect({match: effect.match});

    assert.equal(target.damage, 0);
    assert.equal(target.isTough, false);
    assert.equal(toughRemoved(), 1);
});

test('a piercing attack discards Tough and still deals damage to one target', async () => {
    const {effect, target, toughRemoved} = createDamageEffect({
        isAttack: true,
        multipleTargets: false,
        piercing: true,
    });

    await effect.runEffect({match: effect.match});

    assert.equal(target.damage, 2);
    assert.equal(target.isTough, false);
    assert.equal(toughRemoved(), 1);
});

test('a piercing attack discards Tough and still deals damage to multiple targets', async () => {
    const {effect, target, toughRemoved} = createDamageEffect({
        isAttack: true,
        piercing: true,
    });

    await effect.runEffect({match: effect.match});

    assert.equal(target.damage, 2);
    assert.equal(target.isTough, false);
    assert.equal(toughRemoved(), 1);
});

test('Piercing has no effect on non-attack damage', async () => {
    const {effect, target, toughRemoved} = createDamageEffect({
        multipleTargets: false,
        piercing: true,
    });

    await effect.runEffect({match: effect.match});

    assert.equal(target.damage, 0);
    assert.equal(target.isTough, false);
    assert.equal(toughRemoved(), 1);
});

test('a piercing attack does not discard Tough when all damage is prevented', async () => {
    const {effect, target, toughRemoved} = createDamageEffect({
        isAttack: true,
        multipleTargets: false,
        piercing: true,
    });
    effect.preventDamage = effect.damage;

    assert.equal(await effect.triggerWould({match: effect.match}), false);
    assert.equal(target.damage, 0);
    assert.equal(target.isTough, true);
    assert.equal(toughRemoved(), 0);
});
