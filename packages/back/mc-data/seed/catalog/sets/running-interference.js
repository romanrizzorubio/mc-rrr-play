import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    EFFECT_CANNOT,
    EFFECT_CHOOSE,
    EFFECT_DO_IF,
    EFFECT_DISCARD_GAME,
    EFFECT_PLACE_THREAT,
    EFFECT_RESOLVE_ABILITY,
    EFFECT_SELECT_DISCARD_TO_FIND_CARD,
    EFFECT_SPEND,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_PLAYER,
    TARGET_REVEALED_ABILITY,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_CRIMINAL,
    TRIGGER_ENCOUNTER_ABILITY_RESOLVED,
    TRIGGER_PLAYER_CAN_FLIP,
    TRIGGER_PLAYER_CAN_READY,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

const discardMentalOrPhysicalResource = {
    type: EFFECT_SELECT_DISCARD_TO_FIND_CARD,
    params: {
        count: 1,
        cardCondition: {
            resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        },
        upTo: false,
        target: TARGET_YOU,
        title: 'Descarta un recurso [m] o [p] de tu mano',
    },
};

export default {
    _id: 'running-interference',
    config: {
        name: 'Impedimentos',
        standard: false,
        cards: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'Impedimentos',
                        set: 'running-interference',
                        image: 'sets/running-interference/02046.png',
                        startingThreat: [1, true],
                        icons: {crisis: true},
                        boost: 1,
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: {
                                        type: EFFECT_CHOOSE,
                                        params: {
                                            players: TARGET_ALL_PLAYERS,
                                            options: [
                                                {
                                                    type: EFFECT_SELECT_DISCARD_TO_FIND_CARD,
                                                    params: {
                                                        title: 'Descarta recursos [m] y [p] de tu mano',
                                                        target: TARGET_PLAYER,
                                                        resourceRequirements: [
                                                            [RESOURCE_MENTAL],
                                                            [RESOURCE_PHYSICAL],
                                                        ],
                                                        upTo: false,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_PLACE_THREAT,
                                                    params: {
                                                        title: 'Coloca 2 de Amenaza sobre esta carta',
                                                        target: TARGET_THIS,
                                                        threat: 2,
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
                        name: 'Lápida',
                        set: 'running-interference',
                        image: 'sets/running-interference/02047.png',
                        unique: true,
                        traits: [TRAIT_CRIMINAL],
                        boost: 2,
                        attack: 3,
                        scheme: 2,
                        hitPoints: 9,
                        abilities: [
                            {
                                type: ABILITY_FORCED_RESPONSE,
                                params: {
                                    trigger: TRIGGER_THIS_ATTACK,
                                    condition: {'effect.takenDamage': '>0'},
                                    effect: {
                                        type: EFFECT_DO_IF,
                                        params: {
                                            condition: {
                                                'effect.selectedTarget.isSuperhero': true,
                                            },
                                            effect: discardMentalOrPhysicalResource,
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
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Con las manos atadas',
                        set: 'running-interference',
                        image: 'sets/running-interference/02048.png',
                        boost: 0,
                        attach: TARGET_YOUR_SUPERHERO,
                        abilities: [
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    trigger: TRIGGER_PLAYER_CAN_READY,
                                    hideDialog: true,
                                    effect: {
                                        type: EFFECT_CANNOT,
                                        params: {
                                            restriction: 'ready',
                                            sourceIn: 'player.superhero.attached',
                                            targetCondition: {isSuperhero: true},
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    trigger: TRIGGER_PLAYER_CAN_FLIP,
                                    hideDialog: true,
                                    effect: {
                                        type: EFFECT_CANNOT,
                                        params: {
                                            restriction: 'flip',
                                            sourceIn: 'player.superhero.attached',
                                            targetCondition: {isSuperhero: true},
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_ACTION,
                                params: {
                                    arrow: {
                                        type: EFFECT_SPEND,
                                        params: {
                                            resources: [
                                                RESOURCE_MENTAL,
                                                RESOURCE_PHYSICAL,
                                            ],
                                        },
                                    },
                                    effect: {
                                        type: EFFECT_DISCARD_GAME,
                                        params: {
                                            target: TARGET_THIS,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Cobertura mediática',
                        set: 'running-interference',
                        image: 'sets/running-interference/02049.png',
                        boost: 1,
                        attach: TARGET_YOUR_SUPERHERO,
                        abilities: [
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    trigger: TRIGGER_ENCOUNTER_ABILITY_RESOLVED,
                                    hideDialog: true,
                                    effect: {
                                        type: EFFECT_RESOLVE_ABILITY,
                                        params: {
                                            target: TARGET_REVEALED_ABILITY,
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_ALTEREGO_ACTION,
                                params: {
                                    arrow: {
                                        type: EFFECT_SPEND,
                                        params: {
                                            resources: [RESOURCE_MENTAL],
                                        },
                                    },
                                    effect: {
                                        type: EFFECT_DISCARD_GAME,
                                        params: {
                                            target: TARGET_THIS,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};
