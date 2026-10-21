import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    EFFECT_DEFEAT,
    PRIORITY_CONSTANT,
    PRIORITY_RESPONSE,
    TARGET_YOU,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_MOVE_DAMAGE,
    TRIGGER_PLACE_DAMAGE,
    TRIGGER_REMOVE_DAMAGE,
} from 'mc-shared';
import {MoveDamageEffect} from '../../src/effects/move-damage-effect.js';

test('moves damage atomically and shares placement, removal, and move trigger windows', async () => {
    const hero = {
        damage: 2,
        removeDamage(damage) {
            this.damage = Math.max(0, this.damage - damage);
        },
        refresh() {},
    };
    const destination = {
        damage: 0,
        placeDamage(damage) {
            this.damage += damage;
        },
        refresh() {},
        getLife() {
            return 10 - this.damage;
        },
    };
    const relatedTriggers = [
        TRIGGER_PLACE_DAMAGE,
        TRIGGER_REMOVE_DAMAGE,
        TRIGGER_MOVE_DAMAGE,
    ];
    const windows = [];
    const wouldWindows = [];
    const effect = new MoveDamageEffect({
        damage: 2,
        fromTarget: TARGET_YOU,
        match: {triggerCards: {}},
        selectedTarget: destination,
    });

    effect.trigger = async (priority, types, params) => {
        if (types.includes(TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE)) {
            wouldWindows.push({
                destinationDamage: destination.damage,
                priority,
                selectedTarget: params.effect.selectedTarget,
                sourceDamage: hero.damage,
                sourceTarget: params.effect.sourceTarget,
                types,
            });
        }

        if (types.includes(TRIGGER_MOVE_DAMAGE)) {
            windows.push({
                destinationDamage: destination.damage,
                priority,
                selectedTarget: params.effect.selectedTarget,
                sourceDamage: hero.damage,
                sourceTarget: params.effect.sourceTarget,
                types,
            });
        }

        return true;
    };

    await effect.runEffect({
        match: effect.match,
        player: {superhero: hero},
    });

    assert.equal(hero.damage, 0);
    assert.equal(destination.damage, 2);
    assert.ok(wouldWindows.some(window =>
        window.priority === PRIORITY_CONSTANT &&
        window.sourceDamage === 2 &&
        window.destinationDamage === 0 &&
        window.types.includes(TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE)
    ));
    assert.ok(windows.some(window =>
        window.sourceDamage === 2 &&
        window.destinationDamage === 0
    ));
    assert.ok(windows.some(window =>
        window.priority === PRIORITY_RESPONSE &&
        window.sourceDamage === 0 &&
        window.destinationDamage === 2
    ));
    assert.ok(windows.every(window =>
        relatedTriggers.every(trigger => window.types.includes(trigger))
    ));
    assert.ok(windows.some(window =>
        window.priority === PRIORITY_RESPONSE &&
        window.types.includes(TRIGGER_ATTACHED_TAKES_DAMAGE) &&
        window.types.includes(TRIGGER_CHARACTER_TAKES_DAMAGE)
    ));
    assert.ok(wouldWindows.every(window =>
        window.selectedTarget === destination &&
        window.sourceTarget === hero
    ));
    assert.ok(windows.every(window =>
        window.selectedTarget === destination &&
        window.sourceTarget === hero
    ));
});

test('moving damage defeats a character only after both ends of the move are updated', async () => {
    const hero = {
        damage: 1,
        removeDamage(damage) {
            this.damage = Math.max(0, this.damage - damage);
        },
        refresh() {},
    };
    const destination = {
        damage: 1,
        placeDamage(damage) {
            this.damage += damage;
        },
        refresh() {},
        getLife() {
            return 2 - this.damage;
        },
    };
    let defeated = false;
    const match = {
        effectsFactory: {
            createEffect({selectedTarget, type}) {
                assert.equal(type, EFFECT_DEFEAT);
                assert.equal(selectedTarget, destination);
                return {
                    defeated: false,
                    async runEffect() {
                        assert.equal(hero.damage, 0);
                        assert.equal(destination.damage, 2);
                        this.defeated = true;
                        defeated = true;
                    },
                };
            },
        },
        triggerCards: {},
    };
    const effect = new MoveDamageEffect({
        damage: 1,
        fromTarget: TARGET_YOU,
        match,
        selectedTarget: destination,
    });

    effect.trigger = async () => true;

    await effect.runEffect({
        match,
        player: {superhero: hero},
    });

    assert.equal(defeated, true);
    assert.equal(effect.defeated, true);
});

test('damage prevention reduces both the damage placed and removed during a move', async () => {
    const hero = {
        damage: 2,
        removeDamage(damage) {
            this.damage = Math.max(0, this.damage - damage);
        },
        refresh() {},
    };
    const destination = {
        damage: 0,
        placeDamage(damage) {
            this.damage += damage;
        },
        refresh() {},
        getLife() {
            return 10 - this.damage;
        },
    };
    const effect = new MoveDamageEffect({
        damage: 2,
        fromTarget: TARGET_YOU,
        match: {triggerCards: {}},
        selectedTarget: destination,
    });

    effect.trigger = async (_priority, types, params) => {
        if (types.includes(TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE)) {
            params.effect.preventDamage = 1;
        }

        return true;
    };

    await effect.runEffect({
        match: effect.match,
        player: {superhero: hero},
    });

    assert.equal(hero.damage, 1);
    assert.equal(destination.damage, 1);
    assert.equal(effect.takenDamage, 1);
});

test('tough status prevents damage from moving while removing the status', async () => {
    const hero = {
        damage: 1,
        removeDamage(damage) {
            this.damage = Math.max(0, this.damage - damage);
        },
    };
    const destination = {
        damage: 0,
        isTough: true,
        placeDamage(damage) {
            this.damage += damage;
        },
        removeTough() {
            this.isTough = false;
        },
        refresh() {},
        getLife() {
            return 10 - this.damage;
        },
    };
    const effect = new MoveDamageEffect({
        damage: 1,
        fromTarget: TARGET_YOU,
        match: {triggerCards: {}},
        selectedTarget: destination,
    });

    effect.trigger = async () => true;

    await effect.runEffect({
        match: effect.match,
        player: {superhero: hero},
    });

    assert.equal(hero.damage, 1);
    assert.equal(destination.damage, 0);
    assert.equal(destination.isTough, false);
});
