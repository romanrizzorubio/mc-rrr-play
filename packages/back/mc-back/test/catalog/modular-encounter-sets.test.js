import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_DEFEATED,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CANNOT,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_MODIFY_ATTACK,
    EFFECT_RESOLVE_ABILITY,
    EFFECT_SELECT_DISCARD_CARD,
    TARGET_REVEALED_ABILITY,
    TARGET_EFFECT,
    TARGET_VILLAIN,
    TARGET_YOUR_SUPERHERO,
    TRAIT_CRIMINAL,
    TRAIT_EXPERIMENTAL,
    TRAIT_HYDRA,
    TRAIT_WEAPON,
    TRIGGER_ENCOUNTER_ABILITY_RESOLVED,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_PLAYER_CAN_FLIP,
    TRIGGER_PLAYER_CAN_READY,
    TRIGGER_THIS_ATTACK,
    TRIGGER_VILLAIN_ATTACKS,
    PRIORITY_FORCED_RESPONSE,
    translateTrait,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {Scheme} from '../../src/activations/scheme.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {ModifyAttackEffect} from '../../src/effects/modify-attack-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import aMessOfThings from '../../../mc-data/seed/catalog/sets/a-mess-of-things.js';
import powerDrain from '../../../mc-data/seed/catalog/sets/power-drain.js';
import runningInterference from '../../../mc-data/seed/catalog/sets/running-interference.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {goblinGlider, pumpkinBombs} from '../../../mc-data/seed/catalog/encounters/attachments.js';
import {hydraSoldier} from '../../../mc-data/seed/catalog/encounters/minions.js';
import {gangUp, hailHydra} from '../../../mc-data/seed/catalog/encounters/treacheries.js';
import mutagenFormula from '../../../mc-data/seed/catalog/scenarios/mutagen-formula.js';
import {QuickstrikeAbility} from '../../src/abilities/misc/quickstrike-ability.js';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const cardsByName = set => new Map(set.config.cards.map(entry => [
    entry.card.params.name,
    entry,
]));

const getSet = (sets, id) => {
    const set = sets.find(({_id}) => _id === id);
    assert.ok(set, `Expected modular set "${id}" to be registered.`);

    return set;
};

const getEntry = (set, name) => {
    const entry = set.config.cards.find(({card}) => card.params.name === name);
    assert.ok(entry, `Expected ${name} in ${set.config.name}.`);

    return entry;
};

const createGameCard = (cardsFactory, cardConfig) => cardsFactory.createGameCard({
    card: cardsFactory.createCard(cardConfig),
    owner: {},
});

const runDoIfBranch = async (effect, params) => {
    const branches = [];
    if (effect.effect) {
        effect.effect.canRun = async () => true;
        effect.effect.runEffect = async () => branches.push('effect');
    }
    if (effect.effectNot) {
        effect.effectNot.canRun = async () => true;
        effect.effectNot.runEffect = async () => branches.push('effectNot');
    }

    await effect.execute(params);

    return branches;
};

test('the three modular encounter sets are registered with their printed card counts', async () => {
    const {sets} = await loadCatalog();
    const registeredSets = new Map(sets.map(set => [set._id, set]));

    assert.equal(registeredSets.get('a-mess-of-things')?.config.name, 'Un auténtico estropicio');
    assert.equal(registeredSets.get('power-drain')?.config.name, 'Alta tensión');
    assert.equal(registeredSets.get('running-interference')?.config.name, 'Impedimentos');

    const messCards = cardsByName(aMessOfThings);
    assert.equal(messCards.get('Barrido de cola').count, 2);
    assert.equal(messCards.get('Barrido de cola').card.params.boost, 0);
    assert.equal(messCards.get('Escorpión').card.type, CARD_TYPE_MINION);
    assert.equal(messCards.get('Un auténtico estropicio').card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);

    const standardTodosAUno = standard.config.cards.find(({card}) =>
        card.params.name === 'Todos a una');
    assert.ok(standardTodosAUno);
    assert.equal(standardTodosAUno.card.params.set, 'standard');
    assert.equal(messCards.get('Todos a una').card.params.set, 'a-mess-of-things');
    assert.notStrictEqual(messCards.get('Todos a una').card, standardTodosAUno.card);

    const drainCards = cardsByName(powerDrain);
    assert.equal(drainCards.size, 5);
    assert.equal(drainCards.get('Alta tensión').card.params.startingThreat[0], 2);
    assert.equal(drainCards.get('Electro').card.params.unique, true);
    assert.deepEqual(
        drainCards.get('Electro').card.params.traits,
        [TRAIT_CRIMINAL]
    );

    const interferenceCards = cardsByName(runningInterference);
    assert.equal(interferenceCards.get('Cobertura mediática').count, 2);
    assert.equal(interferenceCards.get('Con las manos atadas').card.params.attach, TARGET_YOUR_SUPERHERO);
});

test('Scorpion registers quickstrike as a forced response when it engages a hero', async () => {
    const match = {
        players: [],
        triggerCards: {},
    };
    const factory = new CardsFactory({match});
    const scorpionConfig = cardsByName(aMessOfThings).get('Escorpión').card;
    const scorpion = factory.createGameCard({
        card: factory.createCard(scorpionConfig),
        owner: {},
    });
    const quickstrike = scorpion.abilities.find(ability =>
        ability instanceof QuickstrikeAbility
    );

    assert.equal(scorpion.quickStrike, true);
    assert.ok(quickstrike instanceof ForcedResponseAbility);

    quickstrike.initTriggers(scorpion);

    assert.deepEqual(
        Object.keys(scorpion.triggers[TRIGGER_ENGAGE_HERO]),
        [PRIORITY_FORCED_RESPONSE]
    );
    assert.equal(
        scorpion.triggers[TRIGGER_ENGAGE_HERO][PRIORITY_FORCED_RESPONSE][0].ability,
        quickstrike
    );

    const scenario = {};
    const hero = {isHero: true};
    const alterEgo = {isHero: false};
    const revealingPlayer = {isHero: false};
    scorpion.controller = scenario;
    scorpion.engaged = hero;
    const trigger = scorpion.triggers[TRIGGER_ENGAGE_HERO][PRIORITY_FORCED_RESPONSE][0];

    assert.equal(await trigger.canTrigger({
        card: scorpion,
        effect: {selectedTarget: hero},
        player: revealingPlayer,
    }), true);
    assert.equal(trigger.getAbilityParams({
        effect: {selectedTarget: hero},
        player: revealingPlayer,
    }).player, hero);
    scorpion.engaged = alterEgo;
    assert.equal(Boolean(await trigger.canTrigger({
        card: scorpion,
        effect: {selectedTarget: alterEgo},
        player: alterEgo,
    })), false);
});

test('all abilities in the modular encounter sets compile to individual effects', () => {
    const factory = new CardsFactory({
        match: {
            players: [],
            triggerCards: {},
        },
    });

    for (const set of [aMessOfThings, powerDrain, runningInterference]) {
        for (const {card: cardConfig} of set.config.cards) {
            const gameCard = factory.createGameCard({
                card: factory.createCard(cardConfig),
                owner: {},
            });

            for (const ability of gameCard.abilities) {
                if (ability.effect) {
                    assert.equal(Array.isArray(ability.effect), false);
                    assert.equal(typeof ability.effect.canRun, 'function');
                }
            }

            if (gameCard.boostAbility?.effect) {
                assert.equal(Array.isArray(gameCard.boostAbility.effect), false);
                assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
            }
        }
    }
});

test('the attachment restrictions use permission triggers and the reveal repeater resolves its event ability', () => {
    const [scheme, _tombstone, tiedHands, mediaCoverage] =
        runningInterference.config.cards;
    assert.equal(scheme.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.equal(_tombstone.card.params.name, 'Lápida');
    assert.equal(_tombstone.card.params.unique, true);
    assert.equal(tiedHands.card.type, CARD_TYPE_ATTACHMENT);
    assert.equal(mediaCoverage.card.type, CARD_TYPE_ATTACHMENT);

    const [cannotReady, cannotFlip] = tiedHands.card.params.abilities;
    assert.equal(cannotReady.params.trigger, TRIGGER_PLAYER_CAN_READY);
    assert.equal(cannotReady.params.effect.type, EFFECT_CANNOT);
    assert.equal(cannotFlip.params.trigger, TRIGGER_PLAYER_CAN_FLIP);
    assert.equal(cannotFlip.params.effect.type, EFFECT_CANNOT);

    const [resolveAbility] = mediaCoverage.card.params.abilities;
    assert.equal(resolveAbility.params.trigger, TRIGGER_ENCOUNTER_ABILITY_RESOLVED);
    assert.equal(resolveAbility.params.effect.type, EFFECT_RESOLVE_ABILITY);
    assert.equal(
        resolveAbility.params.effect.params.target,
        TARGET_REVEALED_ABILITY
    );
});

test('encounter set treacheries retain their card type and printed boost values', () => {
    const powerCards = cardsByName(powerDrain);
    for (const [name, boost] of [
        ['Pulso electromagnético', 2],
        ['Descarga eléctrica', 1],
        ['Terapia de electrochoque', 1],
    ]) {
        assert.equal(powerCards.get(name).card.type, CARD_TYPE_TREACHERY);
        assert.equal(powerCards.get(name).card.params.boost, boost);
    }
});

test('shared encounter-card definitions leave set ownership to their consumers', async () => {
    for (const card of [
        goblinGlider,
        pumpkinBombs,
        hydraSoldier,
        gangUp,
        hailHydra,
    ]) {
        assert.equal(Object.prototype.hasOwnProperty.call(card.params, 'set'), false);
    }

    const {sets} = await loadCatalog();
    const goblinGimmicks = getSet(sets, 'goblin-gimmicks');
    assert.equal(getEntry(goblinGimmicks, 'Planeador duende').card.params.set, 'goblin-gimmicks');
    assert.equal(getEntry(goblinGimmicks, 'Bombas calabaza').card.params.set, 'goblin-gimmicks');

    const mutagenGlider = mutagenFormula.config.cards.find(({card}) =>
        card.params.name === 'Planeador duende');
    const mutagenBombs = mutagenFormula.config.cards.find(({card}) =>
        card.params.name === 'Bombas calabaza');
    assert.ok(mutagenGlider);
    assert.ok(mutagenBombs);
    assert.equal(mutagenGlider.card.params.set, 'goblin-gimmicks');
    assert.equal(mutagenBombs.card.params.set, 'goblin-gimmicks');
});

test('Electroshock Therapy discards one encounter card per player', () => {
    const therapy = cardsByName(powerDrain).get('Terapia de electrochoque').card;
    const [discardEffect] = therapy.params.abilities[0].params.effect.params.effects;

    assert.deepEqual(discardEffect.params.count, [1, true]);
    assert.equal(discardEffect.params.paramsCalc, undefined);
});

test('the four new modular sets preserve the supplied cards and counts', async () => {
    const {sets, heroes} = await loadCatalog();
    const experimentalWeapons = getSet(sets, 'experimental-weapons');
    const hydraAssault = getSet(sets, 'hydra-assault');
    const weaponMaster = getSet(sets, 'weapon-master');
    const hydraPatrol = getSet(sets, 'hydra-patrol');

    for (const set of [experimentalWeapons, hydraAssault, weaponMaster, hydraPatrol]) {
        assert.equal(set.config.standard, false);
    }

    const laserRifle = getEntry(experimentalWeapons, 'Fusil láser');
    assert.equal(laserRifle.count, 1);
    assert.equal(laserRifle.card.type, CARD_TYPE_ATTACHMENT);
    assert.equal(laserRifle.card.params.image, 'sets/experimental-weapons/04072.png');
    assert.deepEqual(laserRifle.card.params.traits, [TRAIT_EXPERIMENTAL, TRAIT_WEAPON]);
    assert.equal(laserRifle.card.params.attack, 1);
    assert.equal(laserRifle.card.params.boost, 2);
    assert.equal(laserRifle.card.params.attach, TARGET_VILLAIN);
    assert.equal(laserRifle.card.params.abilities[0].type, ABILITY_CONSTANT);
    assert.equal(laserRifle.card.params.abilities[0].params.trigger, TRIGGER_VILLAIN_ATTACKS);
    assert.equal(laserRifle.card.params.abilities[0].params.effect.type, EFFECT_MODIFY_ATTACK);
    assert.equal(laserRifle.card.params.abilities[0].params.effect.params.target, TARGET_EFFECT);

    const energyShield = getEntry(experimentalWeapons, 'Escudo de energía');
    assert.deepEqual(energyShield.card.params.keywords, {retaliate: 1});
    const exoArmor = getEntry(experimentalWeapons, 'Exoarmadura');
    assert.equal(exoArmor.card.params.attack, 1);
    assert.equal(exoArmor.card.params.scheme, 1);
    const servoFists = getEntry(experimentalWeapons, 'Servopuños');
    assert.equal(servoFists.card.params.abilities[0].params.trigger, TRIGGER_THIS_ATTACK);
    assert.deepEqual(servoFists.card.params.abilities[0].params.condition, {
        'effect.takenDamage': '>0',
        'effect.selectedTarget.isSuperhero': true,
    });

    const flamethrower = getEntry(hydraAssault, 'Soldado de Hydra con lanzallamas');
    assert.equal(flamethrower.count, 3);
    assert.equal(flamethrower.card.type, CARD_TYPE_MINION);
    assert.equal(flamethrower.card.params.boost, 0);
    assert.deepEqual(flamethrower.card.params.traits, [TRAIT_HYDRA]);
    assert.equal(flamethrower.card.params.abilities[0].type, ABILITY_FORCED_RESPONSE);
    assert.equal(flamethrower.card.params.boostAbility.type, ABILITY_BOOST);
    assert.equal(flamethrower.card.params.boostAbility.params.effect.type, EFFECT_DO_IF);

    const flyingSoldier = getEntry(hydraAssault, 'Soldado volador de Hydra');
    assert.equal(flyingSoldier.count, 2);
    assert.equal(flyingSoldier.card.params.boost, 0);
    assert.deepEqual(flyingSoldier.card.params.keywords, {quickStrike: true});
    assert.equal(flyingSoldier.card.params.boostAbility.type, ABILITY_BOOST);

    const sharedHailHydra = getEntry(hydraAssault, '¡Hail Hydra!');
    const captainAmerica = heroes.find(({_id}) => _id === 'captain-america');
    const captainAmericaHailHydra = captainAmerica.config.nemesis.find(({card}) =>
        card.params.name === '¡Hail Hydra!');
    const captainAmericaHydraSoldier = captainAmerica.config.nemesis.find(({card}) =>
        card.params.name === 'Soldado de Hydra');
    assert.ok(captainAmericaHailHydra);
    assert.ok(captainAmericaHydraSoldier);
    assert.equal(sharedHailHydra.count, 1);
    assert.notDeepEqual(sharedHailHydra.card, captainAmericaHailHydra.card);
    assert.equal(sharedHailHydra.card.params.set, 'hydra-assault');
    assert.equal(captainAmericaHailHydra.card.params.set, 'Captain America');
    assert.equal(captainAmericaHydraSoldier.card.params.set, 'Captain America');
    const legionSoldier = getEntry(getSet(sets, 'legions-of-hydra'), 'Soldado de Hydra');
    assert.equal(legionSoldier.card.params.set, 'legions-of-hydra');
    assert.equal(getEntry(hydraAssault, 'Soldado de Hydra').count, 2);
    assert.equal(getEntry(hydraAssault, 'Soldado de Hydra').card.params.set, 'hydra-assault');

    const combatKnife = getEntry(weaponMaster, 'Cuchillo de combate');
    assert.equal(combatKnife.card.params.attack, 1);
    assert.equal(combatKnife.card.params.boost, 1);
    assert.deepEqual(combatKnife.card.params.traits, [TRAIT_WEAPON]);
    assert.equal(combatKnife.card.params.abilities[0].type, ABILITY_CONSTANT);
    const hydraSidearm = getEntry(weaponMaster, 'Arma corta de Hydra');
    assert.equal(hydraSidearm.card.params.abilities[0].type, ABILITY_CONSTANT);
    assert.equal(
        getEntry(weaponMaster, 'Arma corta de Hydra').card.params.abilities[0]
            .params.trigger,
        TRIGGER_VILLAIN_ATTACKS
    );
    assert.equal(getEntry(weaponMaster, 'Maestro de armas').count, 2);
    assert.equal(
        getEntry(weaponMaster, 'Granada de conmoción').card.type,
        CARD_TYPE_TREACHERY
    );

    const hydraTroop = getEntry(hydraPatrol, 'Tropa de Hydra');
    assert.equal(hydraTroop.count, 2);
    assert.equal(hydraTroop.card.params.attack, 2);
    assert.equal(hydraTroop.card.params.scheme, 1);
    assert.equal(hydraTroop.card.params.hitPoints, 2);
    assert.equal(hydraTroop.card.params.boost, 2);
    assert.equal(hydraTroop.card.params.keywords.incite, 1);
    assert.equal(hydraTroop.card.params.abilities, undefined);
    assert.equal(getEntry(hydraPatrol, 'Soldado de Hydra').card.params.set, 'hydra-patrol');

    const patrolScheme = getEntry(hydraPatrol, 'Patrulla de Hydra');
    assert.equal(patrolScheme.count, 1);
    assert.equal(patrolScheme.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.deepEqual(patrolScheme.card.params.startingThreat, [2, true]);
    assert.deepEqual(patrolScheme.card.params.icons, {crisis: true});
    assert.equal(patrolScheme.card.params.abilities[0].type, ABILITY_WHEN_DEFEATED);
    assert.equal(getEntry(hydraPatrol, 'Soldado de Hydra').count, 3);
});

test('all cards and boost abilities in the new sets compile to individual runnable effects', async () => {
    const {sets} = await loadCatalog();
    const factory = new CardsFactory({
        match: {
            players: [],
            triggerCards: {},
        },
    });

    for (const setId of [
        'experimental-weapons',
        'hydra-assault',
        'weapon-master',
        'hydra-patrol',
    ]) {
        for (const {card: cardConfig} of getSet(sets, setId).config.cards) {
            const gameCard = createGameCard(factory, cardConfig);
            const abilities = [
                ...gameCard.abilities,
                ...(gameCard.boostAbility ? [gameCard.boostAbility] : []),
            ];

            for (const ability of abilities) {
                assert.ok(ability.effect, `${cardConfig.params.name} needs an effect.`);
                assert.equal(Array.isArray(ability.effect), false);
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }
    }

    const troopCard = factory.createCard(
        getEntry(getSet(sets, 'hydra-patrol'), 'Tropa de Hydra').card
    );
    assert.equal(troopCard.keywords.incite, 1);
    assert.equal(translateTrait(TRAIT_EXPERIMENTAL), 'Experimental');
    assert.equal(translateTrait(TRAIT_HYDRA), 'Hydra');
    assert.equal(translateTrait(TRAIT_WEAPON), 'Arma');
});

test('Incite places its printed threat when a card with the keyword is revealed', async () => {
    const mainScheme = {
        isMainScheme: true,
        threat: 0,
        value: 20,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {},
    };
    const match = {
        mainScheme,
        numPlayers: 1,
        scenario: {
            async completeMainScheme() {
                assert.fail('The main scheme is below its threshold.');
            },
        },
        triggerCards: {},
    };
    const factory = new CardsFactory({match});
    const card = factory.createGameCard({
        card: factory.createCard({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Perfidia con Incitar',
                set: 'test',
                keywords: {incite: 2},
                abilities: [],
            },
        }),
        owner: match.scenario,
    });
    const revealEffect = new RevealEncounterEffect({
        match,
        selectedTarget: card,
    });

    assert.equal(card.incite, 2);
    await revealEffect.reveal({match, player: {}});

    assert.equal(mainScheme.threat, 2);
});

test('runtime conditions follow the boost, attachment, identity, and damage contexts', async () => {
    const {sets} = await loadCatalog();
    const match = {
        enemies: [],
        players: [],
        triggerCards: {},
    };
    const factory = new CardsFactory({match});
    const hydraAssault = getSet(sets, 'hydra-assault');
    const weaponMaster = getSet(sets, 'weapon-master');

    const flamethrower = createGameCard(
        factory,
        getEntry(hydraAssault, 'Soldado de Hydra con lanzallamas').card
    );
    const flamethrowerResponse = flamethrower.abilities[0];
    flamethrowerResponse.effect.canRun = async () => true;

    const defender = {};
    const player = {isPlayer: true};
    const attackEffect = new EnemyAttackEffect({
        enemy: {isVillain: true},
        match,
        selectedTarget: player,
    });
    const attack = new Attack({effect: attackEffect});
    assert.equal(await flamethrowerResponse.canRun({
        attack,
        effect: attackEffect,
        player,
    }), true);
    attackEffect.defender = defender;
    assert.equal(await flamethrowerResponse.canRun({
        attack,
        effect: attackEffect,
        player,
    }), false);

    const flamethrowerBoost = flamethrower.boostAbility.effect;
    attackEffect.defender = null;
    assert.deepEqual(await runDoIfBranch(flamethrowerBoost, {
        activation: {effect: attackEffect},
    }), ['effect']);
    assert.deepEqual(await runDoIfBranch(flamethrowerBoost, {
        activation: {effect: {isAttack: false, isDefended: false}},
    }), []);
    attackEffect.defender = defender;
    assert.deepEqual(await runDoIfBranch(flamethrowerBoost, {
        activation: {effect: attackEffect},
    }), []);

    const flyingSoldier = createGameCard(
        factory,
        getEntry(hydraAssault, 'Soldado volador de Hydra').card
    );
    const flyingBoost = flyingSoldier.boostAbility.effect;
    const heroPlayer = {isHero: true, isPlayer: true};
    const alterEgoPlayer = {isHero: false, isPlayer: true};
    const villain = {isVillain: true};
    const heroAttack = new Attack({
        effect: new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: heroPlayer,
        }),
    });
    const alterEgoAttack = new Attack({
        effect: new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: alterEgoPlayer,
        }),
    });
    const villainScheme = new Scheme({
        effect: new EnemySchemeEffect({
            enemy: villain,
            match,
            selectedTarget: {isMainScheme: true},
        }),
    });

    assert.deepEqual(await runDoIfBranch(flyingBoost, {
        activation: heroAttack,
        player: heroPlayer,
    }), ['effect']);
    assert.deepEqual(await runDoIfBranch(flyingBoost, {
        activation: alterEgoAttack,
        player: alterEgoPlayer,
    }), []);
    assert.deepEqual(await runDoIfBranch(flyingBoost, {
        activation: villainScheme,
        player: heroPlayer,
    }), []);

    const combatKnife = createGameCard(
        factory,
        getEntry(weaponMaster, 'Cuchillo de combate').card
    );
    const weaponsTreachery = createGameCard(
        factory,
        getEntry(weaponMaster, 'Maestro de armas').card
    );
    const weaponCondition = weaponsTreachery.abilities[0].effect.effects[1];
    assert.deepEqual(await runDoIfBranch(weaponCondition, {
        match: {villain: {attached: [combatKnife]}},
    }), ['effect']);
    assert.deepEqual(await runDoIfBranch(weaponCondition, {
        match: {villain: {attached: []}},
    }), []);

    const concussion = createGameCard(
        factory,
        getEntry(weaponMaster, 'Granada de conmoción').card
    );
    assert.deepEqual(await runDoIfBranch(concussion.abilities[0].effect, {
        player: {isConfused: true},
    }), ['effect']);
    assert.deepEqual(await runDoIfBranch(concussion.abilities[0].effect, {
        player: {isConfused: false},
    }), ['effectNot']);
    assert.deepEqual(await runDoIfBranch(concussion.abilities[1].effect, {
        player: {isStunned: true},
    }), ['effect']);
    assert.deepEqual(await runDoIfBranch(concussion.abilities[1].effect, {
        player: {isStunned: false},
    }), ['effectNot']);
    assert.equal(
        concussion.abilities[1].effect.effect.effects[1].effectType,
        EFFECT_DEAL_DAMAGE
    );

    const experimentalWeapons = getSet(sets, 'experimental-weapons');
    const servoFists = createGameCard(
        factory,
        getEntry(experimentalWeapons, 'Servopuños').card
    ).abilities[0];
    servoFists.effect.canRun = async () => true;
    const linkedAttack = new EnemyAttackEffect({
        enemy: {isVillain: true},
        match,
        selectedTarget: player,
    });
    const activation = new Attack({effect: linkedAttack});
    const canRespondToDamage = async (damage, selectedTarget) => {
        const damageEffect = new TakeDamageEffect({
            activation,
            damage,
            match,
            selectedTarget,
        });

        return servoFists.canRun({
            ...damageEffect.getTriggersParams({player}),
            player,
        });
    };

    assert.equal(await canRespondToDamage(1, {isSuperhero: true}), true);
    assert.equal(await canRespondToDamage(0, {isSuperhero: true}), false);
    assert.equal(await canRespondToDamage(1, {isSuperhero: false}), false);
});

test('Servopuños lets the attacked player choose a card to discard without corrupting deck serialization', async () => {
    const {heroes, sets} = await loadCatalog();
    const blackPanther = heroes.find(({_id}) => _id === 'blackpanther');
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'servo-fists-discard-test',
    });
    match.openDialog = async ({data}) => ({selected: data.cards.slice(0, 1)});

    const factory = new MatchFactory(match);
    const superhero = factory.createSuperhero(blackPanther.config);
    const player = match.createPlayer({name: 'TChalla', superhero});
    player.initPlayer();

    const [handCard] = player.deck.cards.splice(0, 1);
    player.hand.addCard(handCard);

    const servoConfig = getEntry(getSet(sets, 'experimental-weapons'), 'Servopuños').card;
    const servoFists = factory.cardsFactory.createGameCardFromConfig(servoConfig);
    const response = servoFists.abilities[0];
    const damageEffect = new TakeDamageEffect({
        damage: 1,
        match,
        selectedTarget: superhero,
    });

    assert.equal(response.effect.effectType, EFFECT_SELECT_DISCARD_CARD);
    await response.resolveAbility({
        ...damageEffect.getTriggersParams({player}),
        card: servoFists,
        player,
    });

    assert.equal(player.hand.cards.includes(handCard), false);
    assert.equal(player.deck.discardPile.includes(handCard), true);
    assert.equal(player.deck.discardPile.includes(player), false);
    assert.doesNotThrow(() => player.toObj());
});

test('attack keyword modifiers merge without removing keywords already gained', () => {
    const attack = new EnemyAttackEffect({
        match: {},
        keywords: {overkill: true},
    });

    new ModifyAttackEffect({
        match: {},
        modify: {keywords: {ranged: true}},
        selectedTarget: attack,
    }).execute({});
    new ModifyAttackEffect({
        match: {},
        modify: {keywords: {piercing: true}},
        selectedTarget: attack,
    }).execute({});

    assert.equal(attack.ranged, true);
    assert.equal(attack.piercing, true);
    assert.equal(attack.keywords.overkill, true);
});

test('villain attack attachments apply ranged and piercing in the real attack window', async () => {
    const {sets} = await loadCatalog();
    const player = {
        hand: {cards: []},
        isPlayer: true,
    };
    const villain = {
        attached: [],
        id: 'villain',
        isEnemy: true,
        isVillain: true,
        name: 'Villain',
    };
    const match = {
        activationsFactory: {
            createActivation: ({effect}) => new Attack({effect}),
        },
        enemies: [villain],
        initialPlayer: player,
        numPlayers: 1,
        players: [player],
        triggerCards: {},
    };
    const factory = new CardsFactory({match});
    const laserRifle = createGameCard(
        factory,
        getEntry(getSet(sets, 'experimental-weapons'), 'Fusil láser').card
    );
    const combatKnife = createGameCard(
        factory,
        getEntry(getSet(sets, 'weapon-master'), 'Cuchillo de combate').card
    );
    const hydraSidearm = createGameCard(
        factory,
        getEntry(getSet(sets, 'weapon-master'), 'Arma corta de Hydra').card
    );

    for (const attachment of [laserRifle, combatKnife, hydraSidearm]) {
        attachment.attachedTo = villain;
        villain.attached.push(attachment);
        assert.equal(attachment.abilities[0].hideDialog, true);
        await attachment.initTriggers();
    }

    const attack = new EnemyAttackEffect({
        enemy: villain,
        match,
        selectedTarget: player,
    });
    await attack.triggerInit(attack.getTriggersParams({player}));

    assert.equal(attack.ranged, true);
    assert.equal(attack.piercing, true);

    const retaliatingHero = {
        isInPlay: true,
        isSuperhero: true,
        name: 'Hero',
        retaliate: 1,
    };
    const activation = new Attack({effect: attack});
    assert.equal(
        await activation.getRetaliateDamageEffect(retaliatingHero, {player}),
        undefined
    );
});

test('Hydra flamethrower boost skips discarding when the player has no support', async () => {
    const {sets} = await loadCatalog();
    const match = {
        players: [],
        triggerCards: {},
    };
    const player = {supports: []};
    const attackedPlayer = {supports: []};
    match.players.push(player, attackedPlayer);

    const factory = new CardsFactory({match});
    const hydraAssault = getSet(sets, 'hydra-assault');
    const cardConfig = getEntry(
        hydraAssault,
        'Soldado de Hydra con lanzallamas'
    ).card;
    const activation = {
        effect: {isAttack: true, isDefended: false},
        selectedTarget: attackedPlayer,
    };
    const noSupportBoost = createGameCard(factory, cardConfig).boostAbility.effect;

    await noSupportBoost.runEffect({match, player, activation});

    assert.equal(noSupportBoost.effect.resolved, false);

    let discarded = false;
    attackedPlayer.supports = [{
        async discard() {
            discarded = true;
        },
    }];
    const supportBoost = createGameCard(factory, cardConfig).boostAbility.effect;

    await supportBoost.runEffect({match, player, activation});

    assert.equal(discarded, true);
});

test('Hydra flamethrower forced response discards support from the attacked player', async () => {
    const {sets} = await loadCatalog();
    const match = {
        enemies: [],
        players: [],
        triggerCards: {},
    };
    const discarded = [];
    const support = id => ({
        id,
        async discard() {
            discarded.push(id);
        },
        toObj() {
            return {id};
        },
    });
    const firstSupport = support('support-1');
    const secondSupport = support('support-2');
    const attackedPlayer = {
        isPlayer: true,
        supports: [firstSupport, secondSupport],
    };
    const triggerPlayer = {isPlayer: true, supports: []};
    match.players.push(attackedPlayer, triggerPlayer);
    let dialogCards;
    match.openDialog = async ({data}) => {
        dialogCards = data.cards;

        return {selected: {id: 'support-2'}};
    };

    const factory = new CardsFactory({match});
    const hydraAssault = getSet(sets, 'hydra-assault');
    const cardConfig = getEntry(
        hydraAssault,
        'Soldado de Hydra con lanzallamas'
    ).card;
    const flamethrower = createGameCard(factory, cardConfig);
    const attackEffect = new EnemyAttackEffect({
        enemy: flamethrower,
        match,
        selectedTarget: attackedPlayer,
    });
    attackEffect.attacked = attackedPlayer;
    const attack = new Attack({effect: attackEffect});
    const response = flamethrower.abilities[0];
    const damageEffect = new TakeDamageEffect({
        activation: attack,
        damage: 1,
        isAttack: true,
        match,
        selectedTarget: attackedPlayer,
    });
    const params = damageEffect.getTriggersParams({match, player: triggerPlayer});
    params.triggeredEffect = params.effect;

    assert.deepEqual(response.effect.getValidTarget(params), [firstSupport, secondSupport]);
    assert.equal(await response.canRun(params), true);
    await response.resolveAbility(params);

    assert.deepEqual(dialogCards.map(({id}) => id), ['support-1', 'support-2']);
    assert.deepEqual(discarded, ['support-2']);
});
