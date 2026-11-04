import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    ABILITY_ALTEREGO_ACTION,
    CALC_COUNT,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_ACTIVATE,
    EFFECT_CANNOT_TARGET,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_ENGAGE,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_SCHEME_VALUE,
    EFFECT_SEARCH_CARDS,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_ELITE,
    TRAIT_TEMPORAL,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_THIS_GET_SCHEME,
} from 'mc-shared';

const SET = 'master-of-time';
const KANG_NAME = 'Kang (Amo del tiempo)';
const OBLIGATION_NAME = 'Miedo a Kang';

const kang = {
    type: CARD_TYPE_MINION,
    params: {
        name: KANG_NAME,
        set: SET,
        image: 'sets/master-of-time/11047.png',
        traits: [TRAIT_ELITE, TRAIT_TEMPORAL],
        boost: 2,
        attack: 1,
        scheme: 1,
        hitPoints: 6,
        keywords: {
            toughness: true,
            villainous: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_GET_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'player.gameZone.cards',
                                formula: CALC_COUNT,
                                conditions: {isObligation: true},
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_GET_SCHEME,
                    effect: {
                        type: EFFECT_MODIFY_SCHEME_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'player.gameZone.cards',
                                formula: CALC_COUNT,
                                conditions: {isObligation: true},
                            },
                        },
                    },
                },
            },
        ],
    },
};

const otherEraSoldier = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Soldado de otra época',
        set: SET,
        image: 'sets/master-of-time/11048.png',
        traits: [TRAIT_ELITE, TRAIT_TEMPORAL],
        boost: 0,
        attack: 2,
        scheme: 1,
        hitPoints: 3,
        keywords: {
            incite: 1,
            surge: true,
        },
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DEAL_ENCOUNTER,
                    params: {
                        target: TARGET_YOU,
                        count: 1,
                    },
                },
            },
        },
    },
};

const fearOfKang = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: OBLIGATION_NAME,
        set: SET,
        image: 'sets/master-of-time/11049.png',
        traits: [TRAIT_TEMPORAL],
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    validation: {
                        type: EFFECT_CANNOT_TARGET,
                        params: {
                            effectCategories: [EFFECT_CATEGORY_DAMAGE],
                            targetCondition: {
                                name: {
                                    operator: 'matchesTitle',
                                    value: 'Kang',
                                },
                            },
                            effectCondition: {'effect.isAttack': true},
                        },
                    },
                },
            },
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    name: 'Descarta una carta al azar de tu mano → descarta esta Obligación',
                    arrow: {
                        type: EFFECT_DISCARD_RANDOM,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
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

const sphereOfCenturies = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'La esfera con la luz de los siglos',
        set: SET,
        image: 'sets/master-of-time/11050.png',
        boost: 3,
        startingThreat: 3,
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
                                    params: {
                                        cardSource: 'selectedCard',
                                        target: TARGET_YOU,
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

const oldGrudge = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Antigua rencilla',
        set: SET,
        image: 'sets/master-of-time/11051.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_DO_IF_CARD_GAME,
                        params: {
                            condition: {name: KANG_NAME},
                            effect: {
                                type: EFFECT_ACTIVATE,
                                params: {
                                    target: TARGET_ENEMY,
                                    condition: {name: KANG_NAME},
                                },
                            },
                            effectNot: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_SEARCH_CARDS,
                                            params: {
                                                locations: [
                                                    PLACE_ENCOUNTER_DECK_CARDS,
                                                    PLACE_ENCOUNTER_DISCARD,
                                                ],
                                                filter: {
                                                    name: KANG_NAME,
                                                },
                                                requireMatch: true,
                                            },
                                        },
                                        {
                                            type: EFFECT_ENGAGE,
                                            params: {
                                                cardSource: 'selectedCards',
                                                cardCondition: {
                                                    name: KANG_NAME,
                                                },
                                                target: TARGET_YOU,
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

export default {
    _id: SET,
    config: {
        name: 'Amo del tiempo',
        standard: false,
        cards: [
            {count: 1, card: kang},
            {count: 2, card: otherEraSoldier},
            {count: 2, card: fearOfKang},
            {count: 1, card: sphereOfCenturies},
            {count: 2, card: oldGrudge},
        ],
    },
};
