import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    EFFECT_DEFEAT,
    EFFECT_DEAL_DAMAGE,
    EFFECT_PLACE_DAMAGE,
    EFFECT_TAKE_DAMAGE,
    PRIORITY_RESPONSE,
    TARGET_YOU,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_YOU_DEAL_DAMAGE,
    TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {AssignDamageEffect} from '../../src/effects/assign-damage-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MoveDamageEffect} from '../../src/effects/move-damage-effect.js';
import {PlaceDamageEffect} from '../../src/effects/place-damage-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {RetaliateTrigger} from '../../src/triggers/retaliate-trigger.js';
import {
    YouDealtExcessDamageTrigger,
} from '../../src/triggers/you-dealt-excess-damage-trigger.js';

describe('excess damage sources', () => {
    test('moving damage preserves excess eligibility after defeating its destination', async () => {
        const player = {isPlayer: true};
        const hero = {
            controller: player,
            damage: 2,
            owner: player,
            removeDamage(damage) {
                this.damage = Math.max(0, this.damage - damage);
            },
            refresh() {},
        };
        player.superhero = hero;
        const enemy = {
            controller: {},
            damage: 1,
            isMinion: true,
            isEnemy: true,
            name: 'Esbirro',
            placeDamage(damage) {
                this.damage += damage;
            },
            refresh() {},
            getLife() {
                return 2 - this.damage;
            },
        };
        const match = {
            enemies: [enemy],
            effectsFactory: {
                createEffect({selectedTarget, type}) {
                    assert.equal(type, EFFECT_DEFEAT);
                    assert.equal(selectedTarget, enemy);

                    return {
                        defeated: false,
                        async runEffect() {
                            this.defeated = true;
                            enemy.isMinion = false;
                        },
                    };
                },
            },
            triggerCards: {},
        };
        const effect = new MoveDamageEffect({
            ability: {card: hero},
            damage: 2,
            fromTarget: TARGET_YOU,
            match,
            selectedTarget: enemy,
        });
        let excessDamageParams;

        effect.trigger = async (priority, types, params) => {
            if (priority === PRIORITY_RESPONSE &&
                types.includes(TRIGGER_YOU_DEALT_EXCESS_DAMAGE)) {
                excessDamageParams = {params, types};
            }

            return true;
        };

        await effect.runEffect({match, player, superhero: hero});

        assert.equal(hero.damage, 0);
        assert.equal(enemy.damage, 3);
        assert.equal(effect.excessDamage, 1);
        assert.ok(excessDamageParams);
        assert.ok(excessDamageParams.types.includes(TRIGGER_CHARACTER_TAKES_DAMAGE));
        assert.ok(excessDamageParams.types.includes(TRIGGER_YOU_DEAL_DAMAGE));

        const response = new YouDealtExcessDamageTrigger({
            card: {controller: player, owner: player},
            trigger: TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
        });

        assert.equal(await response.canTrigger(excessDamageParams.params), true);
        assert.equal(response.getTarget(excessDamageParams.params), enemy);
    });

    test('indirect damage keeps the source ability and character', async () => {
        const player = {isPlayer: true};
        const character = {owner: player};
        const ability = {
            card: {controller: player, owner: player},
            character,
        };
        const target = {
            async getEffectiveStats() {
                return {hitPoints: 4, life: 4};
            },
        };
        let takeDamageParams;
        const match = {
            effectsFactory: {
                createEffect({type, ...params}) {
                    assert.equal(type, EFFECT_TAKE_DAMAGE);
                    takeDamageParams = params;

                    return {
                        defeated: false,
                        takenDamage: params.damage,
                        async runEffect() {},
                    };
                },
            },
            triggerCards: {},
        };
        const effect = new AssignDamageEffect({
            ability,
            damage: 1,
            match,
            selectedTarget: [target],
        });

        await effect.execute({match, player});

        assert.equal(takeDamageParams.ability, ability);
        assert.equal(takeDamageParams.character, character);
    });

    test('retaliation damage is attributed to the character with Retaliate', async () => {
        const player = {isPlayer: true};
        const enemyController = {};
        const enemy = {
            controller: enemyController,
            damage: 0,
            isEnemy: true,
            isMinion: true,
            name: 'Esbirro',
            placeDamage(damage) {
                this.damage += damage;
            },
            refresh() {},
            async getLife() {
                return 1 - this.damage;
            },
        };
        const hero = {
            card: {retaliate: 2},
            controller: player,
            isInPlay: true,
            owner: player,
            async getLife() {
                return 4;
            },
        };
        let retaliationParams;
        let excessDamageParams;
        const match = {
            enemies: [enemy],
            triggerCards: {},
            effectsFactory: {
                createEffect({type, ...params}) {
                    if (type === EFFECT_DEAL_DAMAGE) {
                        retaliationParams = params;
                        const effect = new DealDamageEffect({
                            ...params,
                            match,
                        });
                        effect.trigger = async () => true;

                        return effect;
                    }

                    if (type === EFFECT_TAKE_DAMAGE) {
                        const effect = new TakeDamageEffect({
                            ...params,
                            match,
                        });
                        effect.trigger = async (priority, types, triggerParams) => {
                            if (priority === PRIORITY_RESPONSE &&
                                types.includes(TRIGGER_YOU_DEALT_EXCESS_DAMAGE)) {
                                excessDamageParams = {effect, params: triggerParams, types};
                            }

                            return true;
                        };

                        return effect;
                    }

                    if (type === EFFECT_PLACE_DAMAGE) {
                        return new PlaceDamageEffect({...params, match});
                    }

                    assert.equal(type, EFFECT_DEFEAT);

                    return {
                        defeated: false,
                        async runEffect() {
                            this.defeated = true;
                        },
                    };
                },
            },
        };
        const attack = new Attack({
            effect: {
                ability: {card: enemy},
                character: enemy,
                match,
                ranged: false,
            },
        });
        const retaliation = new RetaliateTrigger(attack, hero);

        await retaliation.runTrigger({match, player});

        assert.equal(retaliationParams.character, hero);
        assert.equal(retaliationParams.ability.card, hero);
        assert.ok(excessDamageParams);
        assert.equal(excessDamageParams.effect.excessDamage, 1);
        assert.ok(excessDamageParams.types.includes(TRIGGER_CHARACTER_TAKES_DAMAGE));

        const response = new YouDealtExcessDamageTrigger({
            card: {controller: player, owner: player},
            trigger: TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
        });

        assert.equal(await response.canTrigger(excessDamageParams.params), true);
        assert.equal(response.getTarget(excessDamageParams.params), enemy);
    });
});
