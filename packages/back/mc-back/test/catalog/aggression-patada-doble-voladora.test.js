import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DRAW_CARD,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    LABEL_ATTACK,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TARGET_YOU,
    TRAIT_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DoIfHasPaidEffect} from '../../src/effects/do-if-has-paid-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';

test('Patada doble voladora is included in Hulk precon and compiles its effects', async () => {
    const {aspects, heroes} = await loadCatalog();
    const cardConfig = aspects.find(({_id}) =>
        _id === 'aggression-patada-doble-voladora');
    const hulk = heroes.find(({_id}) => _id === 'hulk');

    assert.ok(cardConfig);
    assert.ok(hulk);

    const preconCard = hulk.config.precon
        .find(({aspect}) => aspect === 'aggression')
        .cardRefs.find(({id}) => id === cardConfig._id);
    assert.equal(preconCard.count, 3);

    const {card} = cardConfig;
    assert.equal(card.type, CARD_TYPE_EVENT);
    assert.equal(card.params.name, 'Patada doble voladora');
    assert.equal(card.params.image, 'aspect/aggression/events/10014.png');
    assert.deepEqual(card.params.traits, [TRAIT_ATTACK]);
    assert.equal(card.params.cost, 3);
    assert.deepEqual(card.params.resources, [RESOURCE_PHYSICAL]);

    const abilityConfig = card.params.abilities[0];
    assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
    assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
    assert.equal(abilityConfig.params.effect.type, EFFECT_CHAINED);
    assert.equal(
        abilityConfig.params.effect.params.effects[1].type,
        EFFECT_DO_IF_HAS_PAID
    );
    assert.equal(
        abilityConfig.params.effect.params.effects[1].params.effect.type,
        EFFECT_SIMULTANEOUS
    );

    const matchFactory = new MatchFactory({triggerCards: {}});
    const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(
        card,
        {owner: {}}
    );
    const [ability] = gameCard.abilities;
    const effect = ability.effect;
    const [damage, conditionalEffect] = effect.effects;

    assert.ok(effect instanceof ChainedEffect);
    assert.equal(typeof effect.canRun, 'function');
    assert.equal(effect.target, TARGET_ENEMY);
    assert.equal(damage.effectType, EFFECT_DEAL_DAMAGE);
    assert.equal(damage.baseDamage, 4);
    assert.equal(damage.target, TARGET_ENEMY);
    assert.ok(conditionalEffect instanceof DoIfHasPaidEffect);
    assert.equal(conditionalEffect.target, TARGET_ENEMY);
    assert.deepEqual(conditionalEffect.resources, [RESOURCE_PHYSICAL]);
    assert.equal(conditionalEffect.exclusive, true);
    assert.ok(conditionalEffect.effect instanceof SimultaneousEffect);
    assert.deepEqual(
        conditionalEffect.effect.effects.map(({effectType}) => effectType),
        [EFFECT_STUN, EFFECT_DRAW_CARD]
    );
    assert.equal(conditionalEffect.effect.effects[0].target, TARGET_ENEMY);
    assert.equal(conditionalEffect.effect.effects[1].target, TARGET_YOU);

    assert.equal(conditionalEffect.checkCondition({
        playCardEffect: {
            resourcesPaid: [
                RESOURCE_PHYSICAL,
                RESOURCE_PHYSICAL,
                RESOURCE_PHYSICAL,
            ],
        },
    }), true);
    assert.equal(conditionalEffect.checkCondition({
        playCardEffect: {
            resourcesPaid: [
                RESOURCE_PHYSICAL,
                RESOURCE_MENTAL,
                RESOURCE_PHYSICAL,
            ],
        },
    }), false);

    const selectedEnemy = {id: 'selected-enemy'};
    effect.selectedTarget = selectedEnemy;
    await effect.prepare({player: {}});
    await conditionalEffect.prepare({player: {}});
    await conditionalEffect.effect.prepare({player: {}});

    assert.strictEqual(damage.selectedTarget, selectedEnemy);
    assert.strictEqual(conditionalEffect.selectedTarget, selectedEnemy);
    assert.strictEqual(conditionalEffect.effect.selectedTarget, selectedEnemy);
    assert.strictEqual(
        conditionalEffect.effect.effects[0].selectedTarget,
        selectedEnemy
    );
});
