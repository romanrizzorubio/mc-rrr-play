import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_UPGRADE,
    EFFECT_CATEGORY_DAMAGE,
    TARGET_ALL_ENEMIES,
    TARGET_CARD,
    TARGET_YOU,
    TRAIT_BLACK_PANTHER,
} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import legionsOfHydra from '../../../mc-data/seed/catalog/sets/legions-of-hydra.js';
import {AssignDamageEffect} from '../../src/effects/assign-damage-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {MoveDamageEffect} from '../../src/effects/move-damage-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Madame Hydra is excluded from damage targets only while Legions of Hydra is in play', () => {
    const plan = {name: 'Legiones de Hydra'};
    let planInPlay = true;
    const match = {
        enemies: [],
        searchCard(condition) {
            return planInPlay && condition.name === plan.name ? plan : undefined;
        },
    };
    const cardConfig = legionsOfHydra.config.cards.find(({card}) =>
        card.params.name === 'Madame Hydra').card;
    const cardsFactory = new CardsFactory({match});
    const madameHydra = cardsFactory.createGameCard({
        card: cardsFactory.createCard(cardConfig),
        owner: {},
    });
    const anotherEnemy = {abilities: [], id: 'another-enemy'};
    const params = {player: {superhero: {damage: 2}}};
    const damageEffects = [
        new DealDamageEffect({damage: 2, match, target: TARGET_ALL_ENEMIES}),
        new MoveDamageEffect({
            damage: 2,
            fromTarget: TARGET_YOU,
            match,
            target: TARGET_ALL_ENEMIES,
        }),
        new TakeDamageEffect({damage: 2, match, target: TARGET_ALL_ENEMIES}),
        new AssignDamageEffect({damage: 2, match, target: TARGET_ALL_ENEMIES}),
    ];
    assert.ok(damageEffects.every(effect =>
        effect.effectCategories.includes(EFFECT_CATEGORY_DAMAGE)));
    match.enemies = [madameHydra, anotherEnemy];

    for (const effect of damageEffects) {
        assert.deepEqual(effect.getValidTarget(params), [anotherEnemy]);
    }
    const nonDamageEffect = new Effect({match, target: TARGET_ALL_ENEMIES});
    assert.deepEqual(nonDamageEffect.getValidTarget(params), [madameHydra, anotherEnemy]);

    const preselectedTargetsDamage = new AssignDamageEffect({
        damage: 2,
        match,
        selectedTarget: [madameHydra, anotherEnemy],
        target: TARGET_ALL_ENEMIES,
    });
    assert.deepEqual(preselectedTargetsDamage.getValidTarget(params), [[anotherEnemy]]);
    assert.deepEqual(preselectedTargetsDamage.selectedTarget, [anotherEnemy]);

    const preselectedDamage = new DealDamageEffect({
        damage: 2,
        match,
        selectedTarget: madameHydra,
        target: TARGET_CARD,
    });
    assert.deepEqual(preselectedDamage.getValidTarget(params), []);

    planInPlay = false;
    for (const effect of damageEffects) {
        assert.deepEqual(effect.getValidTarget(params), [madameHydra, anotherEnemy]);
    }
    const newlyValidPreselectedTargetsDamage = new AssignDamageEffect({
        damage: 2,
        match,
        selectedTarget: [madameHydra, anotherEnemy],
        target: TARGET_ALL_ENEMIES,
    });
    assert.deepEqual(newlyValidPreselectedTargetsDamage.getValidTarget(params), [[madameHydra, anotherEnemy]]);
    assert.deepEqual(preselectedDamage.getValidTarget(params), [madameHydra]);
});

test('MoveDamageEffect does not heal its source if the destination cannot take damage', async () => {
    const plan = {name: 'Legiones de Hydra'};
    const match = {
        searchCard(condition) {
            return condition.name === plan.name ? plan : undefined;
        },
    };
    const cardConfig = legionsOfHydra.config.cards.find(({card}) =>
        card.params.name === 'Madame Hydra').card;
    const cardsFactory = new CardsFactory({match});
    const madameHydra = cardsFactory.createGameCard({
        card: cardsFactory.createCard(cardConfig),
        owner: {},
    });
    const source = {
        damage: 1,
        healDamage(damage) {
            this.damage -= damage;
        },
    };
    const moveDamage = new MoveDamageEffect({
        damage: 1,
        fromTarget: TARGET_YOU,
        match,
        selectedTarget: madameHydra,
    });
    moveDamage.damage = 1;

    await moveDamage.execute({player: {superhero: source}});

    assert.equal(source.damage, 1);
    assert.equal(madameHydra.damage, 0);
});

test('Killmonger cannot be targeted by damage from Black Panther upgrades', () => {
    const match = {enemies: []};
    const cardConfig = blackPanther.config.nemesis.find(({card}) =>
        card.params.name === 'Killmonger').card;
    const cardsFactory = new CardsFactory({match});
    const killmonger = cardsFactory.createGameCard({
        card: cardsFactory.createCard(cardConfig),
        owner: {},
    });
    const anotherEnemy = {abilities: [], id: 'another-enemy'};
    match.enemies = [killmonger, anotherEnemy];

    const blackPantherUpgradeDamage = new DealDamageEffect({
        damage: 2,
        match,
        source: {
            traits: [TRAIT_BLACK_PANTHER],
            type: CARD_TYPE_UPGRADE,
        },
        target: TARGET_ALL_ENEMIES,
    });
    const otherDamage = new DealDamageEffect({
        damage: 2,
        match,
        source: {type: CARD_TYPE_UPGRADE, traits: []},
        target: TARGET_ALL_ENEMIES,
    });

    assert.deepEqual(blackPantherUpgradeDamage.getValidTarget({player: {}}), [anotherEnemy]);
    assert.deepEqual(otherDamage.getValidTarget({player: {}}), [killmonger, anotherEnemy]);

    const daggersConfig = blackPanther.config.cards.find(({card}) =>
        card.params.name === 'Dagas de energía').card;
    const daggers = cardsFactory.createGameCard({
        card: cardsFactory.createCard(daggersConfig),
        owner: {},
    });
    const daggersDamage = daggers.abilities[0].effect.effects[1];
    const player = {minions: [killmonger, anotherEnemy]};

    assert.deepEqual(daggersDamage.getValidTarget({player}), [anotherEnemy]);
});
