import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_DEFEATED,
    CALC_COUNTERS,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_HEAL,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PLACE_THREAT,
    EFFECT_PLAY_CARD,
    EFFECT_READY,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ARTIFACT,
    TRIGGER_ATTACHED_GET_ATTACK,
    TRIGGER_ATTACHED_GET_THWART,
    TRIGGER_PLAYER_TURN_START,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
} from 'mc-shared';

const SET = 'galactic-artifacts';

const discardThis = {
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
};

const herculesCloak = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Manto de Hércules',
        set: SET,
        image: 'sets/galactic-artifacts/16122.png',
        unique: true,
        traits: [TRAIT_ARTIFACT],
        attack: 3,
        attach: {
            target: TARGET_CONDITION_CARD,
            condition: {
                isEnemy: true,
                attack: {operator: 'min'},
            },
        },
        boost: 2,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [
                                RESOURCE_PHYSICAL,
                                RESOURCE_PHYSICAL,
                                RESOURCE_PHYSICAL,
                            ],
                        },
                    },
                    effect: discardThis,
                },
            },
        ],
    },
};

const obediencePotion = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Poción de obediencia',
        set: SET,
        image: 'sets/galactic-artifacts/16123.png',
        unique: true,
        traits: [TRAIT_ARTIFACT],
        attach: TARGET_YOUR_SUPERHERO,
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_ATTACHED_GET_THWART,
                    effect: {
                        type: EFFECT_MODIFY_THWART_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: -1,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_ATTACHED_GET_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: -1,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_DEFENSE,
                    effect: {
                        type: EFFECT_MODIFY_DEFENSE_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: -1,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_TAKE_DAMAGE,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        damage: 1,
                                    },
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        resources: [
                                            RESOURCE_MENTAL,
                                            RESOURCE_MENTAL,
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    effect: discardThis,
                },
            },
        ],
    },
};

const almightyJacket = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Chaqueta del Todopoderoso',
        set: SET,
        image: 'sets/galactic-artifacts/16124.png',
        unique: true,
        traits: [TRAIT_ARTIFACT],
        attach: {
            target: TARGET_CONDITION_CARD,
            condition: {
                isEnemy: true,
                scheme: {operator: 'max'},
            },
        },
        icons: {amplification: 1},
        boost: 3,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_PLACE_THREAT,
                                    params: {
                                        target: TARGET_MAIN_SCHEME,
                                        threat: 2,
                                    },
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        resources: [RESOURCE_ANY, RESOURCE_ANY],
                                        sameType: true,
                                    },
                                },
                            ],
                        },
                    },
                    effect: discardThis,
                },
            },
        ],
    },
};

const poison = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'El Veneno',
        set: SET,
        image: 'sets/galactic-artifacts/16125.png',
        unique: true,
        traits: [TRAIT_ARTIFACT],
        attach: TARGET_YOUR_SUPERHERO,
        boost: 2,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_PLAYER_TURN_START,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_THIS,
                            counters: 1,
                            thenEffect: {
                                type: EFFECT_TAKE_DAMAGE,
                                params: {
                                    target: TARGET_YOU,
                                    paramsCalc: {
                                        target: 'card',
                                        formula: CALC_COUNTERS,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [RESOURCE_ANY, RESOURCE_ANY, RESOURCE_ANY],
                            differentTypes: true,
                        },
                    },
                    effect: discardThis,
                },
            },
        ],
    },
};

const vandarianEnergyWand = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Varita vandariana de energía',
        set: SET,
        image: 'sets/galactic-artifacts/16126.png',
        unique: true,
        traits: [TRAIT_ARTIFACT],
        attach: {
            target: TARGET_CONDITION_CARD,
            condition: {
                isEnemy: true,
                scheme: {operator: 'min'},
            },
        },
        icons: {hazard: 1},
        boost: 1,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [
                                RESOURCE_ENERGY,
                                RESOURCE_ENERGY,
                                RESOURCE_ENERGY,
                            ],
                        },
                    },
                    effect: discardThis,
                },
            },
        ],
    },
};

const hujahdarianMonarchEgg = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Huevo del monarca hujahdariano',
        set: SET,
        image: 'sets/galactic-artifacts/16127.png',
        unique: true,
        startingThreat: 3,
        keywords: {hinder: [2, true], victory: 0},
        icons: {acceleration: 1},
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_MAY,
                        params: {
                            effect: {
                                type: EFFECT_READY,
                                params: {target: TARGET_YOUR_SUPERHERO},
                            },
                        },
                    },
                },
            },
        ],
    },
};

const magicTeapot = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Tetera mágica',
        set: SET,
        image: 'sets/galactic-artifacts/16128.png',
        unique: true,
        startingThreat: 3,
        keywords: {hinder: [2, true], victory: 0},
        icons: {hazard: 1},
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_MAY,
                        params: {
                            effect: {
                                type: EFFECT_HEAL,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    damage: 4,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const philosophersStone = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Piedra filosofal',
        set: SET,
        image: 'sets/galactic-artifacts/16129.png',
        unique: true,
        startingThreat: 3,
        keywords: {hinder: [2, true], victory: 0},
        icons: {amplification: 1},
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_MAY,
                        params: {
                            effect: {
                                type: EFFECT_DRAW_CARD,
                                params: {
                                    target: TARGET_YOU,
                                    count: 2,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const crystalBall = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Bola de cristal',
        set: SET,
        image: 'sets/galactic-artifacts/16130.png',
        unique: true,
        startingThreat: 3,
        keywords: {hinder: [2, true], victory: 0},
        icons: {acceleration: 1},
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_MAY,
                        params: {
                            effect: {
                                type: EFFECT_PLAY_CARD,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'player.hand.cards',
                                    costReduction: 3,
                                    requiresSharedTrait: false,
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
        name: 'Artefactos galácticos',
        standard: false,
        cards: [
            {count: 1, card: herculesCloak},
            {count: 1, card: obediencePotion},
            {count: 1, card: almightyJacket},
            {count: 1, card: poison},
            {count: 1, card: vandarianEnergyWand},
            {count: 1, card: hujahdarianMonarchEgg},
            {count: 1, card: magicTeapot},
            {count: 1, card: philosophersStone},
            {count: 1, card: crystalBall},
        ],
    },
};
