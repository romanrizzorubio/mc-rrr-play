import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_DEFEATED,
    CARD_TYPE_MINION,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CANNOT_TARGET,
    EFFECT_DEAL_ENCOUNTER,
    TARGET_ENGAGED,
    TRAIT_HYDRA,
} from 'mc-shared';
import legionsOfHydra from '../../../mc-data/seed/catalog/sets/legions-of-hydra.js';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {WhenDefeatedAbility} from '../../src/abilities/when/when-defeated-ability.js';
import {CannotTargetEffect} from '../../src/effects/cannot-target-effect.js';
import {DealEncounterEffect} from '../../src/effects/deal-encounter-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Madame Hydra uses a constant ability for her cannot-take-damage restriction', () => {
    const cardConfig = legionsOfHydra.config.cards.find(({card}) =>
        card.params.name === 'Madame Hydra').card;
    const cardAbilities = cardConfig.params.abilities;
    const factory = new CardsFactory({match: {}});
    const gameCard = factory.createGameCard({
        card: factory.createCard(cardConfig),
        owner: {},
    });
    const [cannotTakeDamage, afterScheme, afterAttack] = gameCard.abilities;

    assert.equal(cardAbilities[0].type, ABILITY_CONSTANT);
    assert.ok(cannotTakeDamage instanceof ConstantAbility);
    assert.ok(cannotTakeDamage.validation instanceof CannotTargetEffect);
    assert.deepEqual(cannotTakeDamage.validation.blockedEffectCategories, [EFFECT_CATEGORY_DAMAGE]);
    assert.deepEqual(cannotTakeDamage.validation.condition, {name: 'Legiones de Hydra'});
    assert.equal(cardAbilities[0].params.validation.type, EFFECT_CANNOT_TARGET);
    assert.equal(cannotTakeDamage.trigger, undefined);
    assert.equal(cannotTakeDamage.effect, undefined);
    assert.ok(afterScheme instanceof ForcedResponseAbility);
    assert.ok(afterAttack instanceof ForcedResponseAbility);
    assert.equal(cardAbilities[1].type, ABILITY_FORCED_RESPONSE);
    assert.equal(cardAbilities[2].type, ABILITY_FORCED_RESPONSE);
});

test('Soldado de Hydra has Guard and deals an encounter card to its engaged player when defeated', async () => {
    const encounterCard = {id: 'encounter-card'};
    const dealtCards = [];
    const engagedPlayer = {
        gameZone: {
            dealEncounterCard(cards) {
                dealtCards.push(...cards);
            },
            async refresh() {},
        },
    };
    const match = {
        async drawEncounterCards() {
            return [encounterCard];
        },
    };
    const cardEntry = legionsOfHydra.config.cards.find(({card}) =>
        card.params.name === 'Soldado de Hydra');
    const {card: cardConfig, count} = cardEntry;
    const cardsFactory = new CardsFactory({match});
    const soldier = cardsFactory.createGameCard({
        card: cardsFactory.createCard(cardConfig),
        owner: {},
    });
    soldier.engaged = engagedPlayer;
    const [whenDefeated] = soldier.abilities;
    const effect = whenDefeated.effect;

    assert.equal(count, 3);
    assert.equal(cardConfig.type, CARD_TYPE_MINION);
    assert.equal(cardConfig.params.abilities[0].type, ABILITY_WHEN_DEFEATED);
    assert.deepEqual(soldier.traits, [TRAIT_HYDRA]);
    assert.equal(soldier.guard, true);
    assert.ok(whenDefeated instanceof WhenDefeatedAbility);
    assert.equal(whenDefeated.isWhenDefeated, true);
    assert.ok(effect instanceof DealEncounterEffect);
    assert.equal(effect.effectType, EFFECT_DEAL_ENCOUNTER);
    assert.equal(effect.target, TARGET_ENGAGED);
    assert.deepEqual(effect.getValidTarget({card: soldier}), [engagedPlayer]);

    effect.selectedTarget = engagedPlayer;
    await effect.execute({});

    assert.deepEqual(dealtCards, [encounterCard]);
});
