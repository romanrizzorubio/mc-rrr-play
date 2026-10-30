import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_VILLAIN,
    EFFECT_ADD_ACCELERATION_TOKEN,
    EFFECT_ADD_SCENARIO_VILLAIN,
    EFFECT_ADVANCE_MAIN_SCHEME_STAGE,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_CANNOT_TARGET,
    EFFECT_DELAYED,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_GAME,
    EFFECT_ENGAGE,
    EFFECT_FACEDOWN,
    EFFECT_FOR_EACH,
    EFFECT_MERGE_SCENARIO_ZONE,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_PLACE_THREAT,
    EFFECT_REMOVE_CARD,
    EFFECT_REPLACE_EFFECT,
    EFFECT_REMOVE_SCENARIO_MAIN_SCHEME,
    EFFECT_REVEAL_FACEDOWN_UNDER,
    EFFECT_SEARCH_CARDS,
    EFFECT_START_SCENARIO_SPLIT,
    PLACE_ASIDE_MATCH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_OUTSIDE_NEMESIS,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_UNUSED_MAIN_SCHEME,
    TARGET_YOU,
    TRAIT_TEMPORAL,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_MAIN_SCHEME_COMPLETED,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_VILLAIN_ATTACKS_YOU,
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
                        type: EFFECT_MODIFY_ATTACK,
                        params: {
                            target: TARGET_EFFECT,
                            modify: {attack: 2},
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

const removePlayerObligations = {
    type: ABILITY_SETUP,
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
                                    locations: [PLACE_ENCOUNTER_DECK_CARDS],
                                    filter: {isObligation: true},
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
    abilities: [attackChoice()],
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
        abilities: [attackChoice()],
    }),
];

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
        villains: [stageOne, ...stageTwoVillains.map(villain =>
            kangVillain(villain)), stageThree, ...expertVillains],
        mainSchemes: [
            mainScheme({
                name: 'La llegada de Kang',
                image: '11007',
                stage: 1,
                startingThreat: 0,
                escalation: [1, true],
                value: [7, true],
                final: true,
                content: {villains: [1], villainsExpert: [1]},
                abilities: [removePlayerObligations],
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
        cards: [],
        setAsideCards: [{count: 4, card: kangDominion}],
    },
};
