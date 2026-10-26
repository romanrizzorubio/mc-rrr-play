import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CALC_COUNT,
    EFFECT_CANCEL_BOOST_ABILITY,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ACTIVATION,
    EFFECT_PLACE_THREAT,
    EFFECT_REMOVE_CARD,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    LABEL_ATTACK,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    PRIORITY_RESPONSE,
    TARGET_ALTEREGO,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_ABILITY_RESOLVED,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_THIS_PLAY_CARD,
    TRIGGER_YOU_END_PLAY_CARD,
    TRAIT_PREPARATION,
} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {checkCondition} from '../../src/engine/utils.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Black Widow', () => {
test('Black Widow catalog contains the supplied hero, precon, and nemesis set', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    assert.ok(blackWidow);

    const [alterEgo, hero] = blackWidow.config.sides;
    assert.equal(alterEgo.params.name, 'Natasha Romanoff');
    assert.equal(alterEgo.params.hitPoints, 9);
    assert.equal(alterEgo.params.handSize, 6);
    assert.equal(hero.params.name, 'Viuda Negra');
    assert.equal(hero.params.hitPoints, 9);
    assert.equal(hero.params.handSize, 5);

    assert.equal(
        blackWidow.config.cards.reduce((count, entry) => count + entry.count, 0),
        15
    );
    const classificationsById = new Map(catalog.aspects.map(card => [
        card._id,
        card.classification ?? card.aspect,
    ]));
    for (const group of blackWidow.config.precon) {
        const expectedClassification = group.classification ?? group.aspect;

        for (const reference of group.cardRefs) {
            assert.equal(
                classificationsById.get(reference.id),
                expectedClassification,
                `Invalid ${expectedClassification} precon card ${reference.id}`
            );
        }
    }
    assert.equal(
        blackWidow.config.precon.reduce((total, group) =>
            total + group.cardRefs.reduce((count, ref) => count + ref.count, 0), 0),
        25
    );
    const justicePrecon = blackWidow.config.precon.find(({aspect}) =>
        aspect === 'justice');
    assert.equal(
        justicePrecon.cardRefs.find(({id}) => id === 'justice-interrogation-room').count,
        2
    );
    assert.equal(
        blackWidow.config.cards.reduce((count, entry) => count + entry.count, 0) + 25,
        40
    );

    const supervisor = blackWidow.config.nemesis.find(({card}) =>
        card.params.name === 'Supervisor');
    assert.equal(supervisor.count, 1);
    assert.equal(supervisor.card.params.nemesis, true);
    assert.equal(supervisor.card.params.boost, 0);
    assert.equal(
        supervisor.card.params.boostAbility.params.effect.type,
        EFFECT_MODIFY_ACTIVATION
    );
    assert.equal(
        supervisor.card.params.boostAbility.params.effect.params.attack,
        true
    );
    assert.equal(
        supervisor.card.params.boostAbility.params.effect.params.scheme,
        true
    );
    assert.deepEqual(
        supervisor.card.params.boostAbility.params.effect.params.paramsCalc,
        {target: 'player.upgrades', formula: CALC_COUNT}
    );
    const hiredAssassin = blackWidow.config.nemesis.find(({card}) =>
        card.params.name === 'Asesino de alquiler');
    assert.deepEqual(
        hiredAssassin.card.params.abilities[0].params.effect.params.threat,
        [1, true]
    );
    assert.equal(
        blackWidow.config.nemesis.reduce((count, entry) => count + entry.count, 0),
        5
    );
});

test('Supervisor calculates PLA from the engaged player upgrades like ATQ', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'black-widow-supervisor-scheme',
    });
    const dialogs = [];
    match.openDialog = async dialog => dialogs.push(dialog);
    const matchFactory = new MatchFactory(match);
    const players = [false, false].map((initial, index) => {
        const superhero = matchFactory.createSuperhero(blackWidow.config);
        const player = match.createPlayer({
            name: `Natasha ${index + 1}`,
            superhero,
            initial,
        });

        player.gameZone = new PlayerZone({owner: player});

        return player;
    });
    const [otherPlayer, engagedPlayer] = players;
    otherPlayer.gameZone.cards.push({isUpgrade: true});
    engagedPlayer.gameZone.cards.push(
        {isUpgrade: true},
        {isUpgrade: true}
    );
    const scenario = {amplificationIcons: 0, match};
    match.scenario = scenario;
    const supervisorDefinition = blackWidow.config.nemesis.find(({card}) =>
        card.params.name === 'Supervisor').card;
    const supervisor = matchFactory.cardsFactory.createGameCardFromConfig(
        supervisorDefinition,
        {owner: scenario}
    );
    supervisor.controller = scenario;
    supervisor.engaged = engagedPlayer;
    engagedPlayer.gameZone.engage(supervisor);
    await supervisor.initTriggers();

    const attack = await supervisor.getAttackValue({
        match,
        player: engagedPlayer,
    });
    const effectiveStats = await supervisor.getEffectiveStats();
    const serializedSupervisor = await supervisor.toObjWithAbilityAvailability();
    const schemeEffect = new EnemySchemeEffect({
        enemy: supervisor,
        match,
        selectedTarget: {isMainScheme: true, name: 'Plan principal'},
    });
    assert.strictEqual(
        schemeEffect.getTargetDialog({match}),
        engagedPlayer.superhero.currentSide
    );
    assert.strictEqual(
        schemeEffect.getTriggersParams({match}).player,
        engagedPlayer
    );

    await schemeEffect.prepare({match});

    const boostEffect = new EnemySchemeEffect({
        enemy: supervisor,
        match,
        selectedTarget: {isMainScheme: true, name: 'Plan principal'},
    });
    boostEffect.boostCards = [supervisor];
    await boostEffect.resolveBoostCards(boostEffect.resolveParams({match}));

    assert.equal(attack, 2);
    assert.equal(effectiveStats.attack, attack);
    assert.equal(effectiveStats.scheme, attack);
    assert.equal(serializedSupervisor.scheme, attack);
    assert.equal(match.initialPlayer, undefined);
    assert.equal(dialogs[0].data.character.attack, attack);
    assert.equal(dialogs[0].data.character.scheme, attack);
    assert.equal(boostEffect.modifyScheme, attack);
});

test('Widow Sting and Deadly Shot resolve their independent effects simultaneously', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const matchFactory = new MatchFactory({triggerCards: {}, numPlayers: 3});
    const cardsFactory = matchFactory.cardsFactory;
    const sting = blackWidow.config.cards.find(({card}) =>
        card.params.name === 'Picadura de Viuda');
    const stingCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(sting.card),
        owner: {},
    });

    assert.equal(stingCard.abilities[0].effect.effectType, EFFECT_SIMULTANEOUS);
    assert.deepEqual(
        stingCard.abilities[0].effect.effects.map(({effectType}) => effectType),
        [EFFECT_DEAL_DAMAGE, EFFECT_STUN]
    );

    const lethalShot = blackWidow.config.nemesis.find(({card}) =>
        card.params.name === 'Disparo letal');
    const lethalShotCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(lethalShot.card),
        owner: {},
    });

    assert.deepEqual(
        lethalShotCard.abilities.map(({effect}) => effect.effectType),
        [EFFECT_SIMULTANEOUS, EFFECT_SIMULTANEOUS]
    );
    assert.deepEqual(
        lethalShotCard.abilities.map(({effect}) =>
            effect.effects.map(({effectType}) => effectType)),
        [
            [EFFECT_DISCARD_GAME, EFFECT_PLACE_THREAT],
            [EFFECT_DISCARD_GAME, EFFECT_DEAL_DAMAGE],
        ]
    );

    const hiredAssassin = blackWidow.config.nemesis.find(({card}) =>
        card.params.name === 'Asesino de alquiler');
    const hiredAssassinCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(hiredAssassin.card),
        owner: {},
    });
    assert.equal(hiredAssassinCard.abilities[0].effect.threat, 3);
});

test('Black Widow multi-attack event resolves three separate attack effects', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const dance = blackWidow.config.cards.find(({card}) =>
        card.params.name === 'Danza mortal');
    const matchFactory = new MatchFactory({triggerCards: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(dance.card),
        owner: {},
    });
    const [ability] = gameCard.abilities;
    const attacks = ability.effect.effects;

    assert.equal(ability.effect.effectType, EFFECT_CHAINED);
    assert.equal(ability.isAttack, false);
    assert.deepEqual(attacks.map(({baseDamage, isAttack, effectType}) => ({
        damage: baseDamage,
        isAttack,
        type: effectType,
    })), [
        {damage: 1, isAttack: true, type: EFFECT_DEAL_DAMAGE},
        {damage: 2, isAttack: true, type: EFFECT_DEAL_DAMAGE},
        {damage: 3, isAttack: true, type: EFFECT_DEAL_DAMAGE},
    ]);
});

test('Acrobatic Combat requires boost icons and a legal villain attack target', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'black-widow-acrobatic-combat-guard',
    });
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(blackWidow.config);
    superhero.selectedSide = 1;
    const player = match.createPlayer({name: 'Natasha', superhero});
    player.gameZone = new PlayerZone({owner: player});
    const guardMinion = {guard: true};
    player.gameZone.engage(guardMinion);
    match.scenario = {
        villain: {
            canBeAttacked: targetPlayer => !targetPlayer.hasGuard,
            isEnemy: true,
            isVillain: true,
        },
    };

    const acrobaticCombatDefinition = blackWidow.config.cards.find(({card}) =>
        card.params.name === 'Combate acrobático').card;
    const acrobaticCombat = matchFactory.cardsFactory.createGameCardFromConfig(
        acrobaticCombatDefinition,
        {owner: player}
    );
    player.addToGameZone(acrobaticCombat);

    const ability = acrobaticCombat.abilities[0];
    const getParams = boostValue => ({
        arrowPaid: true,
        card: acrobaticCombat,
        effect: {
            boostValue,
            card: {},
        },
        player,
    });

    assert.equal(await ability.canRun(getParams(1)), false);

    player.gameZone.removeEngaged(guardMinion);

    assert.equal(await ability.canRun(getParams(0)), false);
    assert.equal(await ability.canRun(getParams(1)), true);
});

test('Black Widow bracelets generate resources only for Preparation cards', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const braceletConfig = blackWidow.config.cards.find(({card}) =>
        card.params.name === 'Brazaletes de la Viuda Negra').card;
    const matchFactory = new MatchFactory({triggerCards: {}, limits: {}});
    const player = Object.create(Player.prototype);
    player.isPlayer = true;
    player.superhero = {
        isHero: true,
        currentSide: {
            id: 'black-widow-side',
            async hasResourceGenerators() {
                return false;
            },
        },
    };
    player.gameZone = {cards: []};

    const bracelets = matchFactory.cardsFactory.createGameCardFromConfig(
        braceletConfig,
        {owner: player}
    );
    bracelets.controller = player;
    player.gameZone.cards.push(bracelets);

    assert.deepEqual(
        await player.getResourceGenerators(
            {traits: [TRAIT_PREPARATION]},
            RESOURCE_PHYSICAL
        ),
        [bracelets]
    );
    assert.deepEqual(
        await player.getResourceGenerators(
            {traits: []},
            RESOURCE_PHYSICAL
        ),
        []
    );
});

test('Black Widow cards preserve explicit attack labels and the attack defeat branch', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const stealthAttack = blackWidow.config.precon
        .find(({aspect}) => aspect === 'justice')
        .cardRefs.find(({id}) => id === 'justice-ataque-sigiloso');
    const stealthDefinition = catalog.aspects.find(({_id}) =>
        _id === stealthAttack.id);
    const matchFactory = new MatchFactory({triggerCards: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(stealthDefinition.card),
        owner: {},
    });
    const [ability] = gameCard.abilities;
    const [damage, ifDefeated] = ability.effect.effects;

    assert.deepEqual(stealthDefinition.card.params.resources, [RESOURCE_MENTAL]);
    assert.ok(ability.isAttack);
    assert.deepEqual(ability.labels, [LABEL_ATTACK]);
    assert.equal(damage.isAttack, true);
    assert.equal(ifDefeated.effectType, EFFECT_DO_IF);
    assert.deepEqual(ifDefeated.condition, {
        'effects.0.defeated': true,
    });
});

test('Counterattack uses the effective damage and enemy-attack context', async () => {
    const catalog = await loadCatalog();
    const counterattack = catalog.aspects.find(({_id}) =>
        _id === 'aggression-contraataque');
    const matchFactory = new MatchFactory({triggerCards: {}, limits: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(counterattack.card),
        owner: {},
    });
    const [ability] = gameCard.abilities;
    const attacker = {isEnemy: true};
    const attack = {character: attacker};
    const damageEffect = {
        activation: {character: attacker, effect: attack},
        isAttack: true,
        takenDamage: 2,
    };
    const params = {
        attack,
        effect: damageEffect,
        triggeredTargetDamage: 2,
    };

    assert.equal(ability.trigger, TRIGGER_CHARACTER_TAKES_DAMAGE);
    assert.equal(ability.triggerParams.target, TARGET_YOUR_SUPERHERO);
    assert.equal(checkCondition(params, ability.condition), true);
    assert.equal(checkCondition({
        ...params,
        effect: {...damageEffect, isAttack: false},
    }, ability.condition), false);
    assert.equal(checkCondition({
        ...params,
        effect: {
            ...damageEffect,
            activation: {
                ...damageEffect.activation,
                character: {isEnemy: false},
            },
        },
    }, ability.condition), false);

    const resolvedParams = await ability.effect.resolveParams(params);
    assert.equal(resolvedParams.damage, 2);
    assert.equal(resolvedParams.attack, attack);
});

test('Black Widow obligation discards the highest-cost preparation card or causes Surge', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const matchFactory = new MatchFactory({triggerCards: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const obligation = cardsFactory.createGameCard({
        card: cardsFactory.createCard(blackWidow.config.obligation.card),
        owner: {},
    });
    const optionAbility = obligation.abilities.find(({name}) =>
        name === 'Resuelve la obligación');
    const exhaustOption = optionAbility.effect.options[0];
    const discardOption = optionAbility.effect.options[1];
    const [discardPreparation, surgeIfMissing, discardObligation] =
        discardOption.effect.effects;

    assert.equal(exhaustOption.condition, undefined);
    assert.equal(exhaustOption.arrow.cost.effectType, EFFECT_EXHAUST);
    assert.equal(exhaustOption.arrow.cost.target, TARGET_ALTEREGO);
    assert.equal(exhaustOption.effect.effectType, EFFECT_REMOVE_CARD);
    assert.equal(await exhaustOption.canRun({
        player: {isAlterEgo: false},
        card: obligation,
    }), false);
    assert.equal(await exhaustOption.canRun({
        player: {isAlterEgo: true},
        card: obligation,
    }), true);

    assert.deepEqual(discardPreparation.condition, {
        traits: TRAIT_PREPARATION,
        cost: {
            operator: 'max',
            defaultValue: 0,
        },
    });
    assert.equal(discardPreparation.highestCost, undefined);
    assert.equal(discardPreparation.refreshTarget, true);
    assert.equal(discardPreparation.target, 'upgrade-you-control');
    assert.equal(surgeIfMissing.effectType, EFFECT_DO_IF);
    assert.deepEqual(surgeIfMissing.condition, {'effects.0.resolved': false});
    assert.equal(discardObligation.target, 'card');
});

test('Black Widow hero and aspect abilities compile through the game factories', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const aspectIds = new Set([
        'justice-agente-coulson',
        'justice-temblor',
        'justice-ataque-sigiloso',
        'justice-contraespionaje',
        'justice-tacticas-de-infiltracion',
        'basic-quintransporte',
        'basic-objetivo-fijado',
        'basic-espionaje',
        'aggression-contraataque',
        'leadership-respuesta-rapida',
        'protection-postura-defensiva',
    ]);
    const newAspectCards = catalog.aspects.filter(({_id}) =>
        aspectIds.has(_id));
    assert.equal(newAspectCards.length, aspectIds.size);

    const matchFactory = new MatchFactory({triggerCards: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const definitions = [
        ...blackWidow.config.sides,
        ...blackWidow.config.cards.map(({card}) => card),
        blackWidow.config.obligation.card,
        ...blackWidow.config.nemesis.map(({card}) => card),
        ...newAspectCards.map(({card}) => card),
    ];
    let supervisor;
    let winterSoldierCostAbility;
    let natashaAbility;

    for (const definition of definitions) {
        const gameCard = cardsFactory.createGameCard({
            card: cardsFactory.createCard(definition),
            owner: {},
        });
        for (const ability of gameCard.abilities) {
            if (ability.effect) {
                assert.equal(
                    typeof ability.effect.canRun,
                    'function',
                    `Uncompiled ability on ${definition.params.name}`
                );
            }
        }
        if (definition.params.name === 'Supervisor') {
            supervisor = gameCard;
        } else if (definition.params.name === 'Soldado de Invierno') {
            winterSoldierCostAbility = gameCard.abilities.find(({trigger}) =>
                trigger === TRIGGER_THIS_PLAY_CARD);
        } else if (definition.params.name === 'Natasha Romanoff') {
            natashaAbility = gameCard.abilities.find(({trigger}) =>
                trigger === TRIGGER_YOU_END_PLAY_CARD);
        }
    }

    assert.equal(
        supervisor.boostAbility.effect.effectType,
        EFFECT_MODIFY_ACTIVATION
    );
    assert.equal(
        winterSoldierCostAbility.workInHand,
        true
    );
    assert.equal(
        winterSoldierCostAbility.trigger,
        TRIGGER_THIS_PLAY_CARD
    );
    assert.equal(
        natashaAbility.trigger,
        TRIGGER_YOU_END_PLAY_CARD
    );

    const objective = newAspectCards.find(({_id}) =>
        _id === 'basic-objetivo-fijado');
    const objectiveCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(objective.card),
        owner: {},
    });
    assert.equal(
        objectiveCard.abilities[0].effect.effectType,
        EFFECT_CANCEL_BOOST_ABILITY
    );
});

test('Black Widow hero responds after a Preparation ability resolves', async () => {
    const catalog = await loadCatalog();
    const blackWidow = catalog.heroes.find(({_id}) => _id === 'black-widow');
    const heroSide = blackWidow.config.sides.find(({params}) =>
        params.name === 'Viuda Negra');
    const preparationDefinition = blackWidow.config.cards.find(({card}) =>
        card.params.traits?.includes(TRAIT_PREPARATION)).card;
    const nonPreparationDefinition = blackWidow.config.cards.find(({card}) =>
        !card.params.traits?.includes(TRAIT_PREPARATION)).card;
    const syntheticSuitDefinition = blackWidow.config.cards.find(({card}) =>
        card.params.name === 'Traje sintético').card;
    const player = {
        canAttack: () => true,
        isHero: true,
        isPlayer: true,
    };
    const matchFactory = new MatchFactory({triggerCards: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const heroCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(heroSide),
        owner: player,
    });
    heroCard.controller = player;
    const ability = heroCard.abilities.find(({name}) =>
        name === 'Hacedora de viudas');
    const match = {triggerCards: {}};
    ability.match = match;
    heroCard.card.match = match;
    await heroCard.initTriggers();
    const preparationCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(preparationDefinition),
        owner: player,
    });
    preparationCard.controller = player;
    const nonPreparationCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(nonPreparationDefinition),
        owner: player,
    });
    nonPreparationCard.controller = player;
    const trigger = heroCard.triggers[TRIGGER_ABILITY_RESOLVED][PRIORITY_RESPONSE]
        .find(({ability: triggerAbility}) => triggerAbility === ability);
    const syntheticSuit = cardsFactory.createGameCard({
        card: cardsFactory.createCard(syntheticSuitDefinition),
        owner: player,
    });
    const syntheticSuitAbility = syntheticSuit.abilities.find(({condition}) =>
        condition?.['resolvedAbility.card.traits'] === TRAIT_PREPARATION);

    assert.equal(ability.trigger, TRIGGER_ABILITY_RESOLVED);
    assert.ok(trigger);
    assert.deepEqual(ability.condition, {
        'resolvedAbility.card.traits': TRAIT_PREPARATION,
    });
    assert.equal(syntheticSuitAbility.trigger, TRIGGER_ABILITY_RESOLVED);
    assert.deepEqual(syntheticSuitAbility.condition, {
        'resolvedAbility.card.traits': TRAIT_PREPARATION,
    });
    ability.effect.canRun = async () => true;

    const resolveAbility = async (card, actingPlayer) => {
        const resolvingAbility = new Ability({card, match});
        let offeredTriggers = [];
        resolvingAbility.payCosts = async () => {
            card.controller = undefined;
            return true;
        };
        resolvingAbility._openTriggersDialog = async (triggers, priority) => {
            if (priority === PRIORITY_RESPONSE) {
                offeredTriggers = triggers;
            }
            return undefined;
        };

        await resolvingAbility.resolveAbility({player: actingPlayer});

        assert.equal(resolvingAbility.resolved, true);
        return offeredTriggers;
    };

    assert.deepEqual(await resolveAbility(preparationCard, player), [trigger]);
    assert.deepEqual(await resolveAbility(nonPreparationCard, player), []);
    const otherPlayer = {isHero: true, isPlayer: true};
    const otherPreparationCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(preparationDefinition),
        owner: otherPlayer,
    });
    otherPreparationCard.controller = otherPlayer;
    assert.deepEqual(
        await resolveAbility(otherPreparationCard, otherPlayer),
        []
    );
});
});
