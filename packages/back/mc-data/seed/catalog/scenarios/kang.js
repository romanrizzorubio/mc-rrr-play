import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_COUNT,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    CLASSIFICATION_HERO,
    EFFECT_ADD_ACCELERATION_TOKEN,
    EFFECT_ADD_SCENARIO_VILLAIN,
    EFFECT_ADVANCE_MAIN_SCHEME_STAGE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_CANNOT,
    EFFECT_CANNOT_TARGET,
    EFFECT_DELAYED,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DEAL_DAMAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_FACEDOWN,
    EFFECT_FOR_EACH,
    EFFECT_MERGE_SCENARIO_ZONE,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_PUT_PLAY,
    EFFECT_REMOVE_CARD,
    EFFECT_REPLACE_EFFECT,
    EFFECT_REMOVE_SCENARIO_MAIN_SCHEME,
    EFFECT_REVEAL_FACEDOWN_UNDER,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_START_SCENARIO_SPLIT,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TOUGH,
    EFFECT_TUCK_UNDER,
    EFFECT_WIN_GAME,
    PLACE_ASIDE_MATCH,
    PLACE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_OUTSIDE_NEMESIS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALLY_YOU_CONTROL,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_ALL_HEROES,
    TARGET_ATTACHED,
    TARGET_ATTACKER,
    TARGET_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_THIS,
    TARGET_TRIGGERED_TARGET,
    TARGET_UNUSED_MAIN_SCHEME,
    TARGET_YOU,
    TARGET_VILLAIN,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ROBOT,
    TRAIT_TECH,
    TRAIT_TEMPORAL,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_CHARACTER_ATTACKED,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_CHARACTER_WOULD_READY,
    TRIGGER_MAIN_SCHEME_COMPLETED,
    TRIGGER_PLAYER_CAN_PLAY,
    TRIGGER_PLAYER_CAN_USE_ABILITY,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_WOULD_ADD_ACCELERATION_TOKEN,
} from 'mc-shared';

const SET = 'kang';
const STAGE_THREE_SCHEMES = [
    ['Cronópolis', 'Destino inexorable', 'En el reino de Rama-Tut', 'La actual guerra del futuro'],
    ['Kang (Inmortus)', 'Kang (Iron Lad)', 'Kang (Rama-Tut)', 'Kang (Centurión Escarlata)'],
    ['11009', '11010', '11011', '11012'],
];

const attackChoice = () => ({
    type: ABILITY_FORCED_INTERRUPT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
        effect: {
            type: EFFECT_CHOOSE,
            params: {
                options: [
                    {
                        type: EFFECT_PLACE_THREAT,
                        params: {
                            target: TARGET_MAIN_SCHEME,
                            threat: 1,
                            title: 'Coloca 1 de amenaza sobre el Plan principal.',
                        },
                    },
                    {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 2,
                            title: 'Kang recibe +2 ATQ para este ataque.',
                        },
                    },
                ],
            },
        },
    },
});

const stageOneDefeat = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_THIS_DEFEAT,
        effect: {
            type: EFFECT_DELAYED,
            params: {
                target: TARGET_SCENARIO,
                effect: {
                    type: EFFECT_ADVANCE_MAIN_SCHEME_STAGE,
                    params: {stage: 2},
                },
            },
        },
    },
};

const stageOneSetup = {
    type: ABILITY_SETUP,
    params: {
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_SEARCH_CARDS,
                                            params: {
                                                locations: [PLACE_ENCOUNTER_DECK_CARDS],
                                                filter: {
                                                    isObligation: true,
                                                    'owner.isPlayer': true,
                                                },
                                                firstMatch: true,
                                            },
                                        },
                                        {
                                            type: EFFECT_REMOVE_CARD,
                                            params: {target: TARGET_CARD},
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        type: EFFECT_DEAL_ENCOUNTER,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            count: 1,
                        },
                    },
                ],
            },
        },
    },
};

const stageTwoDefeat = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_THIS_DEFEAT,
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {type: EFFECT_REMOVE_SCENARIO_MAIN_SCHEME, params: {}},
                    {
                        type: EFFECT_DELAYED,
                        params: {
                            target: TARGET_SCENARIO,
                            effect: {
                                type: EFFECT_MERGE_SCENARIO_ZONE,
                                params: {},
                            },
                        },
                    },
                ],
            },
        },
    },
};

const stageThreeDefeat = {
    type: ABILITY_WHEN_DEFEATED,
    params: {
        hideDialog: true,
        effect: {
            type: EFFECT_WIN_GAME,
            params: {},
        },
    },
};

const mainScheme = ({
    name,
    image,
    stage,
    value,
    startingThreat = 0,
    escalation,
    final = false,
    content,
    abilities = [],
}) => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name,
            set: SET,
            image: `scenarios/kang/${image}a.jpg`,
            stage,
            ...(content ? {content} : {}),
            abilities,
        },
    },
    {
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        params: {
            name,
            set: SET,
            image: `scenarios/kang/${image}b.png`,
            stage,
            startingThreat,
            ...(escalation !== undefined ? {acceleration: escalation} : {}),
            ...(value !== undefined ? {value} : {}),
            final,
        },
    },
];

const splitStageA = ({
    name,
    villainName,
    startingThreat,
    image,
}) => mainScheme({
    name,
    image,
    stage: 3,
    startingThreat,
    escalation: 1,
    value: 9,
    content: {villainName},
});

const temporalCorruption = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Flujo temporal corrompido',
        set: SET,
        image: 'scenarios/kang/11022.png',
        boost: 2,
        startingThreat: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_PLAYER_CAN_USE_ABILITY,
                    hideDialog: true,
                    effect: {
                        type: EFFECT_CANNOT,
                        params: {
                            target: TARGET_YOU,
                            restriction: ABILITY_ALTEREGO_ACTION,
                            targetCondition: {isObligation: true},
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_CHOOSE,
                                params: {
                                    options: [
                                        {
                                            type: EFFECT_DISCARD_RANDOM,
                                            params: {
                                                target: TARGET_YOU,
                                                count: 1,
                                                title: 'Descarta 1 carta al azar de tu mano',
                                            },
                                        },
                                        {
                                            type: EFFECT_PLACE_THREAT,
                                            params: {
                                                target: TARGET_THIS,
                                                threat: 2,
                                                title: 'Coloca 2 de amenaza sobre esta carta',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const detained = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Retenido',
        set: SET,
        image: 'scenarios/kang/11024.png',
        boost: 2,
        startingThreat: 2,
        icons: {crisis: true},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_PLACE_THREAT,
                        params: {
                            target: TARGET_THIS,
                            paramsCalc: {
                                target: 'effect.ability.card.scenarioZone.players.*.gameZone.inPlayCards',
                                formula: CALC_COUNT,
                                conditions: {isObligation: true},
                                multiply: 2,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const desbocado = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Desbocado',
        set: SET,
        image: 'scenarios/kang/11025.png',
        boost: 2,
        startingThreat: 4,
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_UNTIL,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        condition: {isMinion: true},
                                    },
                                },
                                {
                                    type: EFFECT_ENGAGE,
                                    params: {target: TARGET_YOU},
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const energyRay = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Rayo de energía',
        set: SET,
        image: 'scenarios/kang/11026.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_GAME,
                                    params: {
                                        target: [
                                            TARGET_ALLY_YOU_CONTROL,
                                            TARGET_SUPPORT_YOU_CONTROL,
                                        ],
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.resolved': false,
                                        },
                                        effect: {
                                            type: EFFECT_SURGE,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED_HERO,
                params: {
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
};

const temporalFlowControl = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Manipular el flujo temporal',
        set: SET,
        image: 'scenarios/kang/11027.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_CONDITION_HAND,
                                    params: {
                                        target: TARGET_YOU,
                                        condition: {isEvent: true},
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.resolved': false,
                                        },
                                        effect: {
                                            type: EFFECT_SURGE,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const timeTravelTactics = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Tácticas de viaje en el tiempo',
        set: SET,
        image: 'scenarios/kang/11028.png',
        boost: 1,
        keywords: {surge: true},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_ASSIGN_DAMAGE,
                                params: {
                                    target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                    damage: 0,
                                    paramsCalc: {
                                        target: 'player.gameZone.cards',
                                        formula: CALC_COUNT,
                                        conditions: {isObligation: true},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_MODIFY_BOOST_ICONS,
                    params: {
                        target: TARGET_EFFECT,
                        count: 0,
                        paramsCalc: {
                            target: 'player.gameZone.cards',
                            formula: CALC_COUNT,
                            conditions: {isObligation: true},
                        },
                    },
                },
            },
        },
    },
};

const designsOfThePast = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Designios del pasado',
        set: SET,
        image: 'scenarios/kang/11029.png',
        boost: 3,
        keywords: {incite: 1},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_FOR_EACH,
                                    params: {
                                        target: TARGET_ALL_PLAYERS,
                                        effect: {
                                            type: EFFECT_SEARCH_CARD_REVEAL,
                                            params: {
                                                condition: {isObligation: true},
                                                excludeNames:
                                                    'forEachResults.*.cards.*.name',
                                                places: [
                                                    PLACE_ENCOUNTER_DECK_CARDS,
                                                    PLACE_ENCOUNTER_DISCARD,
                                                ],
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_SHUFFLE_DECK,
                                    params: {target: TARGET_SCENARIO},
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const stageThreeCompleted = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_MAIN_SCHEME_COMPLETED,
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_SEARCH_CARDS,
                        params: {
                            locations: [PLACE_ASIDE_MATCH],
                            filter: {name: 'El dominio de Kang'},
                            firstMatch: true,
                            requireMatch: true,
                        },
                    },
                    {
                        type: EFFECT_FACEDOWN,
                        params: {
                            target: TARGET_UNUSED_MAIN_SCHEME,
                            condition: {stage: 4},
                            cardsTarget: TARGET_SOURCE,
                            source: 'selectedCards',
                            from: PLACE_ASIDE_MATCH,
                        },
                    },
                    {
                        type: EFFECT_DELAYED,
                        params: {
                            target: TARGET_SCENARIO,
                            effect: {
                                type: EFFECT_MERGE_SCENARIO_ZONE,
                                params: {},
                            },
                        },
                    },
                ],
            },
        },
    },
};

const stageTwoAAbilities = [
    {
        type: ABILITY_WHEN_REVEALED,
        params: {
            effect: {
                type: EFFECT_CHAINED,
                params: {
                    effects: [
                        {
                            type: EFFECT_ADD_ACCELERATION_TOKEN,
                            params: {
                                target: TARGET_THIS,
                                paramsCalc: {
                                    target: 'match.sideSchemes',
                                    formula: CALC_COUNT,
                                },
                            },
                        },
                        {
                            type: EFFECT_DISCARD_GAME,
                            params: {target: TARGET_ALL_SIDE_SCHEMES},
                        },
                        {
                            type: EFFECT_START_SCENARIO_SPLIT,
                            params: {stage: 3, villainStage: 2},
                        },
                    ],
                },
            },
        },
    },
];

const stageTwoBAbilities = [
    {
        type: ABILITY_FORCED_INTERRUPT,
        params: {
            globalScope: true,
            trigger: TRIGGER_WOULD_ADD_ACCELERATION_TOKEN,
            triggerParams: {
                excludeSourceCard: true,
            },
            effect: {
                type: EFFECT_REPLACE_EFFECT,
                params: {
                    target: TARGET_EFFECT,
                    replacement: {
                        type: EFFECT_ADD_ACCELERATION_TOKEN,
                        params: {
                            target: TARGET_THIS,
                            countFromEffect: true,
                        },
                    },
                },
            },
        },
    },
];

const kangVillain = ({
    name,
    image,
    stage,
    scheme,
    attack,
    hitPoints,
    expert = false,
    keywords = {toughness: true},
    abilities = [],
}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name,
        set: SET,
        image: `scenarios/kang/${image}.png`,
        traits: [TRAIT_TEMPORAL],
        unique: true,
        stage,
        scheme,
        attack,
        hitPoints,
        keywords,
        ...(expert ? {expert: true} : {}),
        abilities,
    },
});

const stageTwoVillainAbilities = () => [stageTwoDefeat];
const stageTwoVillains = [
    {
        name: 'Kang (Inmortus)',
        image: '11002',
        stage: 2,
        scheme: 2,
        attack: 2,
        hitPoints: 18,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    validation: {
                        type: EFFECT_CANNOT_TARGET,
                        params: {
                            effectCategories: [EFFECT_CATEGORY_DAMAGE],
                            targetCondition: {isVillain: true},
                            condition: {isMinion: true},
                        },
                    },
                },
            },
            ...stageTwoVillainAbilities(),
        ],
    },
    {
        name: 'Kang (Iron Lad)',
        image: '11003',
        stage: 2,
        scheme: 1,
        attack: 2,
        hitPoints: 18,
        keywords: {retaliate: 1, toughness: true},
        abilities: stageTwoVillainAbilities(),
    },
    {
        name: 'Kang (Rama-Tut)',
        image: '11004',
        stage: 2,
        scheme: 1,
        attack: 2,
        hitPoints: 18,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_ATTACK,
                    triggerParams: {target: TARGET_THIS},
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'match.inPlayCards',
                                formula: CALC_COUNT,
                                conditions: {isObligation: true},
                            },
                        },
                    },
                },
            },
            ...stageTwoVillainAbilities(),
        ],
    },
    {
        name: 'Kang (Centurión Escarlata)',
        image: '11005',
        stage: 2,
        scheme: 0,
        attack: 3,
        hitPoints: 18,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK,
                        params: {
                            target: TARGET_EFFECT,
                            modify: {keywords: {piercing: true}},
                        },
                    },
                },
            },
            ...stageTwoVillainAbilities(),
        ],
    },
];

const stageOne = kangVillain({
    name: 'Kang (El Conquistador)',
    image: '11001',
    stage: 1,
    scheme: 1,
    attack: 2,
    hitPoints: [12, true],
    abilities: [attackChoice(), stageOneDefeat],
});
const stageThree = kangVillain({
    name: 'Kang (El Conquistador)',
    image: '11006',
    stage: 3,
    scheme: 2,
    attack: 2,
    hitPoints: [20, true],
    abilities: [attackChoice(), stageThreeDefeat],
});
const expertVillains = [
    kangVillain({
        name: 'Kang (El Conquistador)',
        image: '11034',
        stage: 1,
        scheme: 1,
        attack: 3,
        hitPoints: [15, true],
        expert: true,
        abilities: [attackChoice(), stageOneDefeat],
    }),
    ...stageTwoVillains.map((villain, index) => kangVillain({
        ...villain,
        image: ['11035', '11036', '11037', '11038'][index],
        scheme: [3, 2, 2, 1][index],
        attack: [2, 3, 3, 4][index],
        hitPoints: 22,
        expert: true,
    })),
    kangVillain({
        name: 'Kang (El Conquistador)',
        image: '11039',
        stage: 3,
        scheme: 3,
        attack: 3,
        hitPoints: [25, true],
        expert: true,
        abilities: [attackChoice(), stageThreeDefeat],
    }),
];

const temporalShield = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Escudo temporal',
        set: SET,
        image: 'scenarios/kang/11014.png',
        traits: [TRAIT_TECH],
        attach: TARGET_VILLAIN,
        boost: 1,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_ATTACKED,
                    triggerParams: {target: TARGET_ATTACHED},
                    maximum: {count: 1, target: TARGET_EFFECT},
                    arrow: {
                        type: EFFECT_DISCARD_GAME,
                        params: {target: TARGET_THIS},
                    },
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            target: TARGET_EFFECT,
                            effects: [
                                {
                                    type: EFFECT_PREVENT_DAMAGE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        preventAll: true,
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ATTACKER,
                                        damage: 1,
                                        isAttack: false,
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const futureWeapon = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Arma del futuro',
        set: SET,
        image: 'scenarios/kang/11015.png',
        traits: [TRAIT_TECH, TRAIT_WEAPON],
        attack: 2,
        boost: 2,
        attach: TARGET_VILLAIN,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_VILLAIN_ATTACKS,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_EFFECT,
                            effects: [
                                {
                                    type: EFFECT_MODIFY_ATTACK,
                                    params: {
                                        target: TARGET_EFFECT,
                                        modify: {keywords: {overkill: true}},
                                    },
                                },
                                {
                                    type: EFFECT_DELAYED,
                                    params: {
                                        target: TARGET_EFFECT,
                                        effect: {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                target: TARGET_EFFECT,
                                                condition: {'effect.canceled': false},
                                                effect: {
                                                    type: EFFECT_DISCARD_GAME,
                                                    params: {target: TARGET_CARD},
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    hideDialog: true,
                    trigger: TRIGGER_CHARACTER_TAKES_DAMAGE,
                    triggerParams: {
                        target: TARGET_ALL_HEROES,
                        attacker: TARGET_ATTACHED,
                    },
                    condition: {'effect.isAttack': true},
                    effect: {
                        type: EFFECT_STUN,
                        params: {
                            target: TARGET_TRIGGERED_TARGET,
                        },
                    },
                },
            },
        ],
    },
};

const frozenInTime = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Congelado en el tiempo',
        set: SET,
        image: 'scenarios/kang/11016.png',
        traits: [TRAIT_TEMPORAL],
        boost: 0,
        attach: TARGET_YOUR_SUPERHERO,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_READY,
                    triggerParams: {target: TARGET_ATTACHED},
                    effect: {
                        type: EFFECT_REPLACE_EFFECT,
                        params: {
                            target: TARGET_EFFECT,
                            replacement: {
                                type: EFFECT_DISCARD_GAME,
                                params: {target: TARGET_THIS},
                            },
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_PUT_PLAY,
                    params: {
                        target: TARGET_YOUR_SUPERHERO,
                        cardSource: 'card',
                        controller: 'match.scenario',
                    },
                },
            },
        },
    },
};

const macrobots = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Macrobots',
        set: SET,
        image: 'scenarios/kang/11017.png',
        traits: [TRAIT_ROBOT, TRAIT_TEMPORAL],
        attack: 2,
        scheme: 1,
        hitPoints: 4,
        keywords: {guard: true, retaliate: 1},
        boost: 0,
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_TOUGH,
                    params: {target: TARGET_VILLAIN},
                },
            },
        },
    },
};

const debilitado = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Debilitado',
        set: SET,
        image: 'scenarios/kang/11018.png',
        traits: [TRAIT_TEMPORAL],
        boost: 2,
        abilities: [
            ...[
                TRIGGER_YOU_BASIC_ATTACK,
                TRIGGER_YOU_BASIC_THWART,
                TRIGGER_YOU_BASIC_DEFENSE,
            ].map(trigger => ({
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger,
                    effect: {
                        type: EFFECT_TAKE_DAMAGE,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            damage: 1,
                        },
                    },
                },
            })),
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SELECT_DISCARD_CARD,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
                            filter: {resources: RESOURCE_PHYSICAL},
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {target: TARGET_THIS},
                    },
                },
            },
        ],
    },
};

const stolenMemories = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Recuerdos robados',
        set: SET,
        image: 'scenarios/kang/11019.png',
        traits: [TRAIT_TEMPORAL],
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_FACEDOWN,
                        params: {
                            target: TARGET_THIS,
                            count: 8,
                            from: PLACE_DECK,
                        },
                    },
                },
            },
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SELECT_DISCARD_CARD,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
                            filter: {resources: RESOURCE_MENTAL},
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {target: TARGET_THIS},
                    },
                },
            },
        ],
    },
};

const noPowers = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Sin poderes',
        set: SET,
        image: 'scenarios/kang/11020.png',
        traits: [TRAIT_TEMPORAL],
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_PLAYER_CAN_PLAY,
                    hideDialog: true,
                    effect: {
                        type: EFFECT_CANNOT,
                        params: {
                            target: TARGET_YOU,
                            restriction: 'play',
                            sourceIn: 'player.gameZone.cards',
                            targetCondition: {
                                'card.classification': CLASSIFICATION_HERO,
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SELECT_DISCARD_CARD,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
                            filter: {
                                'card.classification': CLASSIFICATION_HERO,
                            },
                            title: 'Descarta una carta específica de Héroe de tu mano',
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {target: TARGET_THIS},
                    },
                },
            },
        ],
    },
};

const temporalTangles = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Enredos temporales',
        set: SET,
        image: 'scenarios/kang/11021.png',
        traits: [TRAIT_TEMPORAL],
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_THIS,
                            outputParams: ['effects'],
                            effects: [
                                {
                                    type: EFFECT_DISCARD_GAME,
                                    params: {
                                        target: TARGET_SOURCE,
                                        source: 'player.gameZone.cards',
                                        condition: {
                                            isPlayerCard: true,
                                            cost: {
                                                operator: 'max',
                                                defaultValue: 0,
                                            },
                                        },
                                        selectCount: 1,
                                    },
                                },
                            ],
                            thenEffect: {
                                type: EFFECT_TUCK_UNDER,
                                params: {
                                    target: TARGET_THIS,
                                    cards: 'effects.0.cards',
                                },
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    name: 'Descarta un recurso [e] de tu mano → descarta esta Obligación.',
                    arrow: {
                        type: EFFECT_SELECT_DISCARD_CARD,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
                            filter: {resources: RESOURCE_ENERGY},
                            title: 'Descarta un recurso [e] de tu mano',
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {target: TARGET_THIS},
                    },
                },
            },
        ],
    },
};

const kangDominion = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'El dominio de Kang',
        set: SET,
        image: 'scenarios/kang/11023.png',
        boost: 3,
        startingThreat: [3, true],
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    validation: {
                        type: EFFECT_CANNOT_TARGET,
                        params: {
                            effectCategories: [EFFECT_CATEGORY_DAMAGE],
                            targetCondition: {
                                isVillain: true,
                                traits: TRAIT_TEMPORAL,
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_DEFEAT,
                    effect: {
                        type: EFFECT_DEAL_ENCOUNTER,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

export default {
    _id: SET,
    order: 999,
    name: 'Kang',
    folder: 'kang',
    config: {
        name: SET,
        manualVillainProgression: true,
        manualMainSchemeProgression: true,
        separatePlayAreas: true,
        villains: [
            stageOne,
            ...stageTwoVillains.map(villain => kangVillain(villain)),
            stageThree,
        ],
        expertVillains,
        mainSchemes: [
            mainScheme({
                name: 'La llegada de Kang',
                image: '11007',
                stage: 1,
                startingThreat: 0,
                escalation: [1, true],
                value: [7, true],
                final: true,
                abilities: [stageOneSetup],
            }),
            mainScheme({
                name: 'El amo del tiempo',
                image: '11008',
                stage: 2,
                startingThreat: 0,
                abilities: stageTwoAAbilities,
                content: {},
            }).map((card, index) => index === 1 ? {
                ...card,
                params: {
                    ...card.params,
                    abilities: stageTwoBAbilities,
                },
            } : card),
            ...[
                splitStageA({
                    name: STAGE_THREE_SCHEMES[0][0],
                    villainName: STAGE_THREE_SCHEMES[1][0],
                    image: STAGE_THREE_SCHEMES[2][0],
                    startingThreat: 0,
                }),
                splitStageA({
                    name: STAGE_THREE_SCHEMES[0][1],
                    villainName: STAGE_THREE_SCHEMES[1][1],
                    image: STAGE_THREE_SCHEMES[2][1],
                    startingThreat: 1,
                }),
                splitStageA({
                    name: STAGE_THREE_SCHEMES[0][2],
                    villainName: STAGE_THREE_SCHEMES[1][2],
                    image: STAGE_THREE_SCHEMES[2][2],
                    startingThreat: 1,
                }),
                splitStageA({
                    name: STAGE_THREE_SCHEMES[0][3],
                    villainName: STAGE_THREE_SCHEMES[1][3],
                    image: STAGE_THREE_SCHEMES[2][3],
                    startingThreat: 2,
                }),
            ].map(scheme => scheme.map((card, index) => index === 1 ? {
                ...card,
                params: {
                    ...card.params,
                    abilities: [stageThreeCompleted],
                },
            } : card)),
            mainScheme({
                name: 'La ira de Kang',
                image: '11013',
                stage: 4,
                startingThreat: 0,
                escalation: [1, true],
                value: [10, true],
                final: true,
                abilities: [
                    {
                        type: ABILITY_WHEN_REVEALED,
                        params: {
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_ADD_SCENARIO_VILLAIN,
                                            params: {
                                                name: 'Kang (El Conquistador)',
                                                stage: 3,
                                            },
                                        },
                                        {
                                            type: EFFECT_REVEAL_FACEDOWN_UNDER,
                                            params: {
                                                target: TARGET_THIS,
                                                name: 'El dominio de Kang',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            }).map((card, index) => index === 1 ? {
                ...card,
                params: {
                    ...card.params,
                    abilities: [
                        {
                            type: ABILITY_WHEN_REVEALED,
                            params: {
                                effect: {
                                    type: EFFECT_FOR_EACH,
                                    params: {
                                        target: TARGET_ALL_PLAYERS,
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_SEARCH_CARDS,
                                                        params: {
                                                            locations: [
                                                                PLACE_OUTSIDE_NEMESIS,
                                                            ],
                                                            filter: {
                                                                isMinion: true,
                                                                isNemesis: true,
                                                            },
                                                            firstMatch: true,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_ENGAGE,
                                                        params: {
                                                            target: TARGET_YOU,
                                                            cardSource: 'selectedCard',
                                                            cardCondition: {
                                                                isMinion: true,
                                                                isNemesis: true,
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            } : card),
        ],
        sets: ['standard'],
        defaultSets: ['temporal'],
        cards: [
            {count: 2, card: temporalShield},
            {count: 2, card: futureWeapon},
            {count: 1, card: frozenInTime},
            {count: 3, card: macrobots},
            {count: 2, card: debilitado},
            {count: 2, card: stolenMemories},
            {count: 2, card: noPowers},
            {count: 2, card: temporalTangles},
            {count: 1, card: temporalCorruption},
            {count: 1, card: detained},
            {count: 2, card: desbocado},
            {count: 2, card: energyRay},
            {count: 1, card: temporalFlowControl},
            {count: 2, card: timeTravelTactics},
            {count: 1, card: designsOfThePast},
        ],
        setAsideCards: [{count: 4, card: kangDominion}],
    },
};
