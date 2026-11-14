import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FIRST_PLAYER_ACTION,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_SETUP,
    ABILITY_SPECIAL,
    ABILITY_WHEN_REVEALED,
    CALC_COUNTERS,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_VILLAIN,
    EFFECT_ADD_KEYWORD,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_FOR_EACH,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PUT_PLAY,
    EFFECT_REMOVE_COUNTER,
    EFFECT_REMOVE_THREAT,
    EFFECT_RESOLVE_CARDS_IN_ORDER,
    EFFECT_RESOLVE_SPECIAL_ABILITY,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHOW_CARDS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_STORE_BOOST,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_ATTACHED,
    TARGET_CONDITION_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENVIRONMENT,
    TARGET_MINION,
    TARGET_PLAYER_FEWEST_MINIONS,
    TARGET_SCENARIO,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_AERIAL,
    TRAIT_BADOON,
    TRAIT_VEHICLE,
    TRAIT_WEAPON,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_ENGAGE_PLAYER,
    TRIGGER_THIS_ACTIVATES,
    TRIGGER_THIS_SCHEME,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';

const SET = 'brotherhood-of-badoon';
const SHIP_COMMAND_SET = 'ship-command';
const SHIP_NAME = 'Nave badoon';
const SPEAR_NAME = 'Lanza de Drang';

const resolveCannons = {
    type: EFFECT_RESOLVE_SPECIAL_ABILITY,
    params: {
        condition: {name: SHIP_NAME},
        filter: {name: SHIP_NAME},
        target: TARGET_ENVIRONMENT,
    },
};

const chargeCannonsAbility = {
    type: ABILITY_SPECIAL,
    params: {
        name: 'Cargar los cañones',
        effect: {
            type: EFFECT_PLACE_COUNTERS,
            params: {
                counters: 1,
                target: TARGET_THIS,
                thenEffect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {'ability.card.counters': '>3'},
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_SHOW_CARDS,
                                        params: {
                                            title: 'Cargar los cañones',
                                            subtitle: 'La Nave badoon infligirá 2 de Daño indirecto a cada jugador.',
                                            target: TARGET_THIS,
                                        },
                                    },
                                    {
                                        type: EFFECT_SIMULTANEOUS,
                                        params: {
                                            effects: [
                                                {
                                                    type: EFFECT_FOR_EACH,
                                                    params: {
                                                        target: TARGET_ALL_PLAYERS,
                                                        effect: {
                                                            type: EFFECT_ASSIGN_DAMAGE,
                                                            params: {
                                                                damage: 2,
                                                                target: TARGET_YOU,
                                                            },
                                                        },
                                                    },
                                                },
                                                {
                                                    type: EFFECT_REMOVE_COUNTER,
                                                    params: {
                                                        paramsCalc: {
                                                            formula: CALC_COUNTERS,
                                                            target: 'effect.ability.card',
                                                        },
                                                        target: TARGET_THIS,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        },
    },
};

const chargeCannonsAfterFirstStep = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_VILLAIN_PHASE_STEP,
        condition: {step: 1},
        effect: resolveCannons,
    },
};

const exhaustMilano = {
    type: EFFECT_EXHAUST,
    params: {
        // Milano is the only player Support in this required encounter set.
        condition: {set: SHIP_COMMAND_SET},
        target: TARGET_SUPPORT_YOU_CONTROL,
    },
};

const setupBadoonShip = {
    type: ABILITY_SETUP,
    params: {
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_SEARCH_CARDS,
                        params: {
                            filter: {name: SHIP_NAME, isEnvironment: true},
                            firstMatch: true,
                            locations: [PLACE_ENCOUNTER_DECK_CARDS],
                            requireMatch: true,
                        },
                    },
                    {
                        type: EFFECT_PUT_PLAY,
                        params: {
                            cardSource: 'selectedCards',
                            controller: 'match.scenario',
                            target: TARGET_SCENARIO,
                        },
                    },
                ],
            },
        },
    },
};

const drangStageOne = {
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Drang',
        set: SET,
        image: `scenarios/${SET}/16058.png`,
        traits: [TRAIT_BADOON],
        unique: true,
        stage: 1,
        attack: 2,
        scheme: 1,
        hitPoints: [13, true],
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_SCHEME,
                    effect: resolveCannons,
                },
            },
        ],
    },
};

const drangStageTwo = {
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Drang',
        set: SET,
        image: `scenarios/${SET}/16059.png`,
        traits: [TRAIT_BADOON],
        unique: true,
        stage: 2,
        attack: 3,
        scheme: 2,
        hitPoints: [14, true],
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'match.inPlayCards.*.name': SPEAR_NAME,
                            },
                            effect: {
                                type: EFFECT_STORE_BOOST,
                                params: {
                                    count: 1,
                                    target: TARGET_VILLAIN,
                                },
                            },
                            effectNot: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_SEARCH_CARD_REVEAL,
                                            params: {
                                                condition: {name: SPEAR_NAME},
                                                places: [
                                                    PLACE_ENCOUNTER_DECK_CARDS,
                                                    PLACE_ENCOUNTER_DISCARD,
                                                ],
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
                },
            },
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_SCHEME,
                    effect: resolveCannons,
                },
            },
        ],
    },
};

const drangStageThree = {
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Drang',
        set: SET,
        image: `scenarios/${SET}/16060.png`,
        traits: [TRAIT_BADOON],
        unique: true,
        stage: 3,
        attack: 3,
        scheme: 3,
        hitPoints: [18, true],
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        count: 4,
                                        target: TARGET_ENCOUNTER_DECK,
                                    },
                                },
                                {
                                    type: EFFECT_RESOLVE_CARDS_IN_ORDER,
                                    params: {
                                        cards: 'effects.0.cards',
                                        chooseOrder: false,
                                        effectDefinition: {
                                            type: EFFECT_ENGAGE,
                                            params: {
                                                cardSource: 'card',
                                                cardCondition: {isMinion: true},
                                                controller: 'match.scenario',
                                                target: TARGET_PLAYER_FEWEST_MINIONS,
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
                    trigger: TRIGGER_THIS_ACTIVATES,
                    effect: resolveCannons,
                },
            },
        ],
    },
};

const terrestrialInvasionA = {
    type: CARD_TYPE_MAIN_SCHEME_A_CARD,
    params: {
        name: 'Invasión extraterrestre',
        set: SET,
        image: `scenarios/${SET}/16061a.png`,
        stage: 1,
        abilities: [setupBadoonShip],
    },
};

const terrestrialInvasionB = {
    type: CARD_TYPE_MAIN_SCHEME_B_CARD,
    params: {
        name: 'Invasión extraterrestre',
        set: SET,
        image: `scenarios/${SET}/16061b.png`,
        stage: 1,
        startingThreat: [2, true],
        acceleration: [2, true],
        value: [8, true],
        abilities: [
            chargeCannonsAfterFirstStep,
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    name: 'Agota la Milano para quitar 3 de Amenaza de este Plan',
                    arrow: exhaustMilano,
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            threat: 3,
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const protectThePlanetA = {
    type: CARD_TYPE_MAIN_SCHEME_A_CARD,
    params: {
        name: 'Proteger el planeta',
        set: SET,
        image: `scenarios/${SET}/16062a.png`,
        stage: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {effect: resolveCannons},
            },
        ],
    },
};

const protectThePlanetB = {
    type: CARD_TYPE_MAIN_SCHEME_B_CARD,
    params: {
        name: 'Proteger el planeta',
        set: SET,
        image: `scenarios/${SET}/16062b.png`,
        stage: 2,
        startingThreat: [4, true],
        acceleration: [2, true],
        value: [8, true],
        final: true,
        abilities: [
            chargeCannonsAfterFirstStep,
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    name: 'Agota la Milano para quitar 3 de Amenaza de este Plan o infligir 3 de Daño a un Esbirro',
                    arrow: exhaustMilano,
                    effect: {
                        type: EFFECT_CHOOSE,
                        params: {
                            options: [
                                {
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        title: 'Quita 3 de Amenaza de este Plan',
                                        threat: 3,
                                        target: TARGET_THIS,
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        title: 'Inflige 3 de Daño a un Esbirro',
                                        damage: 3,
                                        target: TARGET_MINION,
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

const badoonShip = {
    type: CARD_TYPE_ENVIRONMENT,
    params: {
        name: SHIP_NAME,
        set: SET,
        image: `scenarios/${SET}/16063.png`,
        unique: true,
        traits: [TRAIT_AERIAL, TRAIT_VEHICLE],
        boost: 0,
        abilities: [chargeCannonsAbility],
    },
};

const badoonEngineer = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Ingeniero badoon',
        set: SET,
        image: `scenarios/${SET}/16065.png`,
        traits: [TRAIT_BADOON],
        boost: 0,
        attack: 1,
        scheme: 2,
        hitPoints: 3,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: [
                        TRIGGER_ENGAGE_PLAYER,
                        TRIGGER_THIS_ACTIVATES,
                    ],
                    triggerParams: {
                        referentialName: 'Ingeniero badoon',
                    },
                    effect: resolveCannons,
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {effect: resolveCannons},
        },
    },
};

const drangSpear = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: SPEAR_NAME,
        set: SET,
        image: `scenarios/${SET}/16064.png`,
        unique: true,
        traits: [TRAIT_WEAPON],
        attach: {
            target: TARGET_CONDITION_CARD,
            condition: {name: 'Drang'},
        },
        attack: 1,
        boost: 3,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    triggerParams: {
                        cardCondition: {name: SPEAR_NAME},
                    },
                    effect: {
                        type: EFFECT_ADD_KEYWORD,
                        params: {
                            keyword: {stalwart: true},
                            target: TARGET_ATTACHED,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    name: 'Gasta recursos [m][p][p] para descartar esta carta',
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [
                                RESOURCE_MENTAL,
                                RESOURCE_PHYSICAL,
                                RESOURCE_PHYSICAL,
                            ],
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

const orbitalLockdown = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Bloqueo orbital',
        set: SET,
        image: `scenarios/${SET}/16066.png`,
        startingThreat: 2,
        keywords: {hinder: [2, true]},
        icons: {crisis: true},
        boost: 1,
        abilities: [
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    name: 'Agota la Milano para quitar 3 de Amenaza de este Plan',
                    arrow: exhaustMilano,
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            threat: 3,
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const bombardment = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Bombardeo',
        set: SET,
        image: `scenarios/${SET}/16067.png`,
        startingThreat: [3, true],
        boost: 2,
        abilities: [
            chargeCannonsAfterFirstStep,
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    name: 'Agota la Milano para quitar 3 de Amenaza de este Plan',
                    arrow: exhaustMilano,
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            threat: 3,
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const oppressiveArmada = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Armada opresora',
        set: SET,
        image: `scenarios/${SET}/16068.png`,
        startingThreat: 1,
        keywords: {hinder: [3, true]},
        icons: {hazard: 1},
        boost: 1,
        abilities: [
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    name: 'Agota la Milano para quitar 3 de Amenaza de este Plan',
                    arrow: exhaustMilano,
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            threat: 3,
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const spatialOrientation = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Orientación espacial',
        set: SET,
        image: `scenarios/${SET}/16069.png`,
        startingThreat: [3, true],
        icons: {amplification: 1},
        boost: 3,
        abilities: [
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    name: 'Agota la Milano para quitar 3 de Amenaza de este Plan',
                    arrow: exhaustMilano,
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            threat: 3,
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

export default {
    _id: SET,
    name: 'Hermandad de los Badoon',
    folder: SET,
    config: {
        name: 'Hermandad de los Badoon',
        villains: [drangStageOne, drangStageTwo],
        expertVillains: [drangStageTwo, drangStageThree],
        mainSchemes: [
            [terrestrialInvasionA, terrestrialInvasionB],
            [protectThePlanetA, protectThePlanetB],
        ],
        cards: [
            {count: 1, card: badoonShip},
            {count: 1, card: drangSpear},
            {count: 2, card: badoonEngineer},
            {count: 1, card: orbitalLockdown},
            {count: 1, card: bombardment},
            {count: 1, card: oppressiveArmada},
            {count: 1, card: spatialOrientation},
        ],
        sets: ['standard', SHIP_COMMAND_SET],
        defaultSets: ['band-of-badoon'],
    },
};
