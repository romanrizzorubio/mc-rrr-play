import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CALC_ATTACK,
    EFFECT_TAKE_DAMAGE,
    PRIORITY_CONSTANT,
    TRIGGER_YOUR_HERO_GET_ATTACK,
} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {ModifyAttackValueEffect} from '../../src/effects/modify-attack-value-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';

test('DealDamageEffect resolves attack damage through Calc and the character', async () => {
    const player = {
        isPlayer: true,
        superhero: {},
    };
    const character = Object.create(CharacterGameCard.prototype);

    Object.defineProperty(character, 'attack', {value: 2});
    player.superhero.currentSide = character;

    const triggerCard = {
        id: 'attack-bonus',
        owner: player,
        triggers: {},
    };
    const attackBonus = {
        ability: {hideDialog: true},
        card: triggerCard,
        canTrigger: async () => true,
        name: 'Attack bonus',
        async runTrigger({effect}) {
            effect.modifyAttack += 2;
        },
    };
    triggerCard.triggers[TRIGGER_YOUR_HERO_GET_ATTACK] = {
        [PRIORITY_CONSTANT]: [attackBonus],
    };
    const match = {
        activationsFactory: {
            createActivation: () => ({
                getOverkill: () => false,
            }),
        },
        triggerCards: {
            [triggerCard.id]: triggerCard,
        },
    };
    Object.defineProperty(character, 'match', {value: match});

    const effect = new DealDamageEffect({
        match,
        paramsCalc: {
            formula: CALC_ATTACK,
            plus: 1,
            target: 'player.superhero.currentSide',
        },
    });
    effect.triggerWould = async () => false;

    await effect.runEffect({player});

    assert.equal(effect.damage, 5);
});

test('recalculates a basic attack with modifiers before applying overkill and damage', async () => {
    const minion = {
        isMinion: true,
        async getLife() {
            return 5;
        },
    };
    const villain = {id: 'villain'};
    let dealDamage;
    const ability = {
        isBasic: true,
        async getAttackValue() {
            assert.equal(effect.modifyAttack, 3);
            return 4;
        },
    };
    const match = {
        villain,
        effectsFactory: {
            createEffect({type, selectedTarget, damage}) {
                assert.equal(type, EFFECT_TAKE_DAMAGE);
                dealDamage = {selectedTarget, damage};

                return {
                    takenDamage: damage,
                    async runEffect() {},
                };
            },
        },
    };
    const effect = new DealDamageEffect({
        ability,
        damage: 4,
        isAttack: true,
        keywords: {overkill: true},
        match,
        selectedTarget: minion,
    });
    effect.damageModifier = 1;
    const attack = new Attack({effect});
    effect.activation = attack;
    const modifyAttack = new ModifyAttackValueEffect({
        count: 3,
        match,
        selectedTarget: effect,
    });

    await modifyAttack.execute({});
    await effect.execute({});

    assert.deepEqual(effect.damage, [8, 3]);
    assert.deepEqual(dealDamage, {
        selectedTarget: [minion, villain],
        damage: [8, 3],
    });
    assert.deepEqual(effect.takenDamage, [8, 3]);
});

test('DealDamageEffect carries attack context into TakeDamageEffect', async () => {
    let takeDamageEffect;
    const match = {
        effectsFactory: {
            createEffect({type, ...params}) {
                assert.equal(type, EFFECT_TAKE_DAMAGE);
                takeDamageEffect = new TakeDamageEffect({...params, match});
                takeDamageEffect.runEffect = async () => {};

                return takeDamageEffect;
            },
        },
    };
    const effect = new DealDamageEffect({
        activation: {},
        ignoreTough: true,
        isAttack: true,
        keywords: {piercing: true},
        match,
    });
    effect.damage = 2;
    effect.selectedTarget = {};

    await effect.execute({});

    assert.equal(takeDamageEffect.isAttack, true);
    assert.equal(takeDamageEffect.ignoreTough, true);
    assert.equal(takeDamageEffect.piercing, true);
});
