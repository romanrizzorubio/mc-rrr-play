import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_WHEN_REVEALED_HERO,
    CHARACTER_ALL_ENGAGED_MINIONS,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_ENEMY_ATTACK,
    EFFECT_SEVERAL_ATTACKS,
    TARGET_YOU,
} from 'mc-shared';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {SeveralAttacksEffect} from '../../src/effects/several-attacks-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Gang-Up activates the villain before the engaged minions', async () => {
    const entry = standard.config.cards.find(({card}) =>
        card.params.name === 'Gang-Up');
    assert.ok(entry);

    const cardConfig = entry.card;
    const abilityConfig = cardConfig.params.abilities.find(({type}) =>
        type === ABILITY_WHEN_REVEALED_HERO);
    assert.ok(abilityConfig);

    const effectConfig = abilityConfig.params.effect;
    assert.equal(effectConfig.type, EFFECT_CHAINED);
    const [villainActivation, minionActivations] = effectConfig.params.effects;
    assert.equal(villainActivation.type, EFFECT_ENEMY_ATTACK);
    assert.equal(villainActivation.params.enemyType, CHARACTER_VILLAIN);
    assert.equal(villainActivation.params.target, TARGET_YOU);
    assert.equal(minionActivations.type, EFFECT_SEVERAL_ATTACKS);
    assert.deepEqual(minionActivations.params.enemiesType, [
        CHARACTER_ALL_ENGAGED_MINIONS,
    ]);
    assert.equal(minionActivations.params.target, TARGET_YOU);

    const factory = new CardsFactory({match: {}});
    const gameCard = factory.createGameCard({
        card: factory.createCard(cardConfig),
        owner: {},
    });
    const ability = gameCard.abilities.find(({effect: parsedEffect}) =>
        parsedEffect instanceof ChainedEffect);
    assert.ok(ability);
    const effect = ability.effect;
    const activationOrder = [];

    assert.ok(effect instanceof ChainedEffect);
    assert.ok(effect.effects[0] instanceof EnemyAttackEffect);
    assert.ok(effect.effects[1] instanceof SeveralAttacksEffect);

    effect.effects.forEach((child, index) => {
        child.canRun = async () => true;
        child.runEffect = async () => {
            activationOrder.push(index);
        };
    });

    await effect.execute({player: {}});

    assert.deepEqual(activationOrder, [0, 1]);
});
