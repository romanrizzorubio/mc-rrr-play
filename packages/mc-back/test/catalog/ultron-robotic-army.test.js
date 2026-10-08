import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_WHEN_REVEALED,
    EFFECT_CHAINED,
    TARGET_EFFECT,
    TARGET_YOUR_HERO,
    TRAIT_DRONE,
} from 'mc-shared';
import ultron from '../../../mc-data/seed/catalog/scenarios/ultron.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {SeveralAttacksEffect} from '../../src/effects/several-attacks-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Ejército robótico attacks engaged drones only in hero form', async () => {
    const entry = ultron.config.cards.find(({card}) =>
        card.params.name === 'Ejército robótico');
    assert.ok(entry);

    const [whenRevealed] = entry.card.params.abilities.filter(({type}) =>
        type === ABILITY_WHEN_REVEALED);
    assert.ok(whenRevealed);
    assert.equal(whenRevealed.params.effect.type, EFFECT_CHAINED);

    const factory = new CardsFactory({match: {}});
    const gameCard = factory.createGameCard({
        card: factory.createCard(entry.card),
        owner: {},
    });
    const [ability] = gameCard.abilities;
    const effect = ability.effect;

    assert.ok(effect instanceof ChainedEffect);

    const [attacks, fallback] = effect.effects;
    assert.ok(attacks instanceof SeveralAttacksEffect);
    assert.equal(attacks.target, TARGET_YOUR_HERO);
    assert.deepEqual(attacks.enemiesCondition, {traits: TRAIT_DRONE});
    assert.ok(fallback instanceof DoIfEffect);
    assert.equal(fallback.target, TARGET_EFFECT);
    assert.deepEqual(fallback.condition, {'effects.0.attacks.length': 0});

    const resolutions = [];
    attacks.runEffect = async () => {
        attacks.attacks.push({});
        resolutions.push('attack');
    };
    fallback.runEffect = async params => fallback.execute(params);
    fallback.effect.runEffect = async () => resolutions.push('drone');

    const alterEgo = {
        isHero: false,
        minions: [{traits: [TRAIT_DRONE]}],
        superhero: {currentSide: {isAlterEgo: true}},
    };
    await effect.execute({effect, player: alterEgo});

    assert.deepEqual(resolutions, ['drone']);
    assert.deepEqual(attacks.attacks, []);

    resolutions.length = 0;
    const hero = {
        isHero: true,
        minions: [{traits: [TRAIT_DRONE]}],
        superhero: {currentSide: {isHero: true}},
    };
    await effect.execute({effect, player: hero});

    assert.deepEqual(resolutions, ['attack']);
});
