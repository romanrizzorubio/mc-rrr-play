import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EFFECT_PLACE_DAMAGE} from 'mc-shared';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';

function createDamageEffect(ignoreTough) {
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
        match,
    });
    effect.selectedTarget = [target];

    return {effect, target, toughRemoved: () => toughRemoved};
}

test('damage that ignores Tough leaves the status and still places damage', async () => {
    const {effect, target, toughRemoved} = createDamageEffect(true);

    await effect.runEffect({match: effect.match});

    assert.equal(target.damage, 2);
    assert.equal(target.isTough, true);
    assert.equal(toughRemoved(), 0);
});

test('ordinary damage still consumes Tough and prevents damage', async () => {
    const {effect, target, toughRemoved} = createDamageEffect(false);

    await effect.runEffect({match: effect.match});

    assert.equal(target.damage, 0);
    assert.equal(target.isTough, false);
    assert.equal(toughRemoved(), 1);
});
