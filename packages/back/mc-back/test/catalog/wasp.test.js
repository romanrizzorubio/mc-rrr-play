import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_OPTION,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_MINION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    DECK_POSITION_SHUFFLE,
    DIALOG_ASSIGN,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_ADD_ADDITIONAL_COST,
    EFFECT_ADD_KEYWORD,
    EFFECT_ADD_TRAIT,
    EFFECT_ASSIGN_THREAT,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_EFFECT_VALUE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MOVE_TO_DECK,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SPEND,
    EFFECT_SIMULTANEOUS,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_THWART,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_SCHEMES,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_CHARACTER,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_HERO_SIDE,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_ARMOR,
    TRAIT_CRIMINAL,
    TRAIT_GENIUS,
    TRAIT_GIANT,
    TRAIT_ITEM,
    TRAIT_SKILL,
    TRAIT_SUPERPOWER,
    TRAIT_TECH,
    TRAIT_TINY,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_ABILITY_COST,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_THIS_SPEND,
    TRIGGER_YOU_ATTACK,
    TRIGGER_CHARACTER_DEFEATED,
    TRIGGER_YOU_DEFEAT_MINION,
    TRIGGER_YOU_DEFEAT_SIDE_SCHEME,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
    TRIGGER_YOUR_HERO_GET_THWART,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import waspHero from '../../../mc-data/seed/catalog/heroes/wasp.js';
import {Ability} from '../../src/abilities/core/ability.js';
import {AssignThreatEffect} from '../../src/effects/assign-threat-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DoIfEffect} from '../../src/effects/do-if-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {ModifyEffectValueEffect} from '../../src/effects/modify-effect-value-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {Attack} from '../../src/activations/attack.js';
import {Thwart} from '../../src/activations/thwart.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {ThwartBasicAbility} from '../../src/abilities/basic/thwart-basic-ability.js';
import {YouDefeatSideSchemeTrigger} from '../../src/triggers/you-defeat-side-scheme-trigger.js';
import {YourHeroAttackDefeatEnemyTrigger} from '../../src/triggers/your-hero-attack-defeat-enemy-trigger.js';
import {CharacterDefeatedTrigger} from '../../src/triggers/character-defeated-trigger.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {FacedownCharacterGameCard} from '../../src/model/cards/facedown-character-game-card.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {CharacterWouldTakeDamageTrigger} from '../../src/triggers/character-would-take-damage-trigger.js';
import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';

describe('Avispa', () => {
    const createQuickGrowthFixture = async ({copies, name}) => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const configCard = wasp.config.cards.find(({card}) =>
            card.params.name === 'Crecimiento rápido').card;
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name,
        });
        const superhero = new MatchFactory(match).createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.refresh = async () => {};
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        player.initPlayer();

        const cardsFactory = new CardsFactory({match});
        const cards = Array.from({length: copies}, (_, index) =>
            cardsFactory.createGameCardFromConfig(configCard, {
                index: index + 1,
                owner: player,
            }));
        const resources = Array.from({length: copies}, (_, index) =>
            cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {
                    name: `Recurso para Crecimiento rápido ${index + 1}`,
                    resources: [RESOURCE_MENTAL],
                },
            }, {owner: player}));
        const deckCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso de prueba',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.deck.addToDeck([deckCard]);

        cards.forEach(card => {
            card.controller = player;
            player.hand.addCard(card);
        });
        player.hand.addCards(resources);
        await new Promise(resolve => setImmediate(resolve));

        return {cards, match, player, resources, superhero};
    };

    const createBeetleArmorFixture = async ({beetleInPlay, name}) => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const rhinoScenario = catalog.scenarios.find(({_id}) => _id === 'rhino');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name,
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        await player.initPlayer();

        const scenario = await matchFactory.createScenario({
            ...rhinoScenario.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        match.addScenario(scenario);
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        await scenario.initScenario([], false);

        let beetle;
        let duplicateBeetle;
        let unrelatedMinion;
        if (beetleInPlay) {
            const beetleConfig = wasp.config.nemesis.find(({card}) =>
                card.params.name === 'Escarabajo').card;
            beetle = matchFactory.cardsFactory.createGameCardFromConfig(
                beetleConfig,
                {owner: scenario},
            );
            await new RevealEncounterEffect({
                match,
                selectedTarget: beetle,
            }).runEffect({player});
            duplicateBeetle = matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_MINION,
                params: {
                    name: 'Escarabajo',
                    set: 'Otro conjunto',
                    attack: 1,
                    scheme: 1,
                    hitPoints: 4,
                },
            }, {owner: scenario});
            await new RevealEncounterEffect({
                match,
                selectedTarget: duplicateBeetle,
            }).runEffect({player});
        } else {
            unrelatedMinion = matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_MINION,
                params: {
                    name: 'Otro esbirro',
                    attack: 1,
                    scheme: 1,
                    hitPoints: 4,
                },
            }, {owner: scenario});
            await new RevealEncounterEffect({
                match,
                selectedTarget: unrelatedMinion,
            }).runEffect({player});
        }

        const villain = match.villain;
        const villainHitPoints = await villain.getHitPoints({player});
        const armorConfig = wasp.config.nemesis.find(({card}) =>
            card.params.name === 'Armadura de Escarabajo MK IV').card;
        const armor = matchFactory.cardsFactory.createGameCardFromConfig(
            armorConfig,
            {owner: scenario},
        );
        await new RevealEncounterEffect({
            match,
            selectedTarget: armor,
        }).runEffect({player});

        return {
            armor,
            beetle,
            duplicateBeetle,
            match,
            player,
            unrelatedMinion,
            villain,
            villainHitPoints,
        };
    };

    const createBeetleObsessionFixture = async ({beetleInPlay, name}) => {
        const fixture = await createBeetleArmorFixture({beetleInPlay, name});
        const {heroes} = await loadCatalog();
        const wasp = heroes.find(({_id}) => _id === 'wasp');
        const obsessionConfig = wasp.config.nemesis.find(({card}) =>
            card.params.name === 'La obsesión de la Escarabajo').card;
        const obsession = new CardsFactory({match: fixture.match})
            .createGameCardFromConfig(
                obsessionConfig,
                {owner: fixture.match.scenario},
            );

        return {
            ...fixture,
            obsession,
            alterEgoAbility: obsession.abilities.find(({abilityType}) =>
                abilityType === ABILITY_WHEN_REVEALED_ALTEREGO),
            heroAbility: obsession.abilities.find(({abilityType}) =>
                abilityType === ABILITY_WHEN_REVEALED_HERO),
        };
    };

    test('defines the three identities, C.H.I.C.A, defeat responses, and known precon cards', async () => {
        const catalog = await loadCatalog();
        const hero = catalog.heroes.find(({_id}) => _id === 'wasp');
        const [alterEgo, tinyHero, giantHero] = hero.config.sides;

        assert.deepEqual(hero.config.sides.map(({params}) => [
            params.name,
            params.image,
            params.handSize,
            params.hitPoints,
        ]), [
            ['Nadia Van Dyne', 'heroes/wasp/13001a.png', 6, 11],
            ['Avispa', 'heroes/wasp/13001b.png', 5, 11],
            ['Avispa', 'heroes/wasp/13001c.png', 5, 11],
        ]);
        assert.deepEqual(alterEgo.params.traits, [TRAIT_GENIUS]);
        assert.deepEqual(tinyHero.params.traits, [TRAIT_AVENGER, TRAIT_TINY]);
        assert.deepEqual(giantHero.params.traits, [TRAIT_AVENGER, TRAIT_GIANT]);
        assert.deepEqual(
            [alterEgo.params.recovery, tinyHero.params.thwart,
                tinyHero.params.attack, tinyHero.params.defense,
                giantHero.params.thwart, giantHero.params.attack,
                giantHero.params.defense],
            [3, 1, 1, 2, 2, 2, 3],
        );
        const giantAbility = giantHero.params.abilities[0];
        assert.equal(giantAbility.type, ABILITY_CONSTANT);
        assert.deepEqual(giantAbility.params.trigger, [
            TRIGGER_YOUR_HERO_GET_ATTACK,
            TRIGGER_YOUR_HERO_GET_THWART,
        ]);
        assert.deepEqual(giantAbility.params.condition, {
            'player.superhero.currentSide.traits': TRAIT_GIANT,
        });
        assert.equal(giantAbility.params.effect.type, EFFECT_SIMULTANEOUS);
        assert.deepEqual(
            giantAbility.params.effect.params.effects.map(({type, params}) =>
                [type, params.effectTypes, params.abilityCondition, params.value]),
            [
                [EFFECT_MODIFY_EFFECT_VALUE, [EFFECT_DEAL_DAMAGE],
                    {isBasic: true}, {target: TARGET_ALL_ENEMIES, distribute: true}],
                [EFFECT_MODIFY_EFFECT_VALUE, [EFFECT_REMOVE_THREAT],
                    {isBasic: true}, {target: TARGET_ALL_SCHEMES, distribute: true}],
            ],
        );

        const chico = alterEgo.params.abilities[0];
        assert.equal(chico.type, ABILITY_ALTEREGO_ACTION);
        assert.deepEqual(chico.params.limit, {
            count: 1,
            target: TARGET_ROUND,
        });
        const [search, moveToDeck] = chico.params.effect.params.effects;
        assert.equal(chico.params.effect.type, EFFECT_CHAINED);
        assert.equal(search.type, EFFECT_SEARCH_CARDS);
        assert.deepEqual(search.params.locations, ['discardPile']);
        assert.deepEqual(search.params.filter, {resources: RESOURCE_MENTAL});
        assert.equal(search.params.count, 2);
        assert.equal(search.params.upTo, true);
        assert.equal(moveToDeck.type, EFFECT_MOVE_TO_DECK);
        assert.equal(moveToDeck.params.target, TARGET_YOU);
        assert.equal(moveToDeck.params.cards, 'selectedCards');

        assert.deepEqual(tinyHero.params.abilities.map(({type, params}) => [
            type,
            params.trigger,
            params.condition,
            params.effect.type,
        ]), [
            [ABILITY_HERO_RESPONSE, [
                TRIGGER_YOU_DEFEAT_MINION,
                TRIGGER_YOU_DEFEAT_SIDE_SCHEME,
            ], undefined, EFFECT_DEAL_DAMAGE],
        ]);
        assert.deepEqual(hero.config.precon, [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-quintransporte', count: 1},
                    {id: 'basic-ironheart', count: 1},
                    {id: 'basic-spiderman-miles-morales', count: 1},
                    {id: 'basic-tacticas-de-enjambre', count: 1},
                    {id: 'basic-el-poder-de-todos-unidos', count: 2},
                ],
            },
            {
                aspect: CLASSIFICATION_AGGRESSION,
                cardRefs: [
                    {id: 'aggression-the-power-of-aggression', count: 2},
                    {id: 'aggression-thor', count: 1},
                    {id: 'aggression-wasp', count: 1},
                    {id: 'aggression-entrar-en-combate', count: 3},
                    {id: 'aggression-ataque-sorpresa', count: 3},
                    {id: 'aggression-centro-de-entrenamiento', count: 3},
                    {id: 'aggression-al-acecho', count: 3},
                ],
            },
        ]);
    });

    test('defines Avispa\'s nemesis encounter set', async () => {
        const {heroes} = await loadCatalog();
        const wasp = heroes.find(({_id}) => _id === 'wasp');
        const [
            ordersEntry,
            beetleEntry,
            armorEntry,
            obsessionEntry,
        ] = wasp.config.nemesis;
        const orders = ordersEntry.card;
        const beetle = beetleEntry.card;
        const armor = armorEntry.card;
        const obsession = obsessionEntry.card;

        assert.deepEqual(
            wasp.config.nemesis.map(({count, card}) => [
                count,
                card.params.name,
                card.params.image,
            ]),
            [
                [1, 'Órdenes de Madre', 'heroes/wasp/13027.png'],
                [1, 'Escarabajo', 'heroes/wasp/13028.png'],
                [1, 'Armadura de Escarabajo MK IV', 'heroes/wasp/13029.png'],
                [2, 'La obsesión de la Escarabajo', 'heroes/wasp/13030.png'],
            ],
        );
        const ordersAbility = orders.params.abilities[0];
        assert.deepEqual({
            type: orders.type,
            set: orders.params.set,
            startingThreat: orders.params.startingThreat,
            boost: orders.params.boost,
            abilityType: ordersAbility.type,
            trigger: ordersAbility.params.trigger,
            effectType: ordersAbility.params.effect.type,
            abilityCondition: ordersAbility.params.effect.params.abilityCondition,
            costResources: ordersAbility.params.effect.params.cost.params.resources,
        }, {
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            set: 'Avispa',
            startingThreat: [2, true],
            boost: 3,
            abilityType: ABILITY_CONSTANT,
            trigger: TRIGGER_ABILITY_COST,
            effectType: EFFECT_ADD_ADDITIONAL_COST,
            abilityCondition: {
                isBasic: true,
                isAttack: true,
                'card.isHero': true,
            },
            costResources: [RESOURCE_ANY],
        });

        const defeatAbility = beetle.params.abilities[0];
        assert.deepEqual({
            type: beetle.type,
            set: beetle.params.set,
            unique: beetle.params.unique,
            nemesis: beetle.params.nemesis,
            traits: beetle.params.traits,
            boost: beetle.params.boost,
            attack: beetle.params.attack,
            scheme: beetle.params.scheme,
            hitPoints: beetle.params.hitPoints,
            keywords: beetle.params.keywords,
            abilityType: defeatAbility.type,
            trigger: defeatAbility.params.trigger,
            effectType: defeatAbility.params.effect.type,
            options: defeatAbility.params.effect.params.options.map(
                ({type, params}) => [
                    type,
                    params.name,
                    params.effect.type,
                    params.effect.params,
                ],
            ),
        }, {
            type: CARD_TYPE_MINION,
            set: 'Avispa',
            unique: true,
            nemesis: true,
            traits: [TRAIT_CRIMINAL],
            boost: 2,
            attack: 1,
            scheme: 1,
            hitPoints: 4,
            keywords: {guard: true},
            abilityType: ABILITY_FORCED_INTERRUPT,
            trigger: TRIGGER_THIS_DEFEAT,
            effectType: EFFECT_CHOOSE_ABILITY,
            options: [
                [
                    ABILITY_OPTION,
                    'Gasta 1 recurso [p]',
                    EFFECT_SPEND,
                    {resources: [RESOURCE_PHYSICAL]},
                ],
                [
                    ABILITY_OPTION,
                    'Añade Escarabajo al mazo de Encuentros y barájalo',
                    EFFECT_MOVE_TO_DECK,
                    {
                        target: TARGET_ENCOUNTER_DECK,
                        position: DECK_POSITION_SHUFFLE,
                    },
                ],
            ],
        });

        const armorAbility = armor.params.abilities[0];
        assert.deepEqual({
            type: armor.type,
            set: armor.params.set,
            unique: armor.params.unique,
            traits: armor.params.traits,
            boost: armor.params.boost,
            attach: armor.params.attach,
            abilityType: armorAbility.type,
            trigger: armorAbility.params.trigger,
            effectType: armorAbility.params.effect.type,
            effectParams: armorAbility.params.effect.params,
        }, {
            type: CARD_TYPE_ATTACHMENT,
            set: 'Avispa',
            unique: true,
            traits: [TRAIT_ARMOR, TRAIT_TECH],
            boost: 2,
            attach: {
                target: TARGET_CHARACTER,
                condition: {name: 'Escarabajo'},
                fallbackTarget: TARGET_VILLAIN,
            },
            abilityType: ABILITY_CONSTANT,
            trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
            effectType: EFFECT_MODIFY_HIT_POINTS,
            effectParams: {target: TARGET_ATTACHED, count: 4},
        });

        const [alterEgoReveal, heroReveal] = obsession.params.abilities;
        const [attack, surgeIfNoAttack] =
            heroReveal.params.effect.params.effects;
        assert.deepEqual({
            count: obsessionEntry.count,
            type: obsession.type,
            set: obsession.params.set,
            name: obsession.params.name,
            boost: obsession.params.boost,
            alterEgoAbility: alterEgoReveal.type,
            alterEgoEffect: alterEgoReveal.params.effect.type,
            heroAbility: heroReveal.type,
            heroEffect: heroReveal.params.effect.type,
            attackType: attack.type,
            enemyType: attack.params.enemyType,
            enemyCondition: attack.params.condition,
            attackTarget: attack.params.target,
            attackModifier: attack.params.attackModifier,
            fallbackType: surgeIfNoAttack.type,
            fallbackCondition: surgeIfNoAttack.params.condition,
            fallbackEffect: surgeIfNoAttack.params.effect.type,
        }, {
            count: 2,
            type: CARD_TYPE_TREACHERY,
            set: 'Avispa',
            name: 'La obsesión de la Escarabajo',
            boost: 1,
            alterEgoAbility: ABILITY_WHEN_REVEALED_ALTEREGO,
            alterEgoEffect: EFFECT_SURGE,
            heroAbility: ABILITY_WHEN_REVEALED_HERO,
            heroEffect: EFFECT_CHAINED,
            attackType: EFFECT_ENEMY_ATTACK,
            enemyType: TARGET_ENEMY,
            enemyCondition: {name: 'Escarabajo'},
            attackTarget: TARGET_YOU,
            attackModifier: 1,
            fallbackType: EFFECT_DO_IF,
            fallbackCondition: {'effects.0.resolved': false},
            fallbackEffect: EFFECT_SURGE,
        });

        const gameCard = new CardsFactory({match: {triggerCards: {}}})
            .createGameCardFromConfig(obsession, {owner: {}});
        const [gameAlterEgoReveal, gameHeroReveal] = gameCard.abilities;
        const [gameAttack, gameSurgeIfNoAttack] = gameHeroReveal.effect.effects;
        assert.equal(gameAlterEgoReveal.effect.effectType, EFFECT_SURGE);
        assert.equal(typeof gameAlterEgoReveal.effect.canRun, 'function');
        assert.ok(gameAttack instanceof EnemyAttackEffect);
        assert.equal(typeof gameAttack.canRun, 'function');
        assert.equal(gameSurgeIfNoAttack.effect.effectType, EFFECT_SURGE);
        assert.equal(typeof gameHeroReveal.effect.canRun, 'function');
    });

    test('La obsesión de la Escarabajo grants surge in alter-ego form', async () => {
        const {
            alterEgoAbility,
            match,
            obsession,
            player,
        } = await createBeetleObsessionFixture({
            beetleInPlay: false,
            name: 'wasp-beetle-obsession-alter-ego',
        });
        const reveal = {surge: false};

        await alterEgoAbility.effect.runEffect({
            card: obsession,
            match,
            player,
            reveal,
        });

        assert.equal(reveal.surge, true);
    });

    test('La obsesión de la Escarabajo gains surge if its named attack cannot resolve', async () => {
        const {
            heroAbility,
            match,
            obsession,
            player,
        } = await createBeetleObsessionFixture({
            beetleInPlay: false,
            name: 'wasp-beetle-obsession-no-beetle',
        });
        const [attack] = heroAbility.effect.effects;
        const reveal = {surge: false};

        await heroAbility.effect.runEffect({
            card: obsession,
            match,
            player,
            reveal,
        });

        assert.equal(attack.resolved, false);
        assert.equal(reveal.surge, true);
    });

    test('La obsesión de la Escarabajo leaves its attack unresolved without a target context', async () => {
        const {
            heroAbility,
            match,
            obsession,
        } = await createBeetleObsessionFixture({
            beetleInPlay: true,
            name: 'wasp-beetle-obsession-no-target',
        });
        const [attack] = heroAbility.effect.effects;

        assert.equal(await attack.canRun({card: obsession, match}), false);
        assert.equal(attack.resolved, false);
    });

    test('La obsesión de la Escarabajo gains surge if the attack is skipped or canceled', async () => {
        for (const {canceled, stunned} of [
            {stunned: true},
            {canceled: true},
        ]) {
            const {
                beetle,
                heroAbility,
                match,
                obsession,
                player,
            } = await createBeetleObsessionFixture({
                beetleInPlay: true,
                name: `wasp-beetle-obsession-${canceled ? 'canceled' : 'stunned'}`,
            });
            const [attack] = heroAbility.effect.effects;
            const reveal = {surge: false};

            if (stunned) {
                beetle.stunned = 1;
            }
            if (canceled) {
                const trigger = attack.trigger.bind(attack);
                attack.trigger = async (...params) => {
                    attack.cancel();

                    return trigger(...params);
                };
            }

            await heroAbility.effect.runEffect({
                card: obsession,
                match,
                player,
                reveal,
            });

            assert.equal(attack.resolved, false);
            assert.equal(reveal.surge, true);
            if (stunned) {
                assert.equal(beetle.stunned, 0);
            }
        }
    });

    test('La obsesión de la Escarabajo attacks the named minion with +1 ATQ without surge', async () => {
        const {
            beetle,
            heroAbility,
            match,
            obsession,
            player,
        } = await createBeetleObsessionFixture({
            beetleInPlay: true,
            name: 'wasp-beetle-obsession-attack',
        });
        const [attack] = heroAbility.effect.effects;
        const hero = player.superhero.currentSide;
        const initialDamage = hero.damage;
        const reveal = {surge: false};

        await heroAbility.effect.runEffect({
            card: obsession,
            match,
            player,
            reveal,
        });

        assert.equal(attack.resolved, true);
        assert.equal(attack.enemy, beetle);
        assert.equal(attack.attackModifier, 1);
        assert.equal(hero.damage - initialDamage, 2);
        assert.equal(reveal.surge, false);
    });

    test('links the armor to Escarabajo and grants four hit points only while attached', async () => {
        const {
            armor,
            beetle,
            duplicateBeetle,
            player,
            villain,
            villainHitPoints,
        } = await createBeetleArmorFixture({
            beetleInPlay: true,
            name: 'wasp-beetle-armor',
        });

        const [armorAbility] = armor.abilities;
        assert.equal(armorAbility.effect.effectType, EFFECT_MODIFY_HIT_POINTS);
        assert.equal(typeof armorAbility.effect.canRun, 'function');
        assert.strictEqual(armor.attachedTo, beetle);
        assert.equal(duplicateBeetle.attached.length, 0);
        assert.equal(await beetle.getHitPoints({player}), 8);
        assert.equal(await villain.getHitPoints({player}), villainHitPoints);

        beetle.damage = 2;
        const beetleCard = await beetle.toObjWithAbilityAvailability(player);
        assert.deepEqual([beetleCard.hitPoints, beetleCard.life], [8, 6]);

        await armor.discard();
        assert.equal(await beetle.getHitPoints({player}), 4);
        const beetleWithoutArmor = await beetle.toObjWithAbilityAvailability(player);
        assert.deepEqual(
            [beetleWithoutArmor.hitPoints, beetleWithoutArmor.life],
            [4, 2],
        );
    });

    test('links the armor to the Villain when Escarabajo is not in play', async () => {
        const {
            armor,
            player,
            unrelatedMinion,
            villain,
            villainHitPoints,
        } = await createBeetleArmorFixture({
            beetleInPlay: false,
            name: 'wasp-beetle-armor-fallback',
        });

        assert.strictEqual(armor.attachedTo, villain);
        assert.equal(await villain.getHitPoints({player}), villainHitPoints + 4);
        assert.equal(await unrelatedMinion.getHitPoints({player}), 4);

        await armor.discard();
        assert.equal(await villain.getHitPoints({player}), villainHitPoints);
    });

    test('shuffles Escarabajo into the encounter deck when chosen on defeat', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const rhinoScenario = catalog.scenarios.find(({_id}) => _id === 'rhino');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-beetle-defeat',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        await player.initPlayer();

        const scenario = await matchFactory.createScenario({
            ...rhinoScenario.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        match.addScenario(scenario);
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        await scenario.initScenario([], false);
        match.phase = 'players';
        match.playing = true;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;

        const resource = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso físico',
                resources: [RESOURCE_PHYSICAL],
            },
        }, {owner: player});
        player.hand.addCard(resource);

        const beetleConfig = wasp.config.nemesis.find(({card}) =>
            card.params.name === 'Escarabajo').card;
        const beetle = matchFactory.cardsFactory.createGameCardFromConfig(
            beetleConfig,
            {owner: scenario},
        );
        await new RevealEncounterEffect({
            match,
            selectedTarget: beetle,
        }).runEffect({player});
        assert.equal(beetle.engaged, player);
        await beetle.initTriggers({player});

        let choiceDialogs = 0;
        match.openDialog = async ({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_LIST);
            const choices = data.options.flatMap(({triggers, ...option}) =>
                triggers?.length ? triggers : [option]);
            assert.deepEqual(choices.map(({text}) => text), [
                'Gasta 1 recurso [p]',
                'Añade Escarabajo al mazo de Encuentros y barájalo',
            ]);
            choiceDialogs++;

            return {selected: choices[1]};
        };

        const defeatEffect = new DefeatEffect({
            match,
            selectedTarget: beetle,
            target: TARGET_CARD,
        });
        await defeatEffect.runEffect({player});

        assert.equal(choiceDialogs, 1);
        assert.equal(defeatEffect.defeated, true);
        assert.equal(beetle.isInPlay, false);
        assert.ok(scenario.deck.cards.includes(beetle));
        assert.equal(scenario.deck.discardPile.includes(beetle), false);
        assert.equal(player.hand.cards.includes(resource), true);
    });

    test('adds Órdenes de Madre\'s resource cost only to a Hero basic attack', async () => {
        const {heroes} = await loadCatalog();
        const wasp = heroes.find(({_id}) => _id === 'wasp');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-mothers-orders-cost',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        await player.initPlayer();

        const orders = wasp.config.nemesis[0].card;
        const ordersCard = matchFactory.cardsFactory.createGameCardFromConfig(
            orders,
            {owner: player},
        );
        await ordersCard.initTriggers({player});
        const heroBasicAttack = new AttackBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const antManConfig = wasp.config.cards.find(({card}) =>
            card.params.name === 'Hombre Hormiga').card;
        const antMan = matchFactory.cardsFactory.createGameCardFromConfig(
            antManConfig,
            {owner: player},
        );
        const allyBasicAttack = new AttackBasicAbility({card: antMan, match});
        const nonBasicHeroAttack = new Ability({
            card: superhero.currentSide,
            labels: [LABEL_ATTACK],
            match,
        });
        const context = ability => ({
            ability,
            match,
            player,
        });

        const heroCost = await heroBasicAttack.costs.getEffect(
            context(heroBasicAttack),
        );
        assert.ok(heroCost instanceof SimultaneousEffect);
        assert.equal(heroCost.effects[0], heroBasicAttack.basicCost.effect);
        assert.equal(heroCost.effects[1].effectType, EFFECT_SPEND);
        assert.deepEqual(heroCost.effects[1].resources, [RESOURCE_ANY]);

        assert.equal(
            await allyBasicAttack.costs.getEffect(context(allyBasicAttack)),
            allyBasicAttack.basicCost.effect,
        );
        assert.equal(nonBasicHeroAttack.isBasic, false);
        assert.equal(nonBasicHeroAttack.isAttack, true);
        assert.equal(
            await nonBasicHeroAttack.costs.getEffect(
                context(nonBasicHeroAttack),
            ),
            undefined,
        );
    });

    test('adds Aguijón de avispa and the shared Partículas Pym to the deck', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const stingEntry = wasp.config.cards.find(
            ({card}) => card.params.name === 'Aguijón de avispa'
        );
        const pymParticlesEntry = wasp.config.cards.find(
            ({card}) => card.params.name === 'Partículas Pym'
        );

        assert.ok(stingEntry);
        assert.equal(stingEntry.count, 2);
        assert.equal(stingEntry.card.type, CARD_TYPE_EVENT);
        assert.deepEqual({
            name: stingEntry.card.params.name,
            set: stingEntry.card.params.set,
            image: stingEntry.card.params.image,
            cost: stingEntry.card.params.cost,
            resources: stingEntry.card.params.resources,
            classification: stingEntry.card.params.classification,
        }, {
            name: 'Aguijón de avispa',
            set: 'Avispa',
            image: 'heroes/wasp/13006.png',
            cost: 2,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_HERO,
        });

        const [giantAttack, tinyAttack] = stingEntry.card.params.abilities;
        assert.deepEqual(
            [giantAttack, tinyAttack].map(({type, params}) => [
                type,
                params.condition,
                params.labels,
                params.effect.type,
                params.effect.params,
            ]),
            [
                [
                    ABILITY_HERO_ACTION,
                    {'player.superhero.currentSide.traits': TRAIT_GIANT},
                    [LABEL_ATTACK],
                    EFFECT_DEAL_DAMAGE,
                    {
                        target: TARGET_ALL_ENEMIES,
                        damage: 4,
                        distribute: true,
                    },
                ],
                [
                    ABILITY_HERO_ACTION,
                    {'player.superhero.currentSide.traits': TRAIT_TINY},
                    [LABEL_ATTACK],
                    EFFECT_DEAL_DAMAGE,
                    {target: TARGET_ENEMY, damage: 5},
                ],
            ],
        );

        assert.ok(pymParticlesEntry);
        assert.equal(pymParticlesEntry.count, 2);
        assert.equal(pymParticlesEntry.card.type, CARD_TYPE_RESOURCE);
        assert.deepEqual({
            name: pymParticlesEntry.card.params.name,
            set: pymParticlesEntry.card.params.set,
            image: pymParticlesEntry.card.params.image,
            resources: pymParticlesEntry.card.params.resources,
            classification: pymParticlesEntry.card.params.classification,
        }, {
            name: 'Partículas Pym',
            set: 'Avispa',
            image: 'heroes/wasp/13007.png',
            resources: [RESOURCE_WILD],
            classification: CLASSIFICATION_HERO,
        });

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-sting-and-pym-particles',
        });
        const superhero = new MatchFactory(match).createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        player.initPlayer();
        const cardsFactory = new CardsFactory({match});
        const sting = cardsFactory.createGameCardFromConfig(
            stingEntry.card,
            {owner: player},
        );
        const pymParticles = cardsFactory.createGameCardFromConfig(
            pymParticlesEntry.card,
            {owner: player},
        );

        assert.deepEqual(sting.abilities.map(ability => [
            ability.abilityType,
            ability.labels,
            ability.effect.effectType,
            typeof ability.effect.canRun,
        ]), [
            [ABILITY_HERO_ACTION, [LABEL_ATTACK], EFFECT_DEAL_DAMAGE, 'function'],
            [ABILITY_HERO_ACTION, [LABEL_ATTACK], EFFECT_DEAL_DAMAGE, 'function'],
        ]);
        const [giantStingAbility, tinyStingAbility] = sting.abilities;
        sting.abilities.forEach(ability => {
            ability.effect.canRun = async () => true;
        });
        for (const {side, expectedGiant, expectedTiny} of [
            {side: 1, expectedGiant: false, expectedTiny: true},
            {side: 2, expectedGiant: true, expectedTiny: false},
        ]) {
            superhero.selectedSide = side;
            assert.equal(
                await giantStingAbility.canRun({card: sting, match, player}),
                expectedGiant,
            );
            assert.equal(
                await tinyStingAbility.canRun({card: sting, match, player}),
                expectedTiny,
            );
        }

        assert.equal(pymParticles.abilities[0].trigger, TRIGGER_THIS_SPEND);
        assert.equal(pymParticles.abilities[0].effect.effectType, EFFECT_DO_IF);
        assert.equal(typeof pymParticles.abilities[0].effect.canRun, 'function');
    });

    test('defines Crecimiento rápido and changes to Giant while boosting the used basic attribute', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const entry = wasp.config.cards.find(
            ({card}) => card.params.name === 'Crecimiento rápido'
        );
        const {card: configCard, count} = entry;

        assert.equal(count, 2);
        assert.equal(configCard.type, CARD_TYPE_EVENT);
        assert.deepEqual({
            name: configCard.params.name,
            set: configCard.params.set,
            image: configCard.params.image,
            traits: configCard.params.traits,
            cost: configCard.params.cost,
            resources: configCard.params.resources,
            classification: configCard.params.classification,
        }, {
            name: 'Crecimiento rápido',
            set: 'Avispa',
            image: 'heroes/wasp/13005.png',
            traits: [TRAIT_GIANT, TRAIT_SUPERPOWER],
            cost: 1,
            resources: [RESOURCE_ENERGY],
            classification: CLASSIFICATION_HERO,
        });
        assert.deepEqual(
            configCard.params.abilities.map(({type, params}) => [
                type,
                params.trigger,
                params.workInHand,
                params.effect.type,
            ]),
            [
                [ABILITY_HERO_INTERRUPT, TRIGGER_YOU_BASIC_THWART,
                    undefined, EFFECT_SIMULTANEOUS],
                [ABILITY_HERO_INTERRUPT, TRIGGER_YOU_BASIC_ATTACK,
                    undefined, EFFECT_SIMULTANEOUS],
                [ABILITY_HERO_INTERRUPT, TRIGGER_YOU_BASIC_DEFENSE,
                    undefined, EFFECT_SIMULTANEOUS],
            ],
        );
        assert.deepEqual(
            configCard.params.abilities.map(({params}) => {
                const [flip, bonus] = params.effect.params.effects;

                return [
                    flip.type,
                    flip.params.condition['player.superhero.currentSide.traits'],
                    flip.params.effect.type,
                    flip.params.effect.params.formTarget,
                    bonus.type,
                    bonus.params.count,
                ];
            }),
            [
                [EFFECT_DO_IF, TRAIT_TINY, EFFECT_FLIP, TARGET_HERO_SIDE,
                    EFFECT_MODIFY_THWART_VALUE, 2],
                [EFFECT_DO_IF, TRAIT_TINY, EFFECT_FLIP, TARGET_HERO_SIDE,
                    EFFECT_MODIFY_ATTACK_VALUE, 2],
                [EFFECT_DO_IF, TRAIT_TINY, EFFECT_FLIP, TARGET_HERO_SIDE,
                    EFFECT_MODIFY_DEFENSE_VALUE, 2],
            ],
        );

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-quick-growth',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.refresh = async () => {};
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        player.initPlayer();
        const card = new CardsFactory({match})
            .createGameCardFromConfig(configCard, {owner: player});

        card.controller = player;
        await card.initTriggers();

        const abilities = new Map(card.abilities.map(ability => [
            ability.trigger,
            ability,
        ]));
        const attributes = [
            {
                ability: abilities.get(TRIGGER_YOU_BASIC_THWART),
                effect: new RemoveThreatEffect({
                    match,
                    ability: {isBasic: true, character: superhero.currentSide},
                    isThwart: true,
                    threat: 1,
                }),
                property: 'modifyThwart',
            },
            {
                ability: abilities.get(TRIGGER_YOU_BASIC_ATTACK),
                effect: new DealDamageEffect({
                    match,
                    ability: {isBasic: true, character: superhero.currentSide},
                    isAttack: true,
                    damage: 1,
                }),
                property: 'modifyAttack',
            },
            {
                ability: abilities.get(TRIGGER_YOU_BASIC_DEFENSE),
                effect: new EnemyAttackEffect({match}),
                property: 'modifyDefense',
            },
        ];

        attributes.forEach(({ability}) => {
            assert.equal(ability.abilityType, ABILITY_HERO_INTERRUPT);
            assert.equal(
                card.triggers[ability.trigger][PRIORITY_INTERRUPT].length,
                1,
            );
            assert.equal(typeof ability.effect.canRun, 'function');
        });
        assert.equal(card.triggers[TRIGGER_YOUR_HERO_GET_ATTACK], undefined);
        assert.equal(card.triggers[TRIGGER_YOUR_HERO_GET_THWART], undefined);
        assert.equal(card.triggers[TRIGGER_YOUR_HERO_GET_DEFENSE], undefined);
        card.endTriggers();

        for (const {ability, effect, property} of attributes) {
            superhero.selectedSide = 1;
            await ability.effect.runEffect({match, player, effect});
            assert.equal(superhero.currentSide.id, 'wasp-giant');
            assert.equal(effect[property], 2);
        }

        superhero.selectedSide = 2;
        const giantAttack = new DealDamageEffect({
            ability: {isBasic: true, character: superhero.currentSide},
            isAttack: true,
            match,
            damage: 1,
        });
        await abilities.get(TRIGGER_YOU_BASIC_ATTACK).effect.runEffect({
            match,
            player,
            effect: giantAttack,
        });
        assert.equal(superhero.currentSide.id, 'wasp-giant');
        assert.equal(giantAttack.modifyAttack, 2);
    });

    test('offers Crecimiento rápido from hand in each basic attribute window', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const configCard = wasp.config.cards.find(({card}) =>
            card.params.name === 'Crecimiento rápido').card;
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-quick-growth-windows',
        });
        const dialogs = [];
        const resources = [];
        let resourceIndex = 0;
        let usedGrowthInCurrentWindow = false;
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            if (dialog.dialogType === DIALOG_PAY_COST) {
                const resource = resources[resourceIndex++];

                return {
                    paid: {hand: [{id: resource.id}], generators: []},
                    resources: [RESOURCE_MENTAL],
                };
            }
            if (dialog.dialogType === DIALOG_USE_CARD) {
                if (usedGrowthInCurrentWindow) {
                    return {};
                }
                usedGrowthInCurrentWindow = true;
            }

            return {selected: {id: dialog.data.cards[0].id}};
        };
        const superhero = new MatchFactory(match).createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.refresh = async () => {};
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        player.initPlayer();
        const cardsFactory = new CardsFactory({match});
        const cards = Array.from({length: 3}, (_, index) =>
            cardsFactory.createGameCardFromConfig(configCard, {
                index: index + 1,
                owner: player,
            }));
        resources.push(...Array.from({length: cards.length}, (_, index) =>
            cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {
                    name: `Recurso para Crecimiento rápido ${index + 1}`,
                    resources: [RESOURCE_MENTAL],
                },
            }, {owner: player})));
        const deckCard = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso de prueba',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.deck.addToDeck([deckCard]);

        cards.forEach(card => {
            card.controller = player;
            player.hand.addCard(card);
        });
        player.hand.addCards(resources);
        await new Promise(resolve => setImmediate(resolve));

        cards.forEach(card => {
            assert.ok(player.hand.cards.includes(card));
            assert.equal(
                card.triggers[TRIGGER_YOU_BASIC_ATTACK][PRIORITY_INTERRUPT].length,
                1,
            );
            assert.equal(
                card.triggers[TRIGGER_YOU_BASIC_THWART][PRIORITY_INTERRUPT].length,
                1,
            );
            assert.equal(
                card.triggers[TRIGGER_YOU_BASIC_DEFENSE][PRIORITY_INTERRUPT].length,
                1,
            );
        });

        const nonBasicAttack = new DealDamageEffect({
            ability: {isBasic: false},
            character: superhero.currentSide,
            isAttack: true,
            match,
            damage: 1,
        });
        nonBasicAttack.activation = new Attack({effect: nonBasicAttack});
        await nonBasicAttack.triggerInit(
            nonBasicAttack.getTriggersParams({player})
        );
        await superhero.flipToSide(2, {});
        await superhero.currentSide.getAttackValue({match, player});
        assert.equal(dialogs.length, 0);

        await superhero.flipToSide(1, {});
        const basicAttackAbility = new AttackBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const attackEffect = basicAttackAbility.effect;
        attackEffect.activation = new Attack({effect: attackEffect});
        usedGrowthInCurrentWindow = false;
        await attackEffect.triggerInit(attackEffect.getTriggersParams({player}));

        assert.equal(superhero.currentSide.id, 'wasp-giant');
        assert.equal(attackEffect.modifyAttack, 2);
        assert.equal(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_USE_CARD).length,
            2,
        );

        await superhero.flipToSide(1, {});
        const thwartAbility = new ThwartBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const thwartEffect = thwartAbility.effect;
        thwartEffect.activation = new Thwart({effect: thwartEffect});
        usedGrowthInCurrentWindow = false;
        await thwartEffect.triggerInit(thwartEffect.getTriggersParams({player}));

        assert.equal(superhero.currentSide.id, 'wasp-giant');
        assert.equal(thwartEffect.modifyThwart, 2);
        assert.equal(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_USE_CARD).length,
            4,
        );

        await superhero.flipToSide(1, {});
        const enemyAttack = new EnemyAttackEffect({
            enemy: {isInPlay: true, isVillain: false, name: 'Minion'},
            match,
            selectedTarget: player,
        });
        enemyAttack.selectAttackDefender = async () => superhero;
        const setDefender = enemyAttack.setDefender.bind(enemyAttack);
        enemyAttack.setDefender = (...params) =>
            setDefender(...params, {exhaust: false});
        usedGrowthInCurrentWindow = false;
        await enemyAttack.defense({match, player});

        assert.equal(superhero.currentSide.id, 'wasp-giant');
        assert.equal(enemyAttack.modifyDefense, 2);
        assert.equal(enemyAttack.defValue, 5);

        assert.equal(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_USE_CARD).length,
            5,
        );
        cards.forEach(card => card.endTriggers());
    });

    test('distributes an in-flight basic attack after both copies change Wasp to Giant', async () => {
        const {cards, match, player, resources, superhero} =
            await createQuickGrowthFixture({
                copies: 2,
                name: 'wasp-quick-growth-attack-distribution',
            });
        const enemies = ['first-enemy', 'second-enemy'].map(id => ({
            id,
            name: id,
            toObj() {
                return {id: this.id, name: this.name};
            },
        }));
        match.getEnemiesFor = () => enemies;

        const dialogs = [];
        let resourceIndex = 0;
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            if (dialog.dialogType === DIALOG_PAY_COST) {
                const resource = resources[resourceIndex++];

                return {
                    paid: {hand: [{id: resource.id}], generators: []},
                    resources: [RESOURCE_MENTAL],
                };
            }
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_ASSIGN) {
                const firstAmount = Math.floor(dialog.data.count / 2);

                return {
                    assigned: {
                        [enemies[0].id]: firstAmount,
                        [enemies[1].id]: dialog.data.count - firstAmount,
                    },
                };
            }

            return {};
        };
        const createEffect =
            match.effectsFactory.createEffect.bind(match.effectsFactory);
        match.effectsFactory.createEffect = config => {
            if (config.type === EFFECT_TAKE_DAMAGE) {
                const damage = Array.isArray(config.damage) ?
                    config.damage.reduce((total, amount) => total + amount, 0) :
                    config.damage;

                return {
                    defeated: false,
                    takenDamage: damage,
                    async runEffect() {},
                };
            }

            return createEffect(config);
        };

        const attackAbility = new AttackBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const attackEffect = attackAbility.effect;
        attackEffect.selectedTarget = enemies[0];
        attackEffect.activation = new Attack({effect: attackEffect});

        await attackEffect.runEffect({match, player});

        assert.equal(superhero.currentSide.id, 'wasp-giant');
        const useCardDialogs = dialogs.filter(dialog =>
            dialog.dialogType === DIALOG_USE_CARD);
        assert.deepEqual(useCardDialogs.map(({data}) =>
            data.cards.length), [2, 1]);
        assert.equal(
            useCardDialogs.length,
            2,
        );
        assert.equal(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_PAY_COST).length,
            2,
        );
        assert.ok(cards.every(card => !player.hand.cards.includes(card)));
        assert.equal(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_ASSIGN).length,
            1,
        );
        assert.equal(attackEffect.target, TARGET_ALL_ENEMIES);
        assert.equal(attackEffect.distribute, true);
        assert.deepEqual(attackEffect.selectedTarget, enemies);
        assert.deepEqual(attackEffect.damage, [3, 3]);
        cards.forEach(card => card.endTriggers());
    });

    test('distributes an in-flight basic thwart after Crecimiento rápido changes Wasp to Giant', async () => {
        const {cards, match, player, resources, superhero} =
            await createQuickGrowthFixture({
                copies: 1,
                name: 'wasp-quick-growth-thwart-distribution',
            });
        const schemes = ['first-scheme', 'second-scheme'].map(id => ({
            id,
            name: id,
            threat: 5,
            isSideScheme: true,
            canRemoveThreat() {
                return this.threat > 0;
            },
            removeThreat(amount) {
                this.threat = Math.max(0, this.threat - amount);
            },
            refresh() {},
            toObj() {
                return {
                    id: this.id,
                    name: this.name,
                    threat: this.threat,
                };
            },
        }));
        match.getSchemesFor = () => schemes;

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {hand: [{id: resources[0].id}], generators: []},
                    resources: [RESOURCE_MENTAL],
                };
            }
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_ASSIGN) {
                return {
                    assigned: {
                        [schemes[0].id]: 2,
                        [schemes[1].id]: 2,
                    },
                };
            }

            return {};
        };

        const thwartAbility = new ThwartBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const thwartEffect = thwartAbility.effect;
        thwartEffect.selectedTarget = schemes[0];
        thwartEffect.activation = new Thwart({effect: thwartEffect});

        await thwartEffect.runEffect({match, player, threat: 1});

        assert.equal(superhero.currentSide.id, 'wasp-giant');
        assert.equal(thwartEffect.target, TARGET_ALL_SCHEMES);
        assert.equal(thwartEffect.distribute, true);
        assert.equal(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_ASSIGN).length,
            1,
        );
        assert.deepEqual(schemes.map(({threat}) => threat), [3, 3]);
        cards.forEach(card => card.endTriggers());
    });

    test('defines Hombre Hormiga with the supplied card details and conditional abilities', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const [{count, card}] = wasp.config.cards;
        const [identityTraits, giantAttack, tinyThwart] = card.params.abilities;

        assert.equal(count, 1);
        assert.equal(card.type, CARD_TYPE_ALLY);
        assert.deepEqual({
            name: card.params.name,
            subtitle: card.params.subtitle,
            set: card.params.set,
            image: card.params.image,
            traits: card.params.traits,
            unique: card.params.unique,
            cost: card.params.cost,
            resources: card.params.resources,
            classification: card.params.classification,
            attack: card.params.attack,
            attackConsequential: card.params.attackConsequential,
            thwart: card.params.thwart,
            thwartConsequential: card.params.thwartConsequential,
            hitPoints: card.params.hitPoints,
        }, {
            name: 'Hombre Hormiga',
            subtitle: 'Scott Lang',
            set: 'Avispa',
            image: 'heroes/wasp/13002.png',
            traits: [TRAIT_AVENGER],
            unique: true,
            cost: 4,
            resources: [RESOURCE_WILD],
            classification: CLASSIFICATION_HERO,
            attack: 2,
            attackConsequential: 1,
            thwart: 2,
            thwartConsequential: 1,
            hitPoints: 3,
        });
        assert.equal(identityTraits.type, ABILITY_CONSTANT);
        assert.equal(identityTraits.params.trigger, undefined);
        assert.equal(identityTraits.params.effect.type, EFFECT_SIMULTANEOUS);
        assert.deepEqual(
            identityTraits.params.effect.params.effects.map(({type, params}) =>
                [type, params.target, params.trait, params.modifierCondition]),
            [
                [EFFECT_ADD_TRAIT, TARGET_THIS, TRAIT_GIANT, {
                    'card.owner.superhero.currentSide.traits': TRAIT_GIANT,
                }],
                [EFFECT_ADD_TRAIT, TARGET_THIS, TRAIT_TINY, {
                    'card.owner.superhero.currentSide.traits': TRAIT_TINY,
                }],
            ],
        );
        assert.deepEqual(
            [giantAttack, tinyThwart].map(({type, params}) => [
                type,
                params.trigger,
                params.condition,
                params.effect.type,
                params.effect.params,
            ]),
            [
                [ABILITY_CONSTANT, TRIGGER_THIS_GET_ATTACK, {
                    'player.superhero.currentSide.traits': TRAIT_GIANT,
                }, EFFECT_MODIFY_ATTACK_VALUE, {target: TARGET_EFFECT, count: 1}],
                [ABILITY_CONSTANT, TRIGGER_THIS_GET_THWART, {
                    'player.superhero.currentSide.traits': TRAIT_TINY,
                }, EFFECT_MODIFY_THWART_VALUE, {target: TARGET_EFFECT, count: 1}],
            ],
        );

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-ant-man-card-config',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        const antMan = matchFactory.cardsFactory.createGameCardFromConfig(card, {
            owner: player,
        });

        antMan.controller = player;
        antMan.refresh = async () => {};
        await antMan.initTriggers();

        const traitAbility = antMan.abilities.find(
            ({trigger, effect}) =>
                !trigger && effect.effectType === EFFECT_SIMULTANEOUS
        );
        assert.ok(traitAbility);
        for (const ability of antMan.abilities) {
            assert.equal(typeof ability.effect.canRun, 'function');
        }
        assert.equal(antMan.triggers.undefined, undefined);
        const getStats = async () => {
            const {attack, thwart} = await antMan.getEffectiveStats({player});

            return [attack, thwart];
        };

        superhero.selectedSide = 0;
        assert.deepEqual(antMan.traits, [TRAIT_AVENGER]);
        assert.deepEqual(await getStats(), [2, 2]);

        superhero.selectedSide = 1;
        assert.deepEqual(antMan.traits, [TRAIT_AVENGER, TRAIT_TINY]);
        assert.deepEqual(await getStats(), [2, 3]);

        superhero.selectedSide = 2;
        assert.deepEqual(antMan.traits, [TRAIT_AVENGER, TRAIT_GIANT]);
        assert.deepEqual(await getStats(), [3, 2]);

        antMan.endTriggers();
        antMan.controller = undefined;
        assert.deepEqual(antMan.traits, [TRAIT_AVENGER]);
        assert.deepEqual(await getStats(), [2, 2]);
    });

    test('modifies generic damage and threat-removal effects to distribute among targets', () => {
        const damageEffect = new DealDamageEffect({
            effectType: EFFECT_DEAL_DAMAGE,
            target: TARGET_ENEMY,
        });
        const threatEffect = new RemoveThreatEffect({
            target: TARGET_SCHEME,
        });
        const hero = {
            abilities: [
                {effect: damageEffect},
                {effect: threatEffect},
            ],
        };
        const modifications = [
            {
                effectTypes: [EFFECT_DEAL_DAMAGE],
                value: {target: TARGET_ALL_ENEMIES, distribute: true},
            },
            {
                effectTypes: [EFFECT_REMOVE_THREAT],
                value: {target: TARGET_ALL_SCHEMES, distribute: true},
            },
        ];

        modifications.forEach(({effectTypes, value}) => {
            const modifier = new ModifyEffectValueEffect({
                effectTypes,
                value,
            });
            modifier.selectedTarget = hero;
            modifier.execute();
        });

        assert.equal(damageEffect.target, TARGET_ALL_ENEMIES);
        assert.equal(damageEffect.distribute, true);
        assert.equal(threatEffect.target, TARGET_ALL_SCHEMES);
        assert.equal(threatEffect.distribute, true);
    });

    test('registers a single response ability for both defeat triggers', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const match = {triggerCards: {}};
        const card = new CardsFactory({match})
            .createGameCardFromConfig(wasp.config.sides[1]);

        await card.initTriggers();

        assert.equal(card.triggers[TRIGGER_YOU_DEFEAT_MINION][PRIORITY_RESPONSE].length, 1);
        assert.equal(
            card.triggers[TRIGGER_YOU_DEFEAT_SIDE_SCHEME][PRIORITY_RESPONSE].length,
            1,
        );
        assert.equal(match.triggerCards[card.id], card);
    });

    test('Pequeña pero poderosa triggers after Wasp defeats a facedown Ultron minion', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const rhinoScenario = catalog.scenarios.find(({_id}) => _id === 'rhino');
        const ultron = catalog.scenarios.find(({_id}) => _id === 'ultron');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-facedown-drone-defeat',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        await player.initPlayer();
        await superhero.initTriggers({player});
        player.gameZone.refresh = async () => {};
        player.deck.refresh = async () => {};

        const scenario = await matchFactory.createScenario({
            ...rhinoScenario.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        match.addScenario(scenario);
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        await scenario.initScenario([], false);
        match.phase = 'players';
        match.playing = true;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;

        const sourceCard = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {
                cost: 1,
                image: 'heroes/test/golpe-certero.png',
                name: 'Golpe certero',
                set: 'Test',
            },
        }, {owner: player});
        const droneConfig = ultron.config.cards.find(({card}) =>
            card.params.name === 'Dron avanzado de Ultrón').card;
        const facedownDrone = FacedownCharacterGameCard.convert(
            sourceCard,
            matchFactory.cardsFactory.createCard(droneConfig),
            'wasp-facedown-ultron-drone'
        );
        facedownDrone.controller = player;
        facedownDrone.engaged = player;
        player.gameZone.engage(facedownDrone);

        const villain = match.villain;
        const initialDamage = villain.damage;
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_USE_CARD) {
                const responseCard = dialog.data.cards.find(({abilityNames}) =>
                    abilityNames.includes('Pequeña pero poderosa'));

                if (responseCard) {
                    return {selected: {id: responseCard.id}};
                }
            }

            return {};
        };

        const defeat = new DefeatEffect({
            ability: {character: player},
            match,
            selectedTarget: facedownDrone,
        });
        await defeat.runEffect({match, player});

        assert.ok(dialogs.some(({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD &&
            data.cards.some(({abilityNames}) =>
                abilityNames.includes('Pequeña pero poderosa'))));
        assert.equal(villain.damage, initialDamage + 1);
        assert.equal(defeat.defeatedCharacterState.isMinion, true);
        assert.equal(defeat.defeatedCharacterState.isEnemy, true);
        assert.equal(defeat.defeatedCharacterState.isCharacter, true);
        assert.equal(defeat.defeatedCharacterState.type, CARD_TYPE_MINION);
        assert.ok(defeat.getTriggersEnds().includes(TRIGGER_CHARACTER_DEFEATED));
        assert.equal(sourceCard.card.type, CARD_TYPE_EVENT);

        const characterDefeatedTrigger = new CharacterDefeatedTrigger({
            card: superhero.currentSide,
            characterType: CARD_TYPE_MINION,
        });
        assert.equal(await characterDefeatedTrigger.canTrigger({
            effect: defeat,
            player,
        }), true);

        const heroAttackDefeatTrigger = new YourHeroAttackDefeatEnemyTrigger({
            card: {
                controller: player,
                id: 'wasp-test',
                isEvent: false,
                owner: player,
            },
        });
        assert.equal(await heroAttackDefeatTrigger.canTrigger({
            effect: {
                activation: {character: player},
                defeatedCharacterState: defeat.defeatedCharacterState,
                isAttack: true,
                selectedTarget: sourceCard,
            },
            player,
        }), true);
    });

    test('enables distribution only while the Giant identity is active', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const createHero = selectedSide => {
            const match = new Match({
                mc: {mcSocket: {send() {}}},
                name: `wasp-distribution-${selectedSide}`,
            });
            const matchFactory = new MatchFactory(match);
            const superhero = matchFactory.createSuperhero({
                ...wasp.config,
                cards: [],
                precon: [],
                nemesis: [],
            });
            superhero.selectedSide = selectedSide;
            const player = match.createPlayer({
                name: 'Avispa',
                superhero,
                initial: true,
            });

            return {match, player, superhero};
        };
        const tiny = createHero(1);
        const giant = createHero(2);

        await tiny.superhero.initTriggers();
        await giant.superhero.initTriggers();

        const nonBasicDamageEffect = new DealDamageEffect({
            distribute: false,
            effectType: EFFECT_DEAL_DAMAGE,
            target: TARGET_ENEMY,
        });
        const nonBasicThwartEffect = new RemoveThreatEffect({
            distribute: false,
            target: TARGET_SCHEME,
        });
        giant.superhero.currentSide.abilities.push(
            {isBasic: false, effect: nonBasicDamageEffect},
            {isBasic: false, effect: nonBasicThwartEffect},
        );

        const tinyAttack = tiny.superhero.currentSide.abilities.find(({isAttack, isBasic}) =>
            isAttack && isBasic);
        const giantAttack = giant.superhero.currentSide.abilities.find(({isAttack, isBasic}) =>
            isAttack && isBasic);
        const tinyThwart = tiny.superhero.currentSide.abilities.find(({isThwart, isBasic}) =>
            isThwart && isBasic);
        const giantThwart = giant.superhero.currentSide.abilities.find(({isThwart, isBasic}) =>
            isThwart && isBasic);

        assert.ok(tinyAttack);
        assert.ok(giantAttack);
        assert.ok(tinyThwart);
        assert.ok(giantThwart);

        await tiny.superhero.getAttackValue({
            match: tiny.match,
            player: tiny.player,
        });
        await tiny.superhero.getThwartValue({
            match: tiny.match,
            player: tiny.player,
        });
        assert.equal(tinyAttack.effectDefinition.target, TARGET_ENEMY);
        assert.equal(tinyAttack.effectDefinition.distribute, false);
        assert.equal(tinyThwart.effectDefinition.target, TARGET_SCHEME);
        assert.equal(tinyThwart.effectDefinition.distribute, false);

        await giant.superhero.getAttackValue({
            match: giant.match,
            player: giant.player,
        });
        await giant.superhero.getThwartValue({
            match: giant.match,
            player: giant.player,
        });
        assert.equal(giantAttack.effectDefinition.target, TARGET_ALL_ENEMIES);
        assert.equal(giantAttack.effectDefinition.distribute, true);
        assert.equal(giantThwart.effectDefinition.target, TARGET_ALL_SCHEMES);
        assert.equal(giantThwart.effectDefinition.distribute, true);
        assert.equal(nonBasicDamageEffect.target, TARGET_ENEMY);
        assert.equal(nonBasicDamageEffect.distribute, false);
        assert.equal(nonBasicThwartEffect.target, TARGET_SCHEME);
        assert.equal(nonBasicThwartEffect.distribute, false);
    });

    test('offers legal drop targets for Giant basic attacks and thwarts', async () => {
        const {match, player, superhero} = await createQuickGrowthFixture({
            copies: 0,
            name: 'wasp-giant-basic-activation-targets',
        });
        superhero.selectedSide = 2;
        await superhero.initTriggers();

        const enemies = ['first-enemy', 'second-enemy'].map(id => ({
            id,
            isEnemy: true,
            isMinion: true,
            hitPoints: 10,
            damage: 0,
            canBeAttacked() {
                return true;
            },
            async getLife() {
                return this.hitPoints - this.damage;
            },
            toObj() {
                return {id: this.id, name: this.id};
            },
        }));
        const schemes = ['first-scheme', 'second-scheme'].map(id => ({
            id,
            isSideScheme: true,
            threat: 5,
            canRemoveThreat() {
                return true;
            },
            toObj() {
                return {id: this.id, name: this.id, threat: this.threat};
            },
        }));
        match.getEnemiesFor = () => enemies;
        match.getSchemesFor = () => schemes;

        await superhero.getAttackValue({match, player});
        await superhero.getThwartValue({match, player});
        const abilities = await getAbilitiesWithAvailability(
            superhero,
            player
        );
        const attack = abilities.find(({isAttack, isBasic}) =>
            isAttack && isBasic);
        const thwart = abilities.find(({isThwart, isBasic}) =>
            isThwart && isBasic);

        assert.deepEqual(attack.availableTargetIds, [
            'first-enemy',
            'second-enemy',
        ]);
        assert.deepEqual(thwart.availableTargetIds, [
            'first-scheme',
            'second-scheme',
        ]);
    });

    test('uses the dropped Giant attack target to prioritize damage assignment', async () => {
        const {match, player, superhero} = await createQuickGrowthFixture({
            copies: 0,
            name: 'wasp-giant-basic-attack-drop',
        });
        superhero.selectedSide = 2;
        await superhero.initTriggers();

        const enemies = ['first-enemy', 'second-enemy'].map(id => ({
            id,
            isEnemy: true,
            isMinion: true,
            hitPoints: 10,
            damage: 0,
            canBeAttacked() {
                return true;
            },
            async getLife() {
                return this.hitPoints - this.damage;
            },
            toObj() {
                return {id: this.id, name: this.id};
            },
        }));
        match.getEnemiesFor = () => enemies;

        const attackIndex = superhero.currentSide.abilities.findIndex(
            ({isAttack, isBasic}) => isAttack && isBasic,
        );
        let assignmentDialog;
        match.openDialog = async dialog => {
            assignmentDialog = dialog;

            return {
                assigned: {
                    'first-enemy': 0,
                    'second-enemy': 2,
                },
            };
        };
        const createEffect =
            match.effectsFactory.createEffect.bind(match.effectsFactory);
        match.effectsFactory.createEffect = config => {
            if (config.type === EFFECT_TAKE_DAMAGE) {
                return {
                    defeated: false,
                    takenDamage: config.damage,
                    async runEffect() {},
                };
            }

            return createEffect(config);
        };

        await player.resolveAbility(
            superhero.id,
            attackIndex,
            'second-enemy'
        );

        assert.equal(assignmentDialog.dialogType, DIALOG_ASSIGN);
        assert.equal(assignmentDialog.data.initialTargetId, 'second-enemy');
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id}) => id),
            ['first-enemy', 'second-enemy'],
        );
    });

    test('offers damage distribution across two minions when one has Guard', async () => {
        const {match, player, superhero} = await createQuickGrowthFixture({
            copies: 0,
            name: 'wasp-giant-basic-attack-guard-minions',
        });
        superhero.selectedSide = 2;
        await superhero.initTriggers();

        const villain = {
            id: 'test-villain',
            isEnemy: true,
            isVillain: true,
            name: 'Villain',
            canBeAttacked(targetPlayer) {
                return !targetPlayer.hasGuard;
            },
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        match.scenario = {villain};

        const cardsFactory = new CardsFactory({match});
        const guardMinion = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                id: 'guard-minion',
                name: 'Guard minion',
                attack: 1,
                scheme: 1,
                hitPoints: 4,
                keywords: {guard: true},
            },
        }, {owner: match.scenario});
        const otherMinion = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                id: 'other-minion',
                name: 'Other minion',
                attack: 1,
                scheme: 1,
                hitPoints: 4,
            },
        }, {owner: match.scenario});
        player.engage(guardMinion);
        player.engage(otherMinion);

        assert.equal(guardMinion.guard, true);
        assert.equal(player.hasGuard, true);
        assert.equal(guardMinion.canBeAttacked(player), true);
        assert.equal(otherMinion.canBeAttacked(player), true);
        assert.equal(villain.canBeAttacked(player), false);

        const attackIndex = superhero.currentSide.abilities.findIndex(
            ({isAttack, isBasic}) => isAttack && isBasic,
        );
        let assignmentDialog;
        match.openDialog = async dialog => {
            assignmentDialog = dialog;

            return {
                assigned: {
                    [guardMinion.id]: 0,
                    [otherMinion.id]: 2,
                },
            };
        };
        const createEffect =
            match.effectsFactory.createEffect.bind(match.effectsFactory);
        match.effectsFactory.createEffect = config => {
            if (config.type === EFFECT_TAKE_DAMAGE) {
                return {
                    defeated: false,
                    takenDamage: config.damage,
                    async runEffect() {},
                };
            }

            return createEffect(config);
        };

        await player.resolveAbility(
            superhero.id,
            attackIndex,
            otherMinion.id
        );

        assert.equal(assignmentDialog.dialogType, DIALOG_ASSIGN);
        assert.equal(assignmentDialog.data.initialTargetId, otherMinion.id);
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id}) => id),
            [guardMinion.id, otherMinion.id],
        );
    });

    test('uses the dropped Giant thwart target to prioritize threat assignment', async () => {
        const {match, player, superhero} = await createQuickGrowthFixture({
            copies: 0,
            name: 'wasp-giant-basic-thwart-drop',
        });
        superhero.selectedSide = 2;
        await superhero.initTriggers();

        const schemes = ['first-scheme', 'second-scheme'].map(id => ({
            id,
            isSideScheme: true,
            threat: 5,
            canRemoveThreat() {
                return true;
            },
            removeThreat(threat) {
                this.threat -= threat;
            },
            refresh() {},
            toObj() {
                return {id: this.id, name: this.id, threat: this.threat};
            },
        }));
        match.getSchemesFor = () => schemes;

        const thwartIndex = superhero.currentSide.abilities.findIndex(
            ({isThwart, isBasic}) => isThwart && isBasic,
        );
        let assignmentDialog;
        match.openDialog = async dialog => {
            assignmentDialog = dialog;

            return {
                assigned: {
                    'first-scheme': 0,
                    'second-scheme': 2,
                },
            };
        };

        await player.resolveAbility(
            superhero.id,
            thwartIndex,
            'second-scheme'
        );

        assert.equal(assignmentDialog.dialogType, DIALOG_ASSIGN);
        assert.equal(assignmentDialog.data.initialTargetId, 'second-scheme');
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id}) => id),
            ['first-scheme', 'second-scheme'],
        );
    });

    test('distributes the full basic attack damage across the chosen enemies', async () => {
        let assignmentDialog;
        let damageEffect;
        const firstEnemy = {
            id: 'firstEnemy',
            toObj: () => ({id: 'firstEnemy', name: 'First enemy'}),
        };
        const secondEnemy = {
            id: 'secondEnemy',
            toObj: () => ({id: 'secondEnemy', name: 'Second enemy'}),
        };
        const match = {
            async openDialog(dialog) {
                assignmentDialog = dialog;

                return {
                    assigned: {
                        firstEnemy: 1,
                        secondEnemy: 2,
                    },
                };
            },
            effectsFactory: {
                createEffect({type, selectedTarget, damage}) {
                    assert.equal(type, EFFECT_TAKE_DAMAGE);
                    damageEffect = {selectedTarget, damage};

                    return {
                        defeated: false,
                        takenDamage: damage,
                        async runEffect() {},
                    };
                },
            },
        };
        const player = {hand: {cards: []}};
        const effect = new DealDamageEffect({
            ability: {
                isBasic: true,
                async getAttackValue() {
                    return 3;
                },
            },
            activation: {getOverkill: () => false},
            distribute: true,
            isAttack: true,
            match,
            selectedTarget: [firstEnemy, secondEnemy],
        });

        await effect.execute({match, player});

        assert.equal(assignmentDialog.dialogType, DIALOG_ASSIGN);
        assert.equal(assignmentDialog.data.count, 3);
        assert.equal(assignmentDialog.data.field, 'damage');
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id, damage}) => [id, damage]),
            [['firstEnemy', 3], ['secondEnemy', 3]],
        );
        assert.deepEqual(damageEffect, {
            selectedTarget: [firstEnemy, secondEnemy],
            damage: [1, 2],
        });
    });

    test('distributes non-attack damage across the chosen targets', async () => {
        let selectedDamage;
        const targets = [
            {id: 'first', toObj: () => ({id: 'first'})},
            {id: 'second', toObj: () => ({id: 'second'})},
        ];
        const match = {
            async openDialog() {
                return {assigned: {first: 1, second: 2}};
            },
            effectsFactory: {
                createEffect({selectedTarget, damage}) {
                    selectedDamage = {selectedTarget, damage};

                    return {async runEffect() {}, takenDamage: damage};
                },
            },
        };
        const effect = new DealDamageEffect({
            damage: 3,
            distribute: true,
            match,
            selectedTarget: targets,
        });
        effect.damage = 3;

        await effect.execute({match, player: {hand: {cards: []}}});

        assert.deepEqual(selectedDamage, {
            selectedTarget: targets,
            damage: [1, 2],
        });
    });

    test('emits a player-scoped trigger when a side scheme is defeated', () => {
        const effect = new DefeatEffect({});
        effect.defeated = true;
        effect.defeatedCharacter = {isSideScheme: true};

        assert.ok(effect.getTriggersEnds().includes(TRIGGER_YOU_DEFEAT_SIDE_SCHEME));

        const character = {id: 'wasp'};
        const trigger = new YouDefeatSideSchemeTrigger({});
        assert.equal(
            trigger.getYou({effect: {character}}),
            character,
        );
    });

    test('defines De gran ayuda and uses its Giant-only threat distribution', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const entry = wasp.config.cards.find(({card}) =>
            card.params.name === 'De gran ayuda');
        const {count, card} = entry;
        const [abilityConfig] = card.params.abilities;

        assert.equal(count, 2);
        assert.equal(card.type, CARD_TYPE_EVENT);
        assert.deepEqual({
            name: card.params.name,
            set: card.params.set,
            image: card.params.image,
            cost: card.params.cost,
            resources: card.params.resources,
            classification: card.params.classification,
        }, {
            name: 'De gran ayuda',
            set: 'Avispa',
            image: 'heroes/wasp/13003.png',
            cost: 2,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_HERO,
        });
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_THWART]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_DO_IF,
            params: {
                condition: {
                    'player.superhero.currentSide.traits': TRAIT_GIANT,
                },
                effect: {
                    type: EFFECT_ASSIGN_THREAT,
                    params: {
                        target: TARGET_ALL_SCHEMES,
                        threat: 4,
                    },
                },
                effectNot: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        threat: 3,
                    },
                },
            },
        });

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-helping-hand-card',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(card, {
            owner: player,
        });

        await gameCard.initTriggers();

        const ability = gameCard.abilities[0];
        const effect = ability.effect;
        const resolvedBranches = [];

        assert.ok(effect instanceof DoIfEffect);
        assert.ok(effect.effect instanceof AssignThreatEffect);
        assert.ok(effect.effectNot instanceof RemoveThreatEffect);
        assert.equal(effect.effect.threat, 4);
        assert.equal(effect.effect.target, TARGET_ALL_SCHEMES);
        assert.equal(effect.effectNot.threat, 3);
        assert.equal(effect.effectNot.target, TARGET_SCHEME);

        for (const [branch, name] of [
            [effect.effect, 'Giant'],
            [effect.effectNot, 'normal'],
        ]) {
            branch.canRun = async () => true;
            branch.runEffect = async () => resolvedBranches.push(name);
        }

        superhero.selectedSide = 2;
        await effect.execute({match, player});
        superhero.selectedSide = 1;
        await effect.execute({match, player});

        assert.deepEqual(resolvedBranches, ['Giant', 'normal']);
        for (const cardAbility of gameCard.abilities) {
            assert.equal(typeof cardAbility.effect.canRun, 'function');
        }
    });

    test('defines Golpe certero and resolves its Tiny-only damage and Brutality', async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const {count, card} = wasp.config.cards.find(({card}) =>
            card.params.name === 'Golpe certero');
        const [tinyAbilityConfig, otherAbilityConfig] =
            card.params.abilities;

        assert.equal(count, 3);
        assert.equal(card.type, CARD_TYPE_EVENT);
        assert.deepEqual({
            name: card.params.name,
            set: card.params.set,
            image: card.params.image,
            cost: card.params.cost,
            resources: card.params.resources,
            classification: card.params.classification,
        }, {
            name: 'Golpe certero',
            set: 'Avispa',
            image: 'heroes/wasp/13004.png',
            cost: 3,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_HERO,
        });
        assert.deepEqual(tinyAbilityConfig, {
            type: ABILITY_HERO_ACTION,
            params: {
                condition: {
                    'player.superhero.currentSide.traits': TRAIT_TINY,
                },
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        damage: 8,
                        keywords: {overkill: true},
                    },
                },
            },
        });
        assert.deepEqual(otherAbilityConfig, {
            type: ABILITY_HERO_ACTION,
            params: {
                condition: {
                    not: {
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                },
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        damage: 7,
                    },
                },
            },
        });

        const resolveForSide = async (side, expectedDamage, expectedOverkill) => {
            const match = new Match({
                mc: {mcSocket: {send() {}}},
                name: `wasp-sure-strike-${side}`,
            });
            match.persist = async () => {};
            match.refresh = async () => {};
            match.openDialog = async () => ({});
            const matchFactory = new MatchFactory(match);
            const superhero = matchFactory.createSuperhero({
                ...wasp.config,
                cards: [],
                precon: [],
                nemesis: [],
            });
            superhero.selectedSide = side;
            const player = match.createPlayer({
                name: 'Avispa',
                superhero,
                initial: true,
            });
            player.initPlayer();
            await superhero.initTriggers();
            match.currentPlayer = player;
            match.currentTurnPlayer = player;
            match.phase = 'players';
            match.playing = true;
            match.scenario = await matchFactory.createScenario({
                ...rhino.config,
                sets: [],
                defaultSets: [],
                cards: [],
            });
            await match.scenario.initScenario([], false);

            const minion = matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_MINION,
                params: {
                    name: 'Esbirro de prueba',
                    hitPoints: 5,
                    attack: 1,
                    scheme: 1,
                },
            }, {owner: match.scenario});
            await new EngageEffect({
                card: minion,
                controller: match.scenario,
                match,
                selectedTarget: player,
            }).runEffect({player});

            const event = matchFactory.cardsFactory.createGameCardFromConfig(card, {
                owner: player,
            });
            const ability = event.abilities[expectedOverkill ? 0 : 1];
            assert.equal(typeof ability.effect.canRun, 'function');
            match.openDialog = async dialog =>
                dialog.dialogType === DIALOG_SELECT_TARGET ?
                    {selected: {id: minion.id}} :
                    {};
            const prepared = await ability.prepareToResolve({
                card: event,
                match,
                player,
            });
            assert.equal(prepared.canRun, true);
            assert.equal(ability.effect.selectedTarget, minion);
            await ability.resolveAbility({
                card: event,
                match,
                player,
                ...prepared,
                selectedTarget: ability.effect.selectedTarget,
            });

            assert.equal(ability.resolved, true);
            const attackEffect = ability.effect;
            assert.equal(attackEffect.overkill, expectedOverkill);
            assert.deepEqual(
                attackEffect.damage,
                expectedOverkill ? [expectedDamage, 3] : expectedDamage,
            );
            assert.equal(match.villain.damage >= 3, expectedOverkill);
        };

        await resolveForSide(1, 8, true);
        await resolveForSide(2, 7, false);
    });

    test('adds Entrenamiento en la Sala Roja, Alas biosintéticas, and Casco de la Avispa', async () => {
        const wasp = waspHero;
        const entries = [
            ['Entrenamiento en la Sala Roja', 1, 'heroes/wasp/13008.png'],
            ['Alas biosintéticas', 1, 'heroes/wasp/13009.png'],
            ['Casco de la Avispa', 1, 'heroes/wasp/13010.png'],
        ].map(([name, count, image]) => {
            const entry = wasp.config.cards.find(({card}) =>
                card.params.name === name);

            assert.ok(entry, `Missing ${name}`);
            assert.equal(entry.count, count);
            assert.equal(entry.card.type, CARD_TYPE_UPGRADE);
            assert.equal(entry.card.params.image, image);
            assert.equal(entry.card.params.cost, 2);
            assert.equal(entry.card.params.classification, CLASSIFICATION_HERO);
            return entry.card;
        });
        const [training, wings, helmet] = entries;

        assert.deepEqual(training.params.traits, [TRAIT_SKILL]);
        assert.deepEqual(training.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(training.params.unique, undefined);
        assert.deepEqual(training.params.abilities.map(({type, params}) => [
            type,
            params.trigger,
            params.condition,
            params.effect.type,
            params.effect.params,
        ]), [
            [
                ABILITY_CONSTANT,
                undefined,
                undefined,
                EFFECT_ADD_KEYWORD,
                {
                    target: TARGET_YOUR_SUPERHERO,
                    keyword: {retaliate: 1},
                    modifierCondition: {'card.traits': TRAIT_GIANT},
                },
            ],
            [
                ABILITY_CONSTANT,
                TRIGGER_YOU_ATTACK,
                {
                    'effect.ability.isBasic': true,
                    'player.superhero.currentSide.traits': TRAIT_TINY,
                },
                EFFECT_MODIFY_ATTACK,
                {
                    target: TARGET_EFFECT,
                    modify: {keywords: {piercing: true}},
                },
            ],
        ]);

        assert.deepEqual(wings.params.traits, [TRAIT_ITEM, TRAIT_TECH]);
        assert.equal(wings.params.unique, true);
        assert.deepEqual(wings.params.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(wings.params.abilities.map(({type, params}) => [
            type,
            params.trigger,
            params.triggerParams,
            params.condition,
            params.arrow?.type,
            params.arrow?.params,
            params.effect.type,
            params.effect.params,
        ]), [
            [
                ABILITY_CONSTANT,
                TRIGGER_CONDITION_GET_TRAITS,
                {
                    conditionTrigger: {name: 'Avispa'},
                    conditionSource: 'effect.selectedTarget',
                },
                undefined,
                undefined,
                undefined,
                EFFECT_MODIFY_TRAITS,
                {target: TARGET_EFFECT, traits: [TRAIT_AERIAL]},
            ],
            [
                ABILITY_HERO_INTERRUPT,
                TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                {target: TARGET_YOUR_SUPERHERO},
                {'player.superhero.currentSide.traits': TRAIT_TINY},
                EFFECT_EXHAUST,
                {target: TARGET_THIS},
                EFFECT_PREVENT_DAMAGE,
                {target: TARGET_EFFECT, damage: 1},
            ],
        ]);

        assert.deepEqual(helmet.params.traits, [TRAIT_ARMOR, TRAIT_TECH]);
        assert.equal(helmet.params.unique, true);
        assert.deepEqual(helmet.params.resources, [RESOURCE_PHYSICAL]);
        assert.deepEqual(helmet.params.abilities.map(({type, params}) => [
            type,
            params.trigger,
            params.condition,
            params.effect.type,
            params.effect.params,
        ]), [
            [
                ABILITY_CONSTANT,
                TRIGGER_YOUR_HERO_GET_THWART,
                {'player.superhero.currentSide.traits': TRAIT_GIANT},
                EFFECT_MODIFY_THWART_VALUE,
                {target: TARGET_EFFECT, count: 1},
            ],
            [
                ABILITY_CONSTANT,
                TRIGGER_YOUR_HERO_GET_ATTACK,
                {'player.superhero.currentSide.traits': TRAIT_TINY},
                EFFECT_MODIFY_ATTACK_VALUE,
                {target: TARGET_EFFECT, count: 1},
            ],
        ]);
    });

    test('applies the new upgrades to Avispa in the matching identity and timing windows', async () => {
        const wasp = waspHero;
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-new-upgrades',
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...wasp.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        match.scenario = await matchFactory.createScenario({
            ...rhino.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        await match.scenario.initScenario([], false);
        await player.initPlayer();

        const addUpgrade = async name => {
            const config = wasp.config.cards.find(({card}) =>
                card.params.name === name).card;
            const upgrade = matchFactory.cardsFactory.createGameCardFromConfig(
                config,
                {owner: player},
            );
            player.addToGameZone(upgrade);
            await upgrade.initTriggers({player});

            for (const ability of upgrade.abilities) {
                assert.equal(typeof ability.effect.canRun, 'function');
            }

            return upgrade;
        };
        const training = await addUpgrade('Entrenamiento en la Sala Roja');
        const wings = await addUpgrade('Alas biosintéticas');
        const helmet = await addUpgrade('Casco de la Avispa');

        assert.equal(superhero.getKeyword('retaliate'), 0);
        assert.equal(await superhero.currentSide.getAttackValue({player}), 2);
        assert.equal(await superhero.currentSide.getThwartValue({player}), 1);
        assert.ok((await superhero.getEffectiveTraits({player})).includes(TRAIT_AERIAL));

        superhero.selectedSide = 2;
        assert.equal(superhero.getKeyword('retaliate'), 1);
        assert.equal(await superhero.currentSide.getAttackValue({player}), 2);
        assert.equal(await superhero.currentSide.getThwartValue({player}), 3);
        assert.ok((await superhero.getEffectiveTraits({player})).includes(TRAIT_AERIAL));

        superhero.selectedSide = 1;
        const basicAttackAbility = new AttackBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const basicAttack = basicAttackAbility.effect;
        basicAttack.selectedTarget = {isEnemy: true};
        basicAttack.isAttack = true;
        await basicAttack.triggerInit(basicAttack.getTriggersParams({match, player}));
        assert.equal(basicAttack.piercing, true);

        const nonBasicAttack = new DealDamageEffect({
            ability: {
                card: superhero,
                character: superhero,
                isAttack: true,
                isBasic: false,
            },
            damage: 1,
            match,
            selectedTarget: {isEnemy: true},
        });
        await nonBasicAttack.prepare({match, player});
        await nonBasicAttack.triggerInit(
            nonBasicAttack.getTriggersParams({match, player}),
        );
        assert.equal(nonBasicAttack.piercing, false);

        const incomingDamage = new TakeDamageEffect({
            damage: 3,
            match,
            selectedTarget: superhero.currentSide,
        });
        const preventionAbility = wings.abilities.find(({trigger}) =>
            trigger === TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE);
        const trigger = new CharacterWouldTakeDamageTrigger({
            ability: preventionAbility,
            card: wings,
            target: TARGET_YOUR_SUPERHERO,
        });
        const triggerParams = trigger.getAbilityParams(
            incomingDamage.getTriggersParams({match, player}),
        );
        assert.equal(await preventionAbility.canRun(triggerParams), true);
        await preventionAbility.resolveAbility(triggerParams);
        assert.equal(wings.exhausted, true);
        assert.equal(incomingDamage.preventDamage, 1);
        assert.equal(incomingDamage.takenDamage, 2);

        await wings.remove();
        assert.ok(!(await superhero.getEffectiveTraits({player})).includes(TRAIT_AERIAL));
        assert.equal(training.isInPlay, true);
        assert.equal(helmet.isInPlay, true);
    });
});
