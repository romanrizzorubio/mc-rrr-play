import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    CALC_ALL,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    DECK_POSITION_SHUFFLE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_COUNT_BOOST_ICONS,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MOVE_TO_DECK,
    EFFECT_STUN,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_YOU,
    TRAIT_CREATURE,
    TRAIT_SOLDIER,
    TRAIT_TEMPORAL,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
} from 'mc-shared';

const SET = 'temporal';

const ancientWarrior = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Guerrero de la antigüedad',
        set: SET,
        image: 'sets/temporal/11030.png',
        traits: [TRAIT_SOLDIER, TRAIT_TEMPORAL],
        boost: 0,
        attack: 2,
        scheme: 1,
        hitPoints: 2,
        keywords: {
            quickStrike: true,
        },
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_STUN,
                    params: {
                        target: TARGET_YOU,
                    },
                },
            },
        },
    },
};

const chitauriSoldier = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Soldado chitauri',
        set: SET,
        image: 'sets/temporal/11031.png',
        traits: [TRAIT_SOLDIER, TRAIT_TEMPORAL],
        boost: 1,
        attack: 1,
        scheme: 1,
        hitPoints: 3,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
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
                                    type: EFFECT_COUNT_BOOST_ICONS,
                                    params: {
                                        card: 'effects.0.cards.0',
                                    },
                                },
                                {
                                    type: EFFECT_ASSIGN_DAMAGE,
                                    params: {
                                        damage: 0,
                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                        paramsCalc: {
                                            target: 'effects.1.value',
                                            formula: CALC_ALL,
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

const tyrannosaurusRex = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Tiranosaurio rex',
        set: SET,
        image: 'sets/temporal/11032.png',
        traits: [TRAIT_CREATURE, TRAIT_TEMPORAL],
        boost: 3,
        attack: 3,
        scheme: 0,
        hitPoints: 6,
        keywords: {
            toughness: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK,
                        params: {
                            target: TARGET_EFFECT,
                            modify: {
                                keywords: {
                                    piercing: true,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const timePortal = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Portal a través del tiempo',
        set: SET,
        image: 'sets/temporal/11033.png',
        boost: 2,
        startingThreat: [2, true],
        icons: {hazard: 1},
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_THIS_DEFEAT,
                    effect: {
                        type: EFFECT_MOVE_TO_DECK,
                        params: {
                            target: TARGET_ENCOUNTER_DECK,
                            position: DECK_POSITION_SHUFFLE,
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
        name: 'Temporal',
        standard: false,
        cards: [
            {count: 3, card: ancientWarrior},
            {count: 2, card: chitauriSoldier},
            {count: 1, card: tyrannosaurusRex},
            {count: 1, card: timePortal},
        ],
    },
};
