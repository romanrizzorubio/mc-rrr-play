import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_BOOST_ICONS,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    DIALOG_USE_CARD,
    DIALOG_LIST,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FACEDOWN,
    EFFECT_FOR_EACH,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_RANDOM_CARD,
    EFFECT_REMOVE_CARD,
    EFFECT_REPLACE_EFFECT,
    EFFECT_REMOVE_THREAT,
    EFFECT_RETURN_FACEDOWN,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SIMULTANEOUS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TOUGH,
    PRIORITY_FORCED_RESPONSE,
    PLACE_ENCOUNTER_DECK_CARDS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_CARDS,
    TARGET_ATTACHED,
    TARGET_ENEMY,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_YOU,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_CAPTIVE,
    TRAIT_HEROFORHIRE,
    TRAIT_HYDRA,
    TRAIT_MERCENARY,
    TRAIT_THWART,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {normalizeCatalog} from '../../../mc-data/seed/normalize.js';
import {FlipEffect} from '../../src/effects/flip-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {BoostAbility} from '../../src/abilities/misc/boost-ability.js';
import {ForcedInterruptAbility} from '../../src/abilities/interrupt/forced-interrupt-ability.js';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {HeroActionAbility} from '../../src/abilities/actions/hero-action-ability.js';
import {ResponseAbility} from '../../src/abilities/response/response-ability.js';
import {WhenRevealedAbility} from '../../src/abilities/when/when-revealed-ability.js';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {DiscardRandomEffect} from '../../src/effects/discard-random-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {FaceDownEffect} from '../../src/effects/facedown-effect.js';
import {ForEachEffect} from '../../src/effects/for-each-effect.js';
import {LastingEffect} from '../../src/effects/lasting-effect.js';
import {RandomCardEffect} from '../../src/effects/random-card-effect.js';
import {RemoveCardEffect} from '../../src/effects/remove-card-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {ReplaceEffect} from '../../src/effects/replace-effect.js';
import {ReturnFaceDownEffect} from '../../src/effects/return-facedown-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {ToughEffect} from '../../src/effects/tough-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
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
        get isAlterEgo() {
            return !superhero.isHero;
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
    assert.deepEqual(taskmaster.config.cards.filter(({card}) =>
        card.type === CARD_TYPE_MINION
    ).map(({count, card}) => [
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
    const [swordEntry, shieldEntry, reflexesEntry] =
        taskmaster.config.cards.filter(({card}) =>
            card.type === CARD_TYPE_ATTACHMENT);
    assert.deepEqual([
        swordEntry.count,
        swordEntry.card.params.name,
        swordEntry.card.params.image,
        swordEntry.card.params.traits,
        swordEntry.card.params.unique,
        swordEntry.card.params.attack,
        swordEntry.card.params.boost,
        swordEntry.card.params.attach,
    ], [
        1,
        'Espada del Supervisor',
        'scenarios/taskmaster/04102.png',
        [TRAIT_WEAPON],
        true,
        1,
        3,
        TARGET_VILLAIN,
    ]);
    assert.deepEqual([
        shieldEntry.count,
        shieldEntry.card.params.name,
        shieldEntry.card.params.image,
        shieldEntry.card.params.traits,
        shieldEntry.card.params.unique,
        shieldEntry.card.params.boost,
        shieldEntry.card.params.attach,
        shieldEntry.card.params.keywords,
    ], [
        1,
        'Escudo del Supervisor',
        'scenarios/taskmaster/04103.png',
        [TRAIT_ARMOR, TRAIT_WEAPON],
        true,
        3,
        TARGET_VILLAIN,
        {retaliate: 1},
    ]);
    assert.deepEqual([
        reflexesEntry.count,
        reflexesEntry.card.params.name,
        reflexesEntry.card.params.image,
        reflexesEntry.card.params.boost,
        reflexesEntry.card.params.attach,
    ], [
        2,
        'Reflejos fotográficos',
        'scenarios/taskmaster/04104.png',
        2,
        TARGET_VILLAIN,
    ]);
    const imitationEntry = taskmaster.config.cards.find(({card}) =>
        card.params.name === 'Imitación');
    assert.ok(imitationEntry);
    assert.equal(imitationEntry.count, 2);
    assert.equal(imitationEntry.card.type, CARD_TYPE_TREACHERY);
    assert.equal(imitationEntry.card.params.image, 'scenarios/taskmaster/04105.png');
    assert.equal(imitationEntry.card.params.boost, 1);
    const [imitationAlterEgo, imitationHero] = imitationEntry.card.params.abilities;
    assert.deepEqual(
        imitationAlterEgo,
        {
            type: ABILITY_WHEN_REVEALED_ALTEREGO,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_DISCARD_FROM_DECK,
                                params: {
                                    target: TARGET_YOU,
                                    count: 5,
                                },
                            },
                            {
                                type: EFFECT_DO_IF,
                                params: {
                                    condition: {
                                        'effects.0.cards.*.traits': TRAIT_THWART,
                                    },
                                    effect: {
                                        type: EFFECT_ENEMY_SCHEME,
                                        params: {
                                            enemyType: CHARACTER_VILLAIN,
                                            target: TARGET_MAIN_SCHEME,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        }
    );
    assert.deepEqual(
        imitationHero,
        {
            type: ABILITY_WHEN_REVEALED_HERO,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_DISCARD_FROM_DECK,
                                params: {
                                    target: TARGET_YOU,
                                    count: 5,
                                },
                            },
                            {
                                type: EFFECT_DO_IF,
                                params: {
                                    condition: {
                                        'effects.0.cards.*.traits': TRAIT_ATTACK,
                                    },
                                    effect: {
                                        type: EFFECT_ENEMY_ATTACK,
                                        params: {
                                            enemyType: CHARACTER_VILLAIN,
                                            target: TARGET_YOU,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        }
    );
    const pursuedByHydraEntry = taskmaster.config.cards.find(({card}) =>
        card.params.name === 'Perseguidos por Hydra');
    assert.ok(pursuedByHydraEntry);
    assert.equal(pursuedByHydraEntry.count, 2);
    assert.equal(pursuedByHydraEntry.card.type, CARD_TYPE_TREACHERY);
    assert.equal(
        pursuedByHydraEntry.card.params.image,
        'scenarios/taskmaster/04106.png'
    );
    assert.equal(pursuedByHydraEntry.card.params.boost, 1);
    assert.deepEqual(pursuedByHydraEntry.card.params.keywords, {incite: 1});
    assert.deepEqual(pursuedByHydraEntry.card.params.abilities, [
        {
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_FOR_EACH,
                    params: {
                        target: TARGET_ALL_PLAYERS,
                        condition: {isHero: true},
                        effect: {
                            type: EFFECT_SIMULTANEOUS,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_TAKE_DAMAGE,
                                        params: {
                                            target: TARGET_YOU,
                                            damage: 1,
                                        },
                                    },
                                    {
                                        type: EFFECT_DISCARD_RANDOM,
                                        params: {
                                            target: TARGET_YOU,
                                            count: 1,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        },
    ]);
    const capturedByHydraEntry = taskmaster.config.cards.find(({card}) =>
        card.params.name === 'Capturado por Hydra');
    assert.ok(capturedByHydraEntry);
    assert.equal(capturedByHydraEntry.count, 4);
    assert.equal(capturedByHydraEntry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.equal(
        capturedByHydraEntry.card.params.image,
        'scenarios/taskmaster/04107.png'
    );
    assert.equal(capturedByHydraEntry.card.params.startingThreat, 5);
    assert.equal(capturedByHydraEntry.card.params.boost, 2);
    const [capturedWhenRevealed] =
        capturedByHydraEntry.card.params.abilities;
    assert.equal(capturedByHydraEntry.card.params.abilities.length, 1);
    assert.equal(capturedWhenRevealed.type, ABILITY_WHEN_REVEALED);
    assert.deepEqual(
        capturedWhenRevealed.params.effect.params.effects[0],
        {
            type: EFFECT_RANDOM_CARD,
            params: {
                target: TARGET_SOURCE,
                source: 'card.owner.apart',
                condition: {
                    isAlly: true,
                    traits: TRAIT_CAPTIVE,
                },
                multipleTarget: true,
                removeFromSource: true,
                showDialog: false,
            },
        }
    );
    assert.deepEqual(
        capturedWhenRevealed.params.effect.params.effects[1],
        {
            type: EFFECT_FACEDOWN,
            params: {
                target: TARGET_THIS,
                cardsTarget: TARGET_SOURCE,
                source: 'effects.0.cards',
            },
        }
    );
    assert.deepEqual(
        capturedWhenRevealed.params.effect.params.effects[2],
        {
            type: EFFECT_LASTING,
            params: {
                target: TARGET_THIS,
                until: TRIGGER_THIS_DEFEAT,
                useTriggerPlayer: true,
                endEffect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_THIS,
                        effects: [
                            {
                                type: EFFECT_RETURN_FACEDOWN,
                                params: {
                                    target: TARGET_THIS,
                                    faceDownTarget: TARGET_ALL_CARDS,
                                    destination: {target: TARGET_YOU},
                                },
                            },
                            {
                                type: EFFECT_REMOVE_CARD,
                                params: {target: TARGET_THIS},
                            },
                        ],
                    },
                },
            },
        }
    );
    const [swordAttackAbility, swordAction] =
        swordEntry.card.params.abilities;
    assert.equal(swordAttackAbility.type, ABILITY_CONSTANT);
    assert.equal(swordAttackAbility.params.trigger, TRIGGER_VILLAIN_ATTACKS);
    assert.deepEqual(swordAttackAbility.params.effect, {
        type: EFFECT_MODIFY_ATTACK,
        params: {
            target: TARGET_EFFECT,
            modify: {
                keywords: {
                    piercing: true,
                },
            },
        },
    });
    const shieldAction = shieldEntry.card.params.abilities[0];
    [swordAction, shieldAction].forEach(ability => {
        assert.equal(ability.type, ABILITY_HERO_ACTION);
        assert.equal(ability.params.arrow.type, EFFECT_SIMULTANEOUS);
        assert.deepEqual(ability.params.arrow.params.effects, [
            {
                type: EFFECT_EXHAUST,
                params: {target: TARGET_YOUR_HERO},
            },
            {
                type: EFFECT_SPEND,
                params: {
                    resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
                },
            },
        ]);
        assert.deepEqual(ability.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_THIS},
        });
    });
    const reflexesInterrupt = reflexesEntry.card.params.abilities[0];
    assert.equal(reflexesInterrupt.type, ABILITY_FORCED_INTERRUPT);
    assert.equal(
        reflexesInterrupt.params.trigger,
        TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE
    );
    assert.deepEqual(reflexesInterrupt.params.triggerParams, {
        target: TARGET_ATTACHED,
    });
    assert.deepEqual(reflexesInterrupt.params.condition, {
        'effect.isAttack': true,
    });
    assert.equal(reflexesInterrupt.params.effect.type, EFFECT_REPLACE_EFFECT);
    assert.deepEqual(reflexesInterrupt.params.effect.params.replacement, {
        type: EFFECT_TAKE_DAMAGE,
        params: {
            target: TARGET_YOUR_SUPERHERO,
            damage: 0,
            paramsCalc: {target: 'triggeredTargetDamage'},
            thenEffect: {
                type: EFFECT_DISCARD_GAME,
                params: {target: TARGET_THIS},
            },
        },
    });
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

test('Imitación discards five cards and activates the Supervisor only for matching traits', async () => {
    const {player, superhero} = createPlayer({initial: true});
    const {match, taskmaster} = await createTaskmasterScenario([player]);
    const factory = new MatchFactory(match);

    player.match = match;
    player.deck = {
        cards: [],
        discardPile: [],
        async discardTopCards(count) {
            const cards = this.cards.splice(0, count);
            this.discardPile.push(...cards);

            return cards;
        },
        refresh() {},
    };

    const imitationConfig = taskmaster.config.cards.find(({card}) =>
        card.params.name === 'Imitación').card;
    const imitation = factory.cardsFactory.createGameCardFromConfig(
        imitationConfig,
        {owner: match.scenario}
    );
    const createDeckCard = (id, traits = []) => ({
        id,
        traits,
        toObj() {
            return {id};
        },
    });
    const schemeEffect = imitation.abilities[0].effect.effects[1].effect;
    const attackEffect = imitation.abilities[1].effect.effects[1].effect;
    let schemeActivations = 0;
    let attackActivations = 0;
    schemeEffect.canRun = async () => true;
    schemeEffect.runEffect = async () => {
        schemeActivations++;
    };
    attackEffect.canRun = async () => true;
    attackEffect.runEffect = async () => {
        attackActivations++;
    };

    player.deck.cards = [
        createDeckCard('thwart-card', [TRAIT_THWART]),
        createDeckCard('discard-2'),
        createDeckCard('discard-3'),
        createDeckCard('discard-4'),
        createDeckCard('discard-5'),
        createDeckCard('remaining'),
    ];
    await imitation.abilities[0].resolveAbility({match, player});

    assert.equal(player.deck.discardPile.length, 5);
    assert.equal(schemeActivations, 1);

    player.deck.cards = [
        createDeckCard('no-thwart-1'),
        createDeckCard('no-thwart-2'),
        createDeckCard('no-thwart-3'),
        createDeckCard('no-thwart-4'),
        createDeckCard('no-thwart-5'),
        createDeckCard('remaining-2'),
    ];
    player.deck.discardPile = [];
    await imitation.abilities[0].resolveAbility({match, player});

    assert.equal(player.deck.discardPile.length, 5);
    assert.equal(schemeActivations, 1);

    superhero.selectedSide = 1;
    player.deck.cards = [
        createDeckCard('no-attack-1'),
        createDeckCard('no-attack-2'),
        createDeckCard('no-attack-3'),
        createDeckCard('no-attack-4'),
        createDeckCard('no-attack-5'),
        createDeckCard('remaining-3'),
    ];
    player.deck.discardPile = [];
    await imitation.abilities[1].resolveAbility({match, player});

    assert.equal(player.deck.discardPile.length, 5);
    assert.equal(attackActivations, 0);

    player.deck.cards = [
        createDeckCard('attack-card', [TRAIT_ATTACK]),
        createDeckCard('hero-discard-2'),
        createDeckCard('hero-discard-3'),
        createDeckCard('hero-discard-4'),
        createDeckCard('hero-discard-5'),
        createDeckCard('remaining-4'),
    ];
    player.deck.discardPile = [];
    await imitation.abilities[1].resolveAbility({match, player});

    assert.equal(player.deck.discardPile.length, 5);
    assert.equal(attackActivations, 1);
});

test('Perseguidos por Hydra damages and discards from each hero-form player', async () => {
    const heroPlayer = createPlayer({initial: true});
    const alterEgoPlayer = createPlayer();
    heroPlayer.superhero.selectedSide = 1;
    const {match, taskmaster} = await createTaskmasterScenario([
        heroPlayer.player,
        alterEgoPlayer.player,
    ]);
    const discardedCards = [];
    const handCard = {id: 'hero-hand-card', isEvent: false};

    heroPlayer.player.match = match;
    heroPlayer.player.hand.cards = [handCard];
    heroPlayer.player.hand.discardRandom = async () => handCard;
    heroPlayer.player.hand.discardHand = card => {
        const index = heroPlayer.player.hand.cards.indexOf(card);
        if (index > -1) {
            heroPlayer.player.hand.cards.splice(index, 1);
        }
    };
    heroPlayer.player.deck = {
        discard: async card => discardedCards.push(card),
        refresh() {},
    };

    const factory = new MatchFactory(match);
    const cardConfig = taskmaster.config.cards.find(({card}) =>
        card.params.name === 'Perseguidos por Hydra').card;
    const card = factory.cardsFactory.createGameCardFromConfig(
        cardConfig,
        {owner: match.scenario}
    );
    const [ability] = card.abilities;

    assert.equal(card.incite, 1);
    assert.ok(ability instanceof WhenRevealedAbility);
    assert.ok(ability.effect instanceof ForEachEffect);
    assert.ok(ability.effect.createTargetEffect().effects[0] instanceof TakeDamageEffect);
    assert.ok(ability.effect.createTargetEffect().effects[1] instanceof DiscardRandomEffect);

    await ability.resolveAbility({match, player: heroPlayer.player});

    assert.equal(heroPlayer.player.damage, 1);
    assert.equal(alterEgoPlayer.player.damage, 0);
    assert.deepEqual(discardedCards, [handCard]);
    assert.deepEqual(heroPlayer.player.hand.cards, []);
    assert.deepEqual(alterEgoPlayer.player.hand.cards, []);
});

test('Capturado por Hydra hides a random captive and returns it to the defeating player', async () => {
    const revealingPlayer = createPlayer({initial: true});
    const defeatingPlayer = createPlayer();
    const {match, scenario, taskmaster} = await createTaskmasterScenario([
        revealingPlayer.player,
        defeatingPlayer.player,
    ]);
    [revealingPlayer.player, defeatingPlayer.player].forEach(player => {
        player.match = match;
        player.hand.addCard = card => player.hand.cards.push(card);
    });
    match.refresh = async () => {};
    match.persist = async () => {};

    await scenario.initScenario([], false);

    const capturedConfig = taskmaster.config.cards.find(({card}) =>
        card.params.name === 'Capturado por Hydra').card;
    const captured = scenario.deck.cards.find(card =>
        card.name === capturedConfig.params.name);

    assert.ok(captured);
    await new RevealEncounterEffect({
        selectedTarget: captured,
        match,
    }).runEffect({player: revealingPlayer.player});

    assert.equal(captured.faceDown.length, 1);
    const [captive] = captured.faceDown.map(faceDown => faceDown.card);
    assert.ok(captive.isAlly);
    assert.equal(captive.traits.includes(TRAIT_CAPTIVE), true);
    assert.equal(scenario.apart.includes(captive), false);
    assert.equal(scenario.gameZone.cards.includes(captured), true);
    assert.ok(captured.abilities[0] instanceof WhenRevealedAbility);
    assert.ok(captured.abilities[0].effect.effects[0] instanceof RandomCardEffect);
    assert.ok(captured.abilities[0].effect.effects[1] instanceof FaceDownEffect);
    assert.equal(captured.abilities.length, 1);
    const lastingEffect = captured.abilities[0].effect.effects[2];
    assert.ok(lastingEffect instanceof LastingEffect);
    assert.equal(lastingEffect.until, TRIGGER_THIS_DEFEAT);
    assert.ok(lastingEffect.endEffect.effects[0] instanceof ReturnFaceDownEffect);
    assert.ok(lastingEffect.endEffect.effects[1] instanceof RemoveCardEffect);
    assert.equal(match.lasting.length, 1);

    await new RemoveThreatEffect({
        match,
        selectedTarget: captured,
        threat: 5,
    }).runEffect({match, player: defeatingPlayer.player});

    assert.equal(defeatingPlayer.player.hand.cards.includes(captive), true);
    assert.equal(revealingPlayer.player.hand.cards.includes(captive), false);
    assert.equal(captive.owner, defeatingPlayer.player);
    assert.equal(captured.faceDown.length, 0);
    assert.equal(scenario.gameZone.cards.includes(captured), false);
    assert.equal(match.removedCards.includes(captured), true);
    assert.equal(scenario.deck.discardPile.includes(captured), false);
    assert.equal(match.lasting.length, 0);
});

test('Campamento de instrucción da Duro a los esbirros que entran en juego', async () => {
    const {player} = createPlayer({initial: true});
    const {match, scenario, taskmaster} = await createTaskmasterScenario([player]);
    player.match = match;
    player.engage = minion => player.gameZone.minions.push(minion);
    match.refresh = async () => {};
    match.persist = async () => {};

    await scenario.initScenario([], false);

    const trainingCampConfig = taskmaster.config.cards.find(({card}) =>
        card.params.name === 'Campamento de instrucción del Supervisor');
    assert.ok(trainingCampConfig);
    assert.equal(trainingCampConfig.count, 1);
    assert.equal(trainingCampConfig.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.deepEqual(trainingCampConfig.card.params.startingThreat, [2, true]);
    assert.deepEqual(trainingCampConfig.card.params.icons, {hazard: 1});
    assert.equal(trainingCampConfig.card.params.boost, 3);

    const trainingCamp = scenario.deck.cards.find(card =>
        card.name === trainingCampConfig.card.params.name);
    const minion = scenario.deck.cards.find(card => card.isMinion);
    assert.ok(trainingCamp);
    assert.ok(minion);

    const [response] = trainingCamp.abilities;
    assert.ok(response instanceof ForcedResponseAbility);
    assert.equal(response.trigger, TRIGGER_CARD_ENTER_PLAY);
    assert.deepEqual(response.triggerParams, {
        cardCondition: {isMinion: true},
    });
    assert.equal(response.effect.effectType, EFFECT_TOUGH);
    assert.equal(response.effect.target, TARGET_TRIGGERED_CARD);
    assert.ok(response.effect instanceof ToughEffect);
    assert.equal(typeof response.effect.canRun, 'function');

    await new RevealEncounterEffect({
        selectedTarget: trainingCamp,
        match,
    }).runEffect({match, player});
    assert.equal(trainingCamp.isInPlay, true);
    assert.equal(minion.isTough, false);

    await new EngageEffect({
        card: minion,
        controller: scenario,
        match,
        target: TARGET_YOU,
    }).runEffect({match, player});

    assert.equal(minion.isTough, true);
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

test('Supervisor attachments modify its attacks and redirect attack damage', async () => {
    const {heroSide, player, superhero} = createPlayer({initial: true});
    superhero.selectedSide = 1;
    heroSide.isTough = true;
    heroSide.removeTough = () => {
        heroSide.isTough = false;
    };
    superhero.isSuperhero = true;
    superhero.isInPlay = true;
    superhero.placeDamage = damage => player.placeDamage(damage);
    superhero.getLife = () => player.getLife();
    superhero.removeTough = () => superhero.currentSide.removeTough();

    const {match, scenario} = await createTaskmasterScenario([player]);
    player.match = match;
    match.refresh = async () => {};
    match.persist = async () => {};

    await scenario.initScenario([], false);

    const villain = scenario.villains[0];
    const sword = scenario.deck.cards.find(card =>
        card.name === 'Espada del Supervisor');
    const shield = scenario.deck.cards.find(card =>
        card.name === 'Escudo del Supervisor');
    const reflexes = scenario.deck.cards.find(card =>
        card.name === 'Reflejos fotográficos');

    assert.ok(sword);
    assert.ok(shield);
    assert.ok(reflexes);
    [
        sword,
        shield,
        reflexes,
    ].forEach(card => {
        villain.attached.push(card);
        card.attachedTo = villain;
    });
    await Promise.all([
        sword.initTriggers(),
        shield.initTriggers(),
        reflexes.initTriggers(),
    ]);

    assert.equal(villain.attack, 3);
    assert.equal(villain.retaliate, 1);
    assert.ok(sword.abilities[0] instanceof ConstantAbility);
    assert.ok(sword.abilities[1] instanceof HeroActionAbility);
    assert.ok(shield.abilities[0] instanceof HeroActionAbility);
    [sword.abilities[1], shield.abilities[0]].forEach(ability => {
        assert.ok(ability.arrow.cost instanceof SimultaneousEffect);
        assert.ok(ability.effect);
        assert.equal(typeof ability.effect.canRun, 'function');
    });
    assert.ok(reflexes.abilities[0] instanceof ForcedInterruptAbility);
    assert.ok(reflexes.abilities[0].effect instanceof ReplaceEffect);
    assert.equal(typeof reflexes.abilities[0].effect.canRun, 'function');

    const villainAttack = new EnemyAttackEffect({
        enemy: villain,
        match,
        selectedTarget: player,
    });
    villainAttack.dealBoostCards = async () => {};
    villainAttack.showBoostCards = async () => {};
    villainAttack.defense = async () => {};
    villainAttack.resolveBoostCards = async () => 0;
    villainAttack.getCharacterDialogData = async () => ({});
    await villainAttack.runEffect({match, player});
    assert.equal(villainAttack.piercing, true);
    assert.equal(heroSide.isTough, false);
    assert.equal(player.damage, 2);
    const damageAfterPiercingAttack = player.damage;

    await sword.discard();
    assert.equal(villain.attack, 2);
    const attackWithoutSword = new EnemyAttackEffect({
        enemy: villain,
        match,
        selectedTarget: player,
    });
    await attackWithoutSword.triggerInit(
        attackWithoutSword.getTriggersParams({match, player})
    );
    assert.equal(attackWithoutSword.piercing, false);

    const nonAttackDamage = new TakeDamageEffect({
        damage: 2,
        match,
        selectedTarget: villain,
    });
    await nonAttackDamage.runEffect({match, player});
    assert.equal(villain.damage, 2);
    assert.equal(player.damage, damageAfterPiercingAttack);
    assert.equal(reflexes.attachedTo, villain);

    const redirectedAttackDamage = new TakeDamageEffect({
        damage: 4,
        isAttack: true,
        match,
        selectedTarget: villain,
    });
    await redirectedAttackDamage.runEffect({match, player});
    assert.equal(villain.damage, 2);
    assert.equal(player.damage, damageAfterPiercingAttack + 4);
    assert.equal(reflexes.attachedTo, undefined);
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

test('Stage 1B resolves its forced choice when a player returns to hero form', async () => {
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
    heroPlayer.superhero.selectedSide = 0;
    expectedChoiceCount = 1;
    await phase.execute({player: heroPlayer.player});

    assert.equal(choiceCount, 1);
    assert.equal(heroPlayer.player.damage, 1);
    assert.equal(alterEgoPlayer.player.damage, 0);
    assert.equal(match.villainPhaseStep, 5);

    match.villainPhaseStep = 0;
    heroPlayer.superhero.selectedSide = 1;
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
