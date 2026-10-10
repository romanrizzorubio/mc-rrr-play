import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CALC_ATTACK,
    EFFECT_TAKE_DAMAGE,
    PRIORITY_CONSTANT,
    TRIGGER_YOUR_HERO_GET_ATTACK,
} from 'mc-shared';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
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
        isAttack: true,
        match,
    });
    effect.damage = 2;
    effect.selectedTarget = {};

    await effect.execute({});

    assert.equal(takeDamageEffect.isAttack, true);
});
