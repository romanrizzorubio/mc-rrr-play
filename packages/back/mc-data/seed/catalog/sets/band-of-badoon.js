import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    CARD_TYPE_MINION,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_TOUGH,
    TARGET_ACTIVATION,
    TARGET_EFFECT,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_BADOON,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_ENGAGE_PLAYER,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

const SET = 'band-of-badoon';

const badoonAssassin = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Asesino badoon',
        set: SET,
        image: 'sets/band-of-badoon/16117.png',
        traits: [TRAIT_BADOON],
        boost: 0,
        attack: 1,
        scheme: 1,
        hitPoints: 1,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_ENGAGE_HERO,
                    effect: {
                        type: EFFECT_ENEMY_ATTACK,
                        params: {
                            enemyType: TARGET_THIS,
                            attackModifier: 2,
                            target: TARGET_YOU,
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {'activation.effect.isAttack': true},
                        effect: {
                            type: EFFECT_MODIFY_ATTACK,
                            params: {
                                target: TARGET_ACTIVATION,
                                modify: {
                                    keywords: {
                                        ranged: true,
                                        overkill: true,
                                        piercing: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

const badoonInfantry = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Infantería badoon',
        set: SET,
        image: 'sets/band-of-badoon/16118.png',
        traits: [TRAIT_BADOON],
        boost: 0,
        attack: 2,
        scheme: 2,
        hitPoints: 2,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_ENGAGE_PLAYER,
                    condition: {
                        'effect.selectedTarget.gameZone.minions.length': 1,
                    },
                    effect: {
                        type: EFFECT_DEAL_ENCOUNTER,
                        params: {
                            count: 1,
                            target: TARGET_YOU,
                        },
                    },
                },
            },
        ],
    },
};

const badoonLieutenant = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Lugarteniente badoon',
        set: SET,
        image: 'sets/band-of-badoon/16119.png',
        traits: [TRAIT_BADOON],
        keywords: {patrol: true},
        boost: 1,
        attack: 2,
        scheme: 2,
        hitPoints: 6,
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {'activation.effect.isScheme': true},
                        effect: {
                            type: EFFECT_MODIFY_BOOST_ICONS,
                            params: {
                                count: 2,
                                target: TARGET_EFFECT,
                            },
                        },
                    },
                },
            },
        },
    },
};

const badoonSentinel = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Centinela badoon',
        set: SET,
        image: 'sets/band-of-badoon/16120.png',
        traits: [TRAIT_BADOON],
        keywords: {retaliate: 1},
        boost: 1,
        attack: 1,
        scheme: 1,
        hitPoints: 5,
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {'match.villain.isTough': true},
                        effect: {
                            type: EFFECT_MODIFY_BOOST_ICONS,
                            params: {
                                count: 2,
                                target: TARGET_EFFECT,
                            },
                        },
                        effectNot: {
                            type: EFFECT_TOUGH,
                            params: {target: TARGET_VILLAIN},
                        },
                    },
                },
            },
        },
    },
};

const badoonChieftain = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Caudillo badoon',
        set: SET,
        image: 'sets/band-of-badoon/16121.png',
        traits: [TRAIT_BADOON],
        boost: 0,
        attack: 3,
        scheme: 1,
        hitPoints: 4,
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
                                keywords: {overkill: true},
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
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {'activation.effect.isAttack': true},
                        effect: {
                            type: EFFECT_MODIFY_BOOST_ICONS,
                            params: {
                                count: 2,
                                target: TARGET_EFFECT,
                            },
                        },
                    },
                },
            },
        },
    },
};

export default {
    _id: SET,
    config: {
        name: 'Banda Badoon',
        standard: false,
        cards: [
            {count: 2, card: badoonAssassin},
            {count: 3, card: badoonInfantry},
            {count: 1, card: badoonLieutenant},
            {count: 2, card: badoonSentinel},
            {count: 2, card: badoonChieftain},
        ],
    },
};
