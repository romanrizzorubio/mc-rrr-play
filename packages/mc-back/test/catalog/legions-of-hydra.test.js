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
    PLACE_SCENARIO_ZONE,
    PRIORITY_FORCED_RESPONSE,
    TARGET_ENGAGED,
    TRAIT_HYDRA,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';
import legionsOfHydra from '../../../mc-data/seed/catalog/sets/legions-of-hydra.js';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {Attack} from '../../src/activations/attack.js';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {WhenDefeatedAbility} from '../../src/abilities/when/when-defeated-ability.js';
import {CannotTargetEffect} from '../../src/effects/cannot-target-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
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

test('Madame Hydra can place threat on Legions of Hydra after she attacks', async () => {
    const outOfPlayLegions = {name: 'Legiones de Hydra'};
    const legions = {
        name: 'Legiones de Hydra',
        threat: 0,
        placeThreat(threat) {
            this.threat += threat;
        },
        async refresh() {},
    };
    const match = {
        triggerCards: {discardedLegions: outOfPlayLegions},
        schemes: [legions],
        characters: [],
        villain: {name: 'Rino'},
        scenario: {
            gameZone: {cards: [legions]},
            deck: {
                cards: [outOfPlayLegions],
                discardPile: [outOfPlayLegions],
            },
        },
        searchCards(condition) {
            return condition.name === legions.name ? [legions] : [];
        },
    };
    const cardConfig = legionsOfHydra.config.cards.find(({card}) =>
        card.params.name === 'Madame Hydra').card;
    const cardsFactory = new CardsFactory({match});
    const madameHydra = cardsFactory.createGameCard({
        card: cardsFactory.createCard(cardConfig),
        owner: {},
    });
    const afterAttack = madameHydra.abilities[2];
    const triggerParams = {
        card: madameHydra,
        effect: {isAttack: true},
        player: {},
    };

    assert.deepEqual(afterAttack.effect.locations, [PLACE_SCENARIO_ZONE]);
    assert.deepEqual(afterAttack.effect.getValidTarget({player: {}}), [legions]);

    await madameHydra.initTriggers();
    const [attackTrigger] = madameHydra.triggers[TRIGGER_THIS_ATTACK][PRIORITY_FORCED_RESPONSE];

    assert.equal(await attackTrigger.canTrigger(triggerParams), true);

    afterAttack.effect.trigger = async () => true;
    await attackTrigger.runTrigger(triggerParams);
    assert.equal(legions.threat, 2);
});

test('retaliation cannot damage Madame Hydra while Legions of Hydra is in play', async () => {
    const plan = {name: 'Legiones de Hydra'};
    let planInPlay = true;
    let retaliationResolved = 0;
    const match = {
        enemies: [],
        searchCard(condition) {
            return planInPlay && condition.name === plan.name ? plan : undefined;
        },
        effectsFactory: {
            createEffect(params) {
                const effect = new DealDamageEffect({...params, match});
                effect.runEffect = async () => {
                    retaliationResolved++;
                };

                return effect;
            },
        },
    };
    const cardConfig = legionsOfHydra.config.cards.find(({card}) =>
        card.params.name === 'Madame Hydra').card;
    const cardsFactory = new CardsFactory({match});
    const madameHydra = cardsFactory.createGameCard({
        card: cardsFactory.createCard(cardConfig),
        owner: {},
    });
    const retaliatingCharacter = {
        card: {retaliate: 1},
        isEnemy: false,
        isInPlay: true,
        async getLife() {
            return 3;
        },
    };
    const attack = new Attack({
        effect: {
            character: madameHydra,
            match,
            ranged: false,
            selectedTarget: retaliatingCharacter,
        },
    });

    const [retaliateTrigger] = attack.getForcedResponseTriggers([TRIGGER_THIS_ATTACK]);
    const triggerParams = {player: {}};

    assert.equal(await retaliateTrigger.canTrigger(triggerParams), false);
    assert.equal(retaliationResolved, 0);

    planInPlay = false;
    assert.equal(await retaliateTrigger.canTrigger(triggerParams), true);
    await retaliateTrigger.runTrigger(triggerParams);
    assert.equal(retaliationResolved, 1);
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
