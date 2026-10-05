import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CHANGE_ATTACK_TARGETS,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_REQUIRE_DEFENDER,
    EFFECT_SEARCH_CARDS,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_TOUGH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_HEROES,
    TARGET_CONDITION_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENGAGED,
    TARGET_INITIAL_PLAYER,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_ELITE,
    TRAIT_MASTERS_OF_EVIL,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DiscardRandomEffect} from '../../src/effects/discard-random-effect.js';
import {DiscardUntilEffect} from '../../src/effects/discard-until-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {ChangeAttackTargetsEffect} from '../../src/effects/change-attack-targets-effect.js';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {RequireDefenderEffect} from '../../src/effects/require-defender-effect.js';
import {SeveralAttacksEffect} from '../../src/effects/several-attacks-effect.js';
import {ToughEffect} from '../../src/effects/tough-effect.js';
import {BoostAbility} from '../../src/abilities/misc/boost-ability.js';
import {ForcedInterruptAbility} from '../../src/abilities/interrupt/forced-interrupt-ability.js';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Señores del mal is listed as a selectable modular set', async () => {
    const {sets} = await loadCatalog();
    const mastersOfEvil = sets.find(({_id}) => _id === 'masters-of-evil');

    assert.ok(mastersOfEvil);
    assert.equal(mastersOfEvil.config.name, 'Señores del mal');
    assert.equal(mastersOfEvil.config.standard, false);

    const [entry] = mastersOfEvil.config.cards;
    assert.equal(entry.count, 1);
    assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.equal(entry.card.params.name, 'Los Señores del Mal');
    assert.equal(entry.card.params.image, 'sets/masters-of-evil/01128.png');
    assert.equal(entry.card.params.boost, 2);
    assert.deepEqual(entry.card.params.startingThreat, [3, true]);
    assert.deepEqual(entry.card.params.icons, {acceleration: 1});

    const [whenRevealed] = entry.card.params.abilities;
    assert.equal(whenRevealed.type, ABILITY_WHEN_REVEALED);
    const effectConfig = whenRevealed.params.effect;
    assert.equal(effectConfig.type, EFFECT_CHAINED);
    const [discardUntil, engage] = effectConfig.params.effects;
    assert.equal(discardUntil.type, EFFECT_DISCARD_UNTIL);
    assert.equal(discardUntil.params.target, TARGET_ENCOUNTER_DECK);
    assert.deepEqual(discardUntil.params.condition, {
        isMinion: true,
        traits: [TRAIT_MASTERS_OF_EVIL],
    });
    assert.equal(engage.type, EFFECT_ENGAGE);
    assert.equal(engage.params.target, TARGET_INITIAL_PLAYER);

    const cardsFactory = new CardsFactory({match: {}});
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(entry.card),
        owner: {},
    });
    const [ability] = gameCard.abilities;

    assert.ok(ability.effect instanceof ChainedEffect);
    assert.ok(ability.effect.effects[0] instanceof DiscardUntilEffect);
    assert.ok(ability.effect.effects[1] instanceof EngageEffect);
    assert.equal(typeof ability.effect.canRun, 'function');

    const radioactiveManEntry = mastersOfEvil.config.cards.find(({card}) =>
        card.params.name === 'Hombre Radiactivo');
    assert.ok(radioactiveManEntry);
    assert.equal(radioactiveManEntry.count, 1);
    assert.equal(radioactiveManEntry.card.type, CARD_TYPE_MINION);
    assert.equal(radioactiveManEntry.card.params.image, 'sets/masters-of-evil/01129.png');
    assert.equal(radioactiveManEntry.card.params.unique, true);
    assert.deepEqual(radioactiveManEntry.card.params.traits, [
        TRAIT_ELITE,
        TRAIT_MASTERS_OF_EVIL,
    ]);
    assert.equal(radioactiveManEntry.card.params.boost, 0);
    assert.equal(radioactiveManEntry.card.params.attack, 1);
    assert.equal(radioactiveManEntry.card.params.scheme, 1);
    assert.equal(radioactiveManEntry.card.params.hitPoints, 7);

    const [forcedResponseConfig] = radioactiveManEntry.card.params.abilities;
    assert.equal(forcedResponseConfig.type, ABILITY_FORCED_RESPONSE);
    assert.equal(forcedResponseConfig.params.trigger, TRIGGER_THIS_ATTACK);
    assert.equal(forcedResponseConfig.params.effect.type, EFFECT_DISCARD_RANDOM);
    assert.equal(forcedResponseConfig.params.effect.params.target, TARGET_YOU);
    assert.equal(forcedResponseConfig.params.effect.params.count, 1);

    const boostAbilityConfig = radioactiveManEntry.card.params.boostAbility;
    assert.equal(boostAbilityConfig.type, ABILITY_BOOST);
    assert.equal(boostAbilityConfig.params.effect.type, EFFECT_DISCARD_RANDOM);
    assert.equal(boostAbilityConfig.params.effect.params.target, TARGET_YOU);
    assert.equal(boostAbilityConfig.params.effect.params.count, 1);

    const radioactiveMan = cardsFactory.createGameCard({
        card: cardsFactory.createCard(radioactiveManEntry.card),
        owner: {},
    });
    const [forcedResponse] = radioactiveMan.abilities;
    assert.ok(forcedResponse instanceof ForcedResponseAbility);
    assert.ok(forcedResponse.effect instanceof DiscardRandomEffect);
    assert.equal(typeof forcedResponse.effect.canRun, 'function');
    assert.ok(radioactiveMan.boostAbility instanceof BoostAbility);
    assert.ok(radioactiveMan.boostAbility.effect instanceof DiscardRandomEffect);
    assert.equal(typeof radioactiveMan.boostAbility.effect.canRun, 'function');

    const cardsByName = new Map(mastersOfEvil.config.cards.map(entry => [
        entry.card.params.name,
        entry,
    ]));
    const whirlwindEntry = cardsByName.get('Torbellino');
    assert.ok(whirlwindEntry);
    assert.equal(whirlwindEntry.count, 1);
    assert.equal(whirlwindEntry.card.type, CARD_TYPE_MINION);
    assert.equal(whirlwindEntry.card.params.image, 'sets/masters-of-evil/01130.png');
    assert.equal(whirlwindEntry.card.params.attack, 2);
    assert.equal(whirlwindEntry.card.params.scheme, 1);
    assert.equal(whirlwindEntry.card.params.hitPoints, 6);
    const [whirlwindAbilityConfig] = whirlwindEntry.card.params.abilities;
    assert.equal(whirlwindAbilityConfig.type, ABILITY_FORCED_INTERRUPT);
    assert.equal(whirlwindAbilityConfig.params.trigger, TRIGGER_THIS_ATTACK);
    assert.equal(
        whirlwindAbilityConfig.params.effect.type,
        EFFECT_CHANGE_ATTACK_TARGETS
    );
    assert.equal(
        whirlwindAbilityConfig.params.effect.params.target,
        TARGET_ALL_HEROES
    );
    assert.equal(
        whirlwindEntry.card.params.boostAbility.params.effect.type,
        EFFECT_DEAL_DAMAGE
    );
    assert.equal(
        whirlwindEntry.card.params.boostAbility.params.effect.params.target,
        TARGET_ALL_HEROES
    );
    assert.equal(
        whirlwindEntry.card.params.boostAbility.params.effect.params.damage,
        1
    );

    const whirlwind = cardsFactory.createGameCard({
        card: cardsFactory.createCard(whirlwindEntry.card),
        owner: {},
    });
    const [whirlwindAbility] = whirlwind.abilities;
    assert.ok(whirlwindAbility instanceof ForcedInterruptAbility);
    assert.ok(whirlwindAbility.effect instanceof ChangeAttackTargetsEffect);
    assert.equal(typeof whirlwindAbility.effect.canRun, 'function');

    const tigerSharkEntry = cardsByName.get('Tiburón Tigre');
    assert.ok(tigerSharkEntry);
    assert.equal(tigerSharkEntry.count, 1);
    assert.equal(tigerSharkEntry.card.type, CARD_TYPE_MINION);
    assert.equal(tigerSharkEntry.card.params.image, 'sets/masters-of-evil/01131.png');
    assert.equal(tigerSharkEntry.card.params.attack, 3);
    assert.equal(tigerSharkEntry.card.params.scheme, 1);
    assert.equal(tigerSharkEntry.card.params.hitPoints, 6);
    const [tigerSharkAbilityConfig] = tigerSharkEntry.card.params.abilities;
    assert.equal(tigerSharkAbilityConfig.type, ABILITY_FORCED_RESPONSE);
    assert.equal(tigerSharkAbilityConfig.params.effect.type, EFFECT_TOUGH);
    assert.equal(tigerSharkAbilityConfig.params.effect.params.target, TARGET_THIS);
    const tigerShark = cardsFactory.createGameCard({
        card: cardsFactory.createCard(tigerSharkEntry.card),
        owner: {},
    });
    assert.ok(tigerShark.abilities[0] instanceof ForcedResponseAbility);
    assert.ok(tigerShark.abilities[0].effect instanceof ToughEffect);

    const melterEntry = cardsByName.get('Fundidor');
    assert.ok(melterEntry);
    assert.equal(melterEntry.count, 1);
    assert.equal(melterEntry.card.type, CARD_TYPE_MINION);
    assert.equal(melterEntry.card.params.image, 'sets/masters-of-evil/01132.png');
    assert.equal(melterEntry.card.params.attack, 3);
    assert.equal(melterEntry.card.params.scheme, 1);
    assert.equal(melterEntry.card.params.hitPoints, 5);
    assert.equal(melterEntry.card.params.boostAbility.params.effect.type, EFFECT_EXHAUST);
    assert.equal(
        melterEntry.card.params.boostAbility.params.effect.params.target,
        TARGET_ALL_ALLIES_YOU_CONTROL
    );
    assert.equal(
        Object.hasOwn(
            melterEntry.card.params.boostAbility.params.effect.params,
            'multipleTarget'
        ),
        false
    );
    const [melterAbilityConfig] = melterEntry.card.params.abilities;
    assert.equal(melterAbilityConfig.type, ABILITY_FORCED_INTERRUPT);
    assert.equal(
        melterAbilityConfig.params.effect.type,
        EFFECT_REQUIRE_DEFENDER
    );
    assert.deepEqual(melterAbilityConfig.params.effect.params.condition, {
        isAlly: true,
    });
    const melter = cardsFactory.createGameCard({
        card: cardsFactory.createCard(melterEntry.card),
        owner: {},
    });
    assert.ok(melter.abilities[0] instanceof ForcedInterruptAbility);
    assert.ok(melter.abilities[0].effect instanceof RequireDefenderEffect);
    assert.ok(melter.boostAbility.effect instanceof ExhaustEffect);

    const chaosEntry = cardsByName.get('Señores del Caos');
    assert.ok(chaosEntry);
    assert.equal(chaosEntry.count, 2);
    assert.equal(chaosEntry.card.type, CARD_TYPE_TREACHERY);
    assert.equal(chaosEntry.card.params.image, 'sets/masters-of-evil/01133.png');
    assert.equal(chaosEntry.card.params.boost, 2);
    const [chaosAbilityConfig] = chaosEntry.card.params.abilities;
    assert.equal(chaosAbilityConfig.type, ABILITY_WHEN_REVEALED);
    const [attacksConfig, fallbackConfig] = chaosAbilityConfig.params.effect.params.effects;
    assert.equal(attacksConfig.type, EFFECT_SEVERAL_ATTACKS);
    assert.equal(attacksConfig.params.attackTarget, TARGET_ENGAGED);
    assert.equal(attacksConfig.params.enemiesType, TARGET_CONDITION_CARD);
    assert.deepEqual(attacksConfig.params.condition, {
        isMinion: true,
        isInPlay: true,
        traits: [TRAIT_MASTERS_OF_EVIL],
    });
    assert.equal(
        Object.hasOwn(attacksConfig.params, 'attackEachEngagedPlayer'),
        false
    );
    assert.equal(fallbackConfig.type, EFFECT_DO_IF);
    assert.deepEqual(fallbackConfig.params.condition, {
        'effects.0.attacks.length': 0,
    });
    const fallbackChain = fallbackConfig.params.effect;
    assert.equal(fallbackChain.type, EFFECT_CHAINED);
    const [searchConfig, engageConfig] = fallbackChain.params.effects;
    assert.equal(searchConfig.type, EFFECT_SEARCH_CARDS);
    assert.deepEqual(searchConfig.params.locations, [
        PLACE_ENCOUNTER_DECK_CARDS,
        PLACE_ENCOUNTER_DISCARD,
    ]);
    assert.deepEqual(searchConfig.params.filter, {
        isMinion: true,
        traits: [TRAIT_MASTERS_OF_EVIL],
    });
    assert.equal(Object.hasOwn(searchConfig.params, 'firstMatch'), false);
    assert.equal(engageConfig.type, EFFECT_ENGAGE);
    assert.equal(fallbackChain.params.thenEffect.type, EFFECT_SHUFFLE_DECK);

    const chaos = cardsFactory.createGameCard({
        card: cardsFactory.createCard(chaosEntry.card),
        owner: {},
    });
    assert.ok(chaos.abilities[0].effect instanceof ChainedEffect);
    assert.ok(chaos.abilities[0].effect.effects[0] instanceof SeveralAttacksEffect);
    assert.equal(typeof chaos.abilities[0].effect.canRun, 'function');
});
