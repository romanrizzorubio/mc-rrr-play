import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    CALC_BOOST_ICONS,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_FOR_EACH,
    EFFECT_HEAL,
    EFFECT_SELECT_DISCARD_TO_FIND_CARD,
    EFFECT_SURGE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_PLAYERS,
    TARGET_ENCOUNTER_DECK,
    TARGET_PLAYER,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_CRIMINAL,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

const resourceIcons = [
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
];

const discardThreeForBoost = () => ({
    type: ABILITY_BOOST,
    params: {
        effect: {
            type: EFFECT_DISCARD_FROM_DECK,
            params: {
                count: 3,
                target: TARGET_ENCOUNTER_DECK,
            },
        },
    },
});

export default {
    _id: 'power-drain',
    config: {
        name: 'Alta tensión',
        standard: false,
        cards: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'Alta tensión',
                        set: 'power-drain',
                        image: 'sets/power-drain/02041.png',
                        startingThreat: [2, true],
                        icons: {acceleration: 1},
                        boost: 3,
                        abilities: [
                            {
                                type: ABILITY_WHEN_DEFEATED,
                                params: {
                                    effect: {
                                        type: EFFECT_CHAINED,
                                        params: {
                                            effects: [
                                                {
                                                    type: EFFECT_DISCARD_FROM_DECK,
                                                    params: {
                                                        count: 2,
                                                        target: TARGET_ENCOUNTER_DECK,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_FOR_EACH,
                                                    params: {
                                                        target: TARGET_ALL_PLAYERS,
                                                        effect: {
                                                            type: EFFECT_SELECT_DISCARD_TO_FIND_CARD,
                                                            params: {
                                                                count: 0,
                                                                target: TARGET_PLAYER,
                                                                resourceTypes: resourceIcons,
                                                                paramsCalc: {
                                                                    target: 'effects.0.cards',
                                                                    formula: CALC_BOOST_ICONS,
                                                                },
                                                                upTo: false,
                                                                title: 'Elige y descarta recursos de tu mano',
                                                            },
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
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_MINION,
                    params: {
                        name: 'Electro',
                        set: 'power-drain',
                        image: 'sets/power-drain/02042.png',
                        unique: true,
                        traits: [TRAIT_CRIMINAL],
                        boost: 2,
                        attack: 2,
                        scheme: 2,
                        hitPoints: 6,
                        abilities: [
                            {
                                type: ABILITY_FORCED_RESPONSE,
                                params: {
                                    trigger: TRIGGER_THIS_ATTACK,
                                    effect: {
                                        type: EFFECT_CHAINED,
                                        params: {
                                            effects: [
                                                {
                                                    type: EFFECT_DISCARD_FROM_DECK,
                                                    params: {
                                                        count: 1,
                                                        target: TARGET_ENCOUNTER_DECK,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_ASSIGN_DAMAGE,
                                                    params: {
                                                        damage: 0,
                                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                        paramsCalc: {
                                                            target: 'effects.0.cards',
                                                            formula: CALC_BOOST_ICONS,
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                        boostAbility: discardThreeForBoost(),
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Pulso electromagnético',
                        set: 'power-drain',
                        image: 'sets/power-drain/02043.png',
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
                                                    type: EFFECT_DISCARD_FROM_DECK,
                                                    params: {
                                                        count: 7,
                                                        target: TARGET_ENCOUNTER_DECK,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_DO_IF,
                                                    params: {
                                                        condition: {
                                                            'effects.0.cards.*.name': 'Electro',
                                                        },
                                                        effect: {
                                                            type: EFFECT_ENGAGE,
                                                            params: {
                                                                cardSource: 'effects.0.cards',
                                                                cardCondition: {name: 'Electro'},
                                                                target: TARGET_YOU,
                                                            },
                                                        },
                                                        effectNot: {
                                                            type: EFFECT_SURGE,
                                                            params: {},
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                        boostAbility: discardThreeForBoost(),
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Descarga eléctrica',
                        set: 'power-drain',
                        image: 'sets/power-drain/02044.png',
                        boost: 1,
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
                                                        count: 2,
                                                        target: TARGET_ENCOUNTER_DECK,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_ASSIGN_DAMAGE,
                                                    params: {
                                                        damage: 0,
                                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                        paramsCalc: {
                                                            target: 'effects.0.cards',
                                                            formula: CALC_BOOST_ICONS,
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                        boostAbility: discardThreeForBoost(),
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Terapia de electrochoque',
                        set: 'power-drain',
                        image: 'sets/power-drain/02045.png',
                        boost: 1,
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
                                                        count: [1, true],
                                                        target: TARGET_ENCOUNTER_DECK,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_HEAL,
                                                    params: {
                                                        damage: 0,
                                                        target: TARGET_VILLAIN,
                                                        paramsCalc: {
                                                            target: 'effects.0.cards',
                                                            formula: CALC_BOOST_ICONS,
                                                        },
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                        boostAbility: discardThreeForBoost(),
                    },
                },
            },
        ],
    },
};
