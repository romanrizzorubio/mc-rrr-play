import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    CALC_BOOST_ICONS,
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_VILLAIN,
    DIALOG_USE_CARD,
    DIALOG_LIST,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_FOR_EACH,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    PRIORITY_FORCED_RESPONSE,
    PLACE_ENCOUNTER_DECK_CARDS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_PLAYERS,
    TARGET_ENEMY,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_SCENARIO,
    TARGET_YOU,
    TRAIT_CAPTIVE,
    TRAIT_HEROFORHIRE,
    TRAIT_HYDRA,
    TRAIT_MERCENARY,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_THIS_ATTACK,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {normalizeCatalog} from '../../../mc-data/seed/normalize.js';
import {FlipEffect} from '../../src/effects/flip-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {BoostAbility} from '../../src/abilities/misc/boost-ability.js';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {ResponseAbility} from '../../src/abilities/response/response-ability.js';
import {WhenRevealedAbility} from '../../src/abilities/when/when-revealed-ability.js';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Deck} from '../../src/model/match/deck.js';

const createTaskmasterScenario = async (players = [], scenarioConfigOverrides = {}) => {
    const {scenarios, sets} = await loadCatalog();
    const taskmaster = scenarios.find(({_id}) => _id === 'taskmaster');

    assert.ok(taskmaster);

    const setConfigs = new Map(sets.map(({_id, config}) => [_id, config]));
    const match = new Match({
        mc: {
            data: {
                async getSetConfig(id) {
                    const config = setConfigs.get(id);
                    assert.ok(config, `Missing test set "${id}".`);
                    return config;
                },
            },
            mcSocket: {send() {}},
        },
        name: 'taskmaster-test',
    });
    match.openDialog = async ({data, dialogType}) =>
        dialogType === DIALOG_USE_CARD ?
            {selected: data.cards[0]} :
            {};
    match.players = players;

    const factory = new MatchFactory(match);
    const scenario = await factory.createScenario({
        ...taskmaster.config,
        ...scenarioConfigOverrides,
    });
    match.scenario = scenario;

    return {match, scenario, sets, taskmaster};
};

const createPlayer = ({initial = false} = {}) => {
    const alterEgoSide = {
        isHero: false,
        isTough: false,
        async refresh() {},
        removeTough() {},
    };
    const heroSide = {
        isHero: true,
        isTough: false,
        async refresh() {},
        removeTough() {},
    };
    const superhero = {
        endTriggers() {},
        async initTriggers() {},
        async refresh() {},
        owner: undefined,
        selectedSide: 0,
        sides: [alterEgoSide, heroSide],
        get currentSide() {
            return this.sides[this.selectedSide];
        },
        get isHero() {
            return this.currentSide.isHero;
        },
    };
    const player = {
        damage: 0,
        gameZone: {
            cards: [],
            encounterCards: [],
            minions: [],
            dealEncounterCard(cards) {
                this.encounterCards.push(...cards);
            },
            async refresh() {},
        },
        hand: {
            cards: [],
            async refresh() {},
        },
        initial,
        isPlayer: true,
        superhero,
        toObj() {
            return {name: 'taskmaster'};
        },
        async canFlip() {
            return true;
        },
        async getLife() {
            return 15 - this.damage;
        },
        async refresh() {},
        placeDamage(damage) {
            this.damage += damage;
        },
        get isHero() {
            return superhero.isHero;
        },
    };
    superhero.owner = player;

    return {alterEgoSide, heroSide, player, superhero};
};

test('Supervisor catalog defines villain stages and set-aside hirelings', async () => {
    const {scenario, sets, taskmaster} = await createTaskmasterScenario();

    assert.equal(taskmaster.name, 'Supervisor');
    assert.equal(taskmaster.folder, 'taskmaster');
    assert.deepEqual(taskmaster.config.villains.map(({type, params}) => [
        type,
        params.name,
        params.stage,
        params.scheme,
        params.attack,
        params.hitPoints,
        params.image,
        params.boost,
        params.unique,
    ]), [
        [CARD_TYPE_VILLAIN, 'Supervisor', 1, 1, 2, [13, true], 'scenarios/taskmaster/04093.png', 0, true],
        [CARD_TYPE_VILLAIN, 'Supervisor', 2, 2, 2, [16, true], 'scenarios/taskmaster/04094.png', 0, true],
        [CARD_TYPE_VILLAIN, 'Supervisor', 3, 3, 3, [17, true], 'scenarios/taskmaster/04095.png', 0, true],
    ]);
    assert.deepEqual(
        taskmaster.config.villains.map(({params}) => params.traits),
        [
            [TRAIT_HYDRA, TRAIT_MERCENARY],
            [TRAIT_HYDRA, TRAIT_MERCENARY],
            [TRAIT_HYDRA, TRAIT_MERCENARY],
        ]
    );
    assert.deepEqual(
        taskmaster.config.setAsideCards.map(({count, card}) => {
            const {params} = card;
            const response = params.abilities[0];

            return {
                count,
                type: card.type,
                name: params.name,
                subtitle: params.subtitle,
                set: params.set,
                image: params.image,
                traits: params.traits,
                unique: params.unique,
                cost: params.cost,
                resources: params.resources,
                attack: params.attack,
                attackConsequential: params.attackConsequential,
                thwart: params.thwart,
                thwartConsequential: params.thwartConsequential,
                hitPoints: params.hitPoints,
                ability: {
                    type: response.type,
                    trigger: response.params.trigger,
                    condition: response.params.condition,
                    arrow: {
                        type: response.params.arrow.type,
                        resources: response.params.arrow.params.resources,
                    },
                    effect: {
                        type: response.params.effect.type,
                        params: response.params.effect.params,
                    },
                },
            };
        }),
        [
            {
                count: 1,
                type: CARD_TYPE_ALLY,
                name: 'Caballero Luna',
                subtitle: 'Marc Spector',
                set: 'taskmaster',
                image: 'scenarios/taskmaster/04097.png',
                traits: [TRAIT_CAPTIVE, TRAIT_HEROFORHIRE],
                unique: true,
                cost: 0,
                resources: [RESOURCE_WILD],
                attack: 2,
                attackConsequential: 1,
                thwart: 2,
                thwartConsequential: 1,
                hitPoints: 3,
                ability: {
                    type: ABILITY_RESPONSE,
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {'effect.card.name': 'Caballero Luna'},
                    arrow: {
                        type: EFFECT_SPEND,
                        resources: [RESOURCE_WILD],
                    },
                    effect: {
                        type: EFFECT_DRAW_CARD,
                        params: {target: TARGET_YOU, count: 2},
                    },
                },
            },
            {
                count: 1,
                type: CARD_TYPE_ALLY,
                name: 'Shang-Chi',
                subtitle: undefined,
                set: 'taskmaster',
                image: 'scenarios/taskmaster/04098.png',
                traits: [TRAIT_CAPTIVE, TRAIT_HEROFORHIRE],
                unique: true,
                cost: 0,
                resources: [RESOURCE_WILD],
                attack: 2,
                attackConsequential: 1,
                thwart: 2,
                thwartConsequential: 1,
                hitPoints: 3,
                ability: {
                    type: ABILITY_RESPONSE,
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {'effect.card.name': 'Shang-Chi'},
                    arrow: {
                        type: EFFECT_SPEND,
                        resources: [RESOURCE_ENERGY],
                    },
                    effect: {
                        type: EFFECT_STUN,
                        params: {target: TARGET_ENEMY},
                    },
                },
            },
            {
                count: 1,
                type: CARD_TYPE_ALLY,
                name: 'Tigre Blanco',
                subtitle: 'Angela Del Toro',
                set: 'taskmaster',
                image: 'scenarios/taskmaster/04099.png',
                traits: [TRAIT_CAPTIVE, TRAIT_HEROFORHIRE],
                unique: true,
                cost: 0,
                resources: [RESOURCE_WILD],
                attack: 1,
                attackConsequential: 1,
                thwart: 3,
                thwartConsequential: 1,
                hitPoints: 3,
                ability: {
                    type: ABILITY_RESPONSE,
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {'effect.card.name': 'Tigre Blanco'},
                    arrow: {
                        type: EFFECT_SPEND,
                        resources: [RESOURCE_MENTAL],
                    },
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {target: TARGET_SCHEME, threat: 3},
                    },
                },
            },
            {
                count: 1,
                type: CARD_TYPE_ALLY,
                name: 'Elektra',
                subtitle: undefined,
                set: 'taskmaster',
                image: 'scenarios/taskmaster/04100.png',
                traits: [TRAIT_CAPTIVE, TRAIT_HEROFORHIRE],
                unique: true,
                cost: 0,
                resources: [RESOURCE_WILD],
                attack: 3,
                attackConsequential: 1,
                thwart: 1,
                thwartConsequential: 1,
                hitPoints: 3,
                ability: {
                    type: ABILITY_RESPONSE,
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {'effect.card.name': 'Elektra'},
                    arrow: {
                        type: EFFECT_SPEND,
                        resources: [RESOURCE_PHYSICAL],
                    },
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {target: TARGET_ENEMY, damage: 3},
                    },
                },
            },
        ]
    );
    assert.equal(scenario.apart.length, 4);
    for (const card of scenario.apart) {
        const ability = card.abilities.find(candidate =>
            candidate.trigger === TRIGGER_YOU_END_PLAY_CARD);

        assert.ok(ability instanceof ResponseAbility);
        assert.equal(ability.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.ok(ability.effect);
        assert.equal(Array.isArray(ability.effect), false);
        assert.equal(typeof ability.effect.canRun, 'function');

        const originalCanPay = ability.costs.canPay;
        const originalCanRun = ability.effect.canRun;
        try {
            ability.costs.canPay = async () => true;
            ability.effect.canRun = async () => true;

            assert.equal(await ability.canTrigger({
                match: scenario.match,
                player: createPlayer().player,
                effect: new PlayCardEffect({card, match: scenario.match}),
            }), true);
            assert.equal(await ability.canTrigger({
                match: scenario.match,
                player: createPlayer().player,
                effect: new PlayCardEffect({
                    card: {name: 'Otra carta'},
                    match: scenario.match,
                }),
            }), false);
        } finally {
            ability.costs.canPay = originalCanPay;
            ability.effect.canRun = originalCanRun;
        }
    }
    const [stage1A, stage1B] = taskmaster.config.mainSchemes[0];
    assert.equal(stage1A.type, CARD_TYPE_MAIN_SCHEME_A_CARD);
    assert.equal(stage1A.params.name, 'A la caza del héroe');
    assert.equal(stage1A.params.image, 'scenarios/taskmaster/04096a.png');
    assert.equal(stage1A.params.stage, 1);
    assert.deepEqual(stage1A.params.content, {
        villains: [1, 2],
        villainsExpert: [2, 3],
    });
    assert.equal(stage1B.type, CARD_TYPE_MAIN_SCHEME_B_CARD);
    assert.equal(stage1B.params.name, 'A la caza del héroe');
    assert.equal(stage1B.params.image, 'scenarios/taskmaster/04096b.png');
    assert.equal(stage1B.params.stage, 1);
    assert.deepEqual(stage1B.params.startingThreat, [1, true]);
    assert.deepEqual(stage1B.params.acceleration, [1, true]);
    assert.deepEqual(stage1B.params.value, [12, true]);
    assert.equal(stage1B.params.final, true);
    assert.deepEqual(taskmaster.config.cards.map(({count, card}) => [
        count,
        card.type,
        card.params.name,
        card.params.set,
        card.params.image,
        card.params.traits,
        card.params.attack,
        card.params.scheme,
        card.params.hitPoints,
        card.params.boost,
        card.params.keywords,
    ]), [[
        2,
        CARD_TYPE_MINION,
        'Cazador de Hydra',
        'taskmaster',
        'scenarios/taskmaster/04101.png',
        [TRAIT_HYDRA],
        2,
        2,
        3,
        0,
        undefined,
    ]]);
    const attackKeywords = taskmaster.config.cards[0].card.params.abilities[0];
    assert.equal(attackKeywords.type, ABILITY_CONSTANT);
    assert.equal(attackKeywords.params.trigger, TRIGGER_THIS_ATTACK);
    assert.deepEqual(attackKeywords.params.effect, {
        type: EFFECT_MODIFY_ATTACK,
        params: {
            target: TARGET_EFFECT,
            modify: {
                keywords: {
                    ranged: true,
                    piercing: true,
                },
            },
        },
    });
    const hydraHunterBoost = taskmaster.config.cards[0].card.params.boostAbility;
    assert.equal(hydraHunterBoost.type, ABILITY_BOOST);
    assert.deepEqual(hydraHunterBoost.params.effect, {
        type: EFFECT_DO_IF,
        params: {
            condition: {'player.isHero': true},
            effect: {
                type: EFFECT_TAKE_DAMAGE,
                params: {
                    target: TARGET_YOU,
                    damage: 1,
                },
            },
            effectNot: {
                type: EFFECT_PLACE_THREAT,
                params: {
                    target: TARGET_MAIN_SCHEME,
                    threat: 1,
                },
            },
        },
    });
    assert.deepEqual(taskmaster.config.sets, ['standard', 'hydra-patrol']);
    assert.deepEqual(taskmaster.config.defaultSets, ['weapon-master']);

    const registeredSetIds = new Set(sets.map(({_id}) => _id));
    const configuredSetIds = [
        ...taskmaster.config.sets,
        ...taskmaster.config.defaultSets,
    ];
    assert.ok(configuredSetIds.every(id => registeredSetIds.has(id)));
    assert.equal(configuredSetIds.includes(taskmaster._id), false);

    const setupConfig = stage1A.params.abilities[0];
    assert.equal(setupConfig.type, ABILITY_SETUP);
    const [
        searchHydraPatrol,
        shuffleEncounterDeck,
    ] = setupConfig.params.effect.params.effects;
    assert.equal(setupConfig.params.effect.params.effects.length, 2);
    assert.equal(searchHydraPatrol.type, EFFECT_SEARCH_CARD_REVEAL);
    assert.deepEqual(searchHydraPatrol.params.condition, {
        name: 'Patrulla de Hydra',
        type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    });
    assert.deepEqual(searchHydraPatrol.params.places, [
        PLACE_ENCOUNTER_DECK_CARDS,
    ]);
    assert.equal(shuffleEncounterDeck.type, EFFECT_SHUFFLE_DECK);
    assert.equal(shuffleEncounterDeck.params.target, TARGET_SCENARIO);

    const forcedResponseConfig = stage1B.params.abilities[0];
    assert.equal(forcedResponseConfig.type, ABILITY_FORCED_RESPONSE);
    assert.equal(forcedResponseConfig.params.trigger, TRIGGER_VILLAIN_PHASE_STEP);
    assert.deepEqual(forcedResponseConfig.params.condition, {step: 1});
    const forcedResponseEffect = forcedResponseConfig.params.effect;
    assert.equal(forcedResponseEffect.type, EFFECT_CHAINED);
    const chooseForEachHero = forcedResponseEffect.params.effects[0];
    assert.equal(chooseForEachHero.type, EFFECT_FOR_EACH);
    assert.equal(chooseForEachHero.params.target, TARGET_ALL_PLAYERS);
    assert.deepEqual(chooseForEachHero.params.condition, {isHero: true});
    const chooseThreatOrDamage = chooseForEachHero.params.effect;
    assert.equal(chooseThreatOrDamage.type, EFFECT_CHOOSE);
    chooseThreatOrDamage.params.options.forEach((option, index) => {
        assert.equal(option.type, [
            EFFECT_PLACE_THREAT,
            EFFECT_TAKE_DAMAGE,
        ][index]);
        assert.equal(option.params.target, [
            TARGET_MAIN_SCHEME,
            TARGET_YOU,
        ][index]);
        assert.equal(option.params.threat ?? option.params.damage, 1);
        assert.equal(typeof option.params.title, 'string');
    });

    const responseConfig = taskmaster.config.villains[0].params.abilities[0];
    assert.equal(responseConfig.type, ABILITY_FORCED_RESPONSE);
    assert.equal(responseConfig.params.trigger, TRIGGER_SUPERHERO_FLIPS);
    assert.deepEqual(responseConfig.params.condition, {'triggeredCard.isHero': true});
    assert.equal(responseConfig.params.effect.type, EFFECT_CHAINED);
    const [discardConfig, damageConfig] = responseConfig.params.effect.params.effects;
    assert.equal(discardConfig.type, EFFECT_DISCARD_FROM_DECK);
    assert.equal(discardConfig.params.target, TARGET_ENCOUNTER_DECK);
    assert.equal(discardConfig.params.count, 1);
    assert.equal(damageConfig.type, EFFECT_TAKE_DAMAGE);
    assert.equal(damageConfig.params.target, TARGET_YOU);
    assert.deepEqual(damageConfig.params.paramsCalc, {
        formula: CALC_BOOST_ICONS,
        target: 'effects.0.cards',
    });

    taskmaster.config.villains.slice(1).forEach(({params}) => {
        const [response, reveal] = params.abilities;
        assert.equal(response.type, ABILITY_FORCED_RESPONSE);
        assert.equal(reveal.type, ABILITY_WHEN_REVEALED);
        assert.equal(reveal.params.effect.type, EFFECT_FOR_EACH);
        assert.equal(reveal.params.effect.params.target, TARGET_ALL_PLAYERS);
        assert.equal(reveal.params.effect.params.effect.type, EFFECT_DEAL_ENCOUNTER);
        assert.equal(reveal.params.effect.params.effect.params.target, TARGET_ALL_PLAYERS);
    });

    assert.equal(scenario.villains.length, 3);
    assert.equal(scenario.mainSchemes.length, 1);
    [...scenario.villains, ...scenario.mainSchemes].forEach(card => {
        const sides = card.sides.length ? card.sides : [card];
        sides.forEach(side => side.abilities.forEach(ability => {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        }));
    });
    assert.ok(scenario.villains.every(villain =>
        villain.abilities[0] instanceof ForcedResponseAbility));
    assert.ok(scenario.villains.slice(1).every(villain =>
        villain.abilities[1] instanceof WhenRevealedAbility));
});

test('Cazador de Hydra grants Ranged and Piercing to its attacks and branches its boost by identity', async () => {
    const {player, superhero} = createPlayer({initial: true});
    const {match, scenario} = await createTaskmasterScenario([player]);
    player.match = match;
    match.refresh = async () => {};
    match.persist = async () => {};

    await scenario.initScenario([], false);

    const hunters = scenario.deck.cards.filter(card =>
        card.name === 'Cazador de Hydra');
    assert.equal(hunters.length, 2);

    hunters.forEach(({abilities, boostAbility, piercing, ranged}) => {
        assert.equal(ranged, false);
        assert.equal(piercing, false);
        assert.ok(abilities[0] instanceof ConstantAbility);
        assert.equal(abilities[0].trigger, TRIGGER_THIS_ATTACK);
        assert.equal(abilities[0].effect.effectType, EFFECT_MODIFY_ATTACK);
        assert.equal(typeof abilities[0].effect.canRun, 'function');
        assert.ok(boostAbility instanceof BoostAbility);
        assert.equal(boostAbility.effect.effectType, EFFECT_DO_IF);
        assert.equal(typeof boostAbility.effect.canRun, 'function');
    });

    const [hunter] = hunters;
    const attack = new EnemyAttackEffect({
        enemy: hunter,
        match,
        selectedTarget: player,
    });
    await hunter.abilities[0].resolveAbility({
        effect: attack,
        match,
        player,
    });
    assert.equal(attack.ranged, true);
    assert.equal(attack.piercing, true);

    const startingThreat = scenario.mainScheme.threat;
    await hunter.boostAbility.effect.runEffect({match, player});
    assert.equal(scenario.mainScheme.threat, startingThreat + 1);

    superhero.selectedSide = 1;
    await hunter.boostAbility.effect.runEffect({match, player});
    assert.equal(player.damage, 1);
});

test('Scenario config normalizes and initializes set-aside cards outside the encounter deck', async () => {
    const {scenarios} = await loadCatalog();
    const taskmaster = scenarios.find(({_id}) => _id === 'taskmaster');
    assert.ok(taskmaster);
    const [normalizedScenario] = normalizeCatalog({
        aspects: [],
        heroes: [],
        scenarios: [{
            config: {
                villains: [],
                mainSchemes: [],
                cards: [],
                setAsideCards: taskmaster.config.setAsideCards,
            },
        }],
        sets: [],
    }).scenarios;
    const firstPlayer = createPlayer({initial: true}).player;
    const secondPlayer = createPlayer().player;
    const {match, scenario} = await createTaskmasterScenario(
        [firstPlayer, secondPlayer],
        {setAsideCards: normalizedScenario.config.setAsideCards}
    );

    [firstPlayer, secondPlayer].forEach(player => {
        player.match = match;
        player.deck = new Deck({owner: player, isPlayerDeck: true});
        player.deck.initDeck([]);
    });
    match.refresh = async () => {};
    match.persist = async () => {};

    assert.deepEqual(
        scenario.apart.map(({name}) => name).sort(),
        ['Caballero Luna', 'Elektra', 'Shang-Chi', 'Tigre Blanco']
    );

    await scenario.initScenario([], false);

    assert.deepEqual(
        scenario.apart.map(({name}) => name).sort(),
        ['Caballero Luna', 'Elektra', 'Shang-Chi', 'Tigre Blanco']
    );
    assert.ok(scenario.apart.every(card => card.owner === scenario));
    assert.ok(scenario.apart.every(card => card.isAlly));
    assert.equal(
        scenario.deck.cards.some(card =>
            ['Caballero Luna', 'Elektra', 'Shang-Chi', 'Tigre Blanco'].includes(card.name)),
        false
    );
    assert.deepEqual(firstPlayer.deck.cards, []);
    assert.deepEqual(secondPlayer.deck.cards, []);
});

test('Taskmaster setup puts Hydra Patrol into play', async () => {
    const firstPlayer = createPlayer({initial: true}).player;
    const secondPlayer = createPlayer().player;
    const {match, scenario} = await createTaskmasterScenario([
        firstPlayer,
        secondPlayer,
    ]);

    [firstPlayer, secondPlayer].forEach(player => {
        player.match = match;
        player.deck = new Deck({owner: player, isPlayerDeck: true});
        player.deck.initDeck([]);
    });
    match.refresh = async () => {};
    match.persist = async () => {};

    await scenario.initScenario([], false);

    assert.deepEqual(firstPlayer.deck.cards, []);
    assert.deepEqual(secondPlayer.deck.cards, []);
    assert.equal(
        scenario.sideSchemes.filter(card =>
            card.currentSide.name === 'Patrulla de Hydra').length,
        1
    );
    assert.equal(
        scenario.deck.cards.some(card =>
            card.currentSide?.name === 'Patrulla de Hydra'),
        false
    );
});

test('Stage 1B resolves its forced choice after villain phase step one each round for hero players only', async () => {
    const heroPlayer = createPlayer({initial: true});
    const alterEgoPlayer = createPlayer();
    heroPlayer.superhero.selectedSide = 1;
    const {match, scenario} = await createTaskmasterScenario([
        heroPlayer.player,
        alterEgoPlayer.player,
    ]);

    match.refresh = async () => {};
    match.persist = async () => {};
    await scenario.initScenario([], false);
    assert.ok(
        match.triggerCards[scenario.gameZone.currentScheme.id]
            ?.triggers[TRIGGER_VILLAIN_PHASE_STEP]?.[PRIORITY_FORCED_RESPONSE]
    );

    let choiceCount = 0;
    match.openDialog = async ({data, dialogType}) => {
        if (dialogType === DIALOG_LIST) {
            choiceCount++;
            return {selected: {id: 1}};
        }
        if (dialogType === DIALOG_USE_CARD) {
            return {selected: data.cards[0]};
        }

        return {};
    };
    match.playing = true;

    const phase = new PlayVillainPhaseEffect({match});
    let expectedChoiceCount = 1;
    phase.stepAccelerateScheme = async () => {};
    phase.stepActivations = async () => {
        assert.equal(choiceCount, expectedChoiceCount);
    };
    phase.stepDealEncounters = async () => {};
    phase.stepRevealEncounters = async () => {};
    phase.runEndVillainPhase = () => {};
    phase.endLimit = async () => {};

    await phase.execute({player: heroPlayer.player});

    assert.equal(choiceCount, 1);
    assert.equal(heroPlayer.player.damage, 1);
    assert.equal(alterEgoPlayer.player.damage, 0);
    assert.equal(match.villainPhaseStep, 5);

    match.villainPhaseStep = 0;
    expectedChoiceCount = 2;
    await phase.execute({player: heroPlayer.player});

    assert.equal(choiceCount, 2);
    assert.equal(heroPlayer.player.damage, 2);
    assert.equal(alterEgoPlayer.player.damage, 0);
    assert.equal(match.villainPhaseStep, 5);
});

test('Supervisor forces the flipping player to discard and suffer boost-icon damage only in hero form', async () => {
    const {alterEgoSide, heroSide, player, superhero} = createPlayer({initial: true});
    const {match, scenario} = await createTaskmasterScenario([player]);
    const encounterCard = {
        boost: 2,
        toObj() {
            return {id: 'discarded-encounter'};
        },
    };
    scenario.deck = {
        cards: [encounterCard],
        discardPile: [],
        async discardTopCards(count) {
            const cards = this.cards.splice(0, count);
            this.discardPile.push(...cards);
            return cards;
        },
        refresh() {},
    };

    const [villain] = scenario.villains;
    await villain.initTriggers();

    assert.ok(villain.triggers[TRIGGER_SUPERHERO_FLIPS][PRIORITY_FORCED_RESPONSE]);

    const flipToHero = new FlipEffect({
        match,
        selectedFormTarget: heroSide,
        selectedTarget: superhero,
    });

    await flipToHero.execute({own: true, player});

    assert.equal(player.isHero, true);
    assert.equal(player.damage, 2);
    assert.deepEqual(scenario.deck.discardPile, [encounterCard]);

    const flipToAlterEgo = new FlipEffect({
        match,
        selectedFormTarget: alterEgoSide,
        selectedTarget: superhero,
    });
    await flipToAlterEgo.execute({own: true, player});

    assert.equal(player.isHero, false);
    assert.equal(player.damage, 2);
    assert.deepEqual(scenario.deck.discardPile, [encounterCard]);
});

test('Supervisor stages II and III deal one encounter card to every player when revealed', async () => {
    const players = [
        createPlayer({initial: true}).player,
        createPlayer().player,
    ];
    const {match, scenario} = await createTaskmasterScenario(players);
    const drawnEncounterCards = [
        {id: 'first-player-stage-ii'},
        {id: 'second-player-stage-ii'},
        {id: 'first-player-stage-iii'},
        {id: 'second-player-stage-iii'},
    ];
    const encounterDeck = drawnEncounterCards.slice();
    match.drawEncounterCards = async count => encounterDeck.splice(0, count);

    for (const villain of scenario.villains.slice(1)) {
        const ability = villain.abilities[1];

        assert.ok(ability instanceof WhenRevealedAbility);
        assert.equal(typeof ability.effect.canRun, 'function');
        await ability.effect.runEffect({match, player: players[0]});
    }

    assert.deepEqual(players.map(({gameZone}) => gameZone.encounterCards), [
        [drawnEncounterCards[0], drawnEncounterCards[2]],
        [drawnEncounterCards[1], drawnEncounterCards[3]],
    ]);
    assert.deepEqual(encounterDeck, []);
});
