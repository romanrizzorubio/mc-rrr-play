import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_YOU} from 'mc-shared';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {HealEffect} from '../../src/effects/heal-effect.js';
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

test('healing the source of an attack does not start a separate attack', async () => {
    const hero = {
        damage: 1,
    };
    const effect = new MoveDamageEffect({
        ability: {isAttack: true},
        activation: {},
        damage: 1,
        fromTarget: TARGET_YOU,
        match: {},
        selectedTarget: {},
    });
    effect.damage = 1;

    const originalHealRunEffect = HealEffect.prototype.runEffect;
    const originalDamageCanRun = DealDamageEffect.prototype.canRun;
    const originalDamageRunEffect = DealDamageEffect.prototype.runEffect;
    let healIsAttack;

    HealEffect.prototype.runEffect = async function() {
        healIsAttack = this.isAttack;
    };
    DealDamageEffect.prototype.canRun = async () => true;
    DealDamageEffect.prototype.runEffect = async () => {};

    try {
        await effect.execute({
            player: {
                superhero: hero,
            },
        });
    } finally {
        HealEffect.prototype.runEffect = originalHealRunEffect;
        DealDamageEffect.prototype.canRun = originalDamageCanRun;
        DealDamageEffect.prototype.runEffect = originalDamageRunEffect;
    }

    assert.equal(effect.isAttack, true);
    assert.equal(healIsAttack, false);
});
