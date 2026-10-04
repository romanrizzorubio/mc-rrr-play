import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_YOU} from 'mc-shared';
import {MoveDamageEffect} from '../../src/effects/move-damage-effect.js';

test('heals the hero card when moving damage from TARGET_YOU', async () => {
    const calls = {
        damage: 0,
        heroRefresh: 0,
        playerRefresh: 0,
    };
    const hero = {
        damage: 2,
        healDamage(damage) {
            this.damage -= damage;
        },
        refresh() {
            calls.heroRefresh++;
        },
    };
    const player = {
        superhero: hero,
        get damage() {
            return hero.damage;
        },
        refresh() {
            calls.playerRefresh++;
        },
    };
    const match = {
        effectsFactory: {
            createEffect: () => ({
                runEffect: async () => {
                    calls.damage++;
                },
            }),
        },
        triggerCards: {},
    };
    const effect = new MoveDamageEffect({
        damage: 2,
        fromTarget: TARGET_YOU,
        match,
        selectedTarget: {},
    });
    effect.damage = 2;

    await effect.execute({player});

    assert.equal(hero.damage, 0);
    assert.equal(calls.heroRefresh, 1);
    assert.equal(calls.playerRefresh, 0);
    assert.equal(calls.damage, 1);
});
