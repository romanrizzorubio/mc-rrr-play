import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_ALTEREGO_RESOURCE,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_WHEN_REVEALED,
    CALC_ATTACK,
    CALC_COUNT,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_HERO,
    EFFECT_ADD_KEYWORD,
    EFFECT_CHAINED,
    EFFECT_CANNOT_TARGET,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DRAW_CARD,
    EFFECT_ENEMY_ATTACK,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_RECOVERY_VALUE,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_ALLIES,
    TARGET_ALL_CHARACTERS,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_HERO,
    TARGET_INITIAL_PLAYER,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_SIDE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_ELITE,
    TRAIT_GAMMA,
    TRAIT_GENIUS,
    TRAIT_LOCATION,
    TRAIT_SCIENTIST,
    TRAIT_SUPERPOWER,
    TRAIT_THWART,
    TRIGGER_INSTANT,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_THIS_ATTACK,
    TRIGGER_YOUR_ALTEREGO_GET_RECOVERY,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS,
    TRIGGER_YOU_BASIC_ATTACK,
} from 'mc-shared';

const hulkSet = 'Hulk';

const crushingBlow = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Golpe aplastante',
        set: hulkSet,
        image: 'heroes/hulk/10002.png',
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        resourceType: RESOURCE_PHYSICAL,
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            paramsCalc: {
                                target: 'player.superhero.currentSide',
                                formula: CALC_ATTACK,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const hulkSmash = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Hulk aplasta',
        set: hulkSet,
        image: 'heroes/hulk/10003.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_YOU_BASIC_ATTACK,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: 10,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF_HAS_PAID,
                                    params: {
                                        resources: [RESOURCE_PHYSICAL],
                                        exclusive: true,
                                        effect: {
                                            type: EFFECT_MODIFY_ATTACK,
                                            params: {
                                                target: TARGET_EFFECT,
                                                modify: {
                                                    keywords: {
                                                        overkill: true,
                                                    },
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
        ],
    },
};

const suborbitalLeap = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Salto suborbital',
        set: hulkSet,
        image: 'heroes/hulk/10004.png',
        traits: [TRAIT_SUPERPOWER, TRAIT_THWART],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_THWART],
                    effect: {
                        type: EFFECT_DO_IF_HAS_PAID,
                        params: {
                            target: TARGET_SCHEME,
                            resources: [RESOURCE_PHYSICAL],
                            exclusive: true,
                            effect: {
                                type: EFFECT_REMOVE_THREAT,
                                params: {
                                    target: TARGET_SCHEME,
                                    threat: 5,
                                },
                            },
                            effectNot: {
                                type: EFFECT_REMOVE_THREAT,
                                params: {
                                    target: TARGET_SCHEME,
                                    threat: 3,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const thunderclap = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Palmada atronadora',
        set: hulkSet,
        image: 'heroes/hulk/10005.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 3,
                            selectCount: 3,
                            selectUpTo: true,
                            multipleTarget: true,
                        },
                    },
                },
            },
        ],
    },
};

const unstoppableForce = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Fuerza imparable',
        set: hulkSet,
        image: 'heroes/hulk/10006.png',
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_READY,
                                    params: {
                                        target: TARGET_YOUR_HERO,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF_HAS_PAID,
                                    params: {
                                        resources: [RESOURCE_PHYSICAL],
                                        exclusive: true,
                                        effect: {
                                            type: EFFECT_DRAW_CARD,
                                            params: {
                                                target: TARGET_YOU,
                                                count: 1,
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
};

const limitlessStrength = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Fuerza ilimitada',
        set: hulkSet,
        image: 'heroes/hulk/10007.png',
        resources: [
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
        ],
        spendCondition: {'owner.isHero': true},
        classification: CLASSIFICATION_HERO,
    },
};

const bannerLaboratory = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Laboratorio de Banner',
        set: hulkSet,
        image: 'heroes/hulk/10008.png',
        unique: true,
        traits: [TRAIT_LOCATION],
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_ALTEREGO_GET_RECOVERY,
                    condition: {
                        'effect.selectedTarget.name': 'Bruce Banner',
                    },
                    effect: {
                        type: EFFECT_MODIFY_RECOVERY_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 2,
                        },
                    },
                },
            },
            {
                type: ABILITY_ALTEREGO_RESOURCE,
                params: {
                    resource: RESOURCE_MENTAL,
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const unleashedFury = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Furia desatada',
        set: hulkSet,
        image: 'heroes/hulk/10009.png',
        traits: [TRAIT_CONDITION, TRAIT_GAMMA],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        paramsToPlay: {isHero: true},
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    hideDialog: true,
                    trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
                    condition: {'effect.selectedTarget.name': 'Hulk'},
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_SUPERHERO_FLIPS,
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
};

const immovableObject = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Objeto inamovible',
        set: hulkSet,
        image: 'heroes/hulk/10010.png',
        traits: [TRAIT_CONDITION],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_HIT_POINTS,
                    effect: {
                        type: EFFECT_MODIFY_HIT_POINTS,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            count: 4,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    hideDialog: true,
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_ADD_KEYWORD,
                        params: {
                            target: TARGET_ALL_CHARACTERS,
                            condition: {
                                name: 'Hulk',
                            },
                            keyword: {
                                retaliate: 1,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const duelOfTitans = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Duelo de titanes',
        set: hulkSet,
        image: 'heroes/hulk/10028.png',
        boost: 3,
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
                                        target: TARGET_INITIAL_PLAYER,
                                        effect: {
                                            type: EFFECT_ENEMY_ATTACK,
                                            params: {
                                                enemyType: TARGET_ENEMY,
                                                target: [
                                                    TARGET_HERO,
                                                    TARGET_ALL_ALLIES,
                                                ],
                                                condition: {
                                                    attack: {
                                                        operator: 'max',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: [
                                            {'effects.0.results.length': 0},
                                            {'effects.0.results.0.resolved': false},
                                        ],
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

const innerDemons = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Demonios interiores',
        set: hulkSet,
        image: 'heroes/hulk/10025.png',
        boost: 3,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_INSTANT,
                    name: 'Resolver la obligación',
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_FLIP,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        formTarget: TARGET_SIDE,
                                    },
                                },
                            ],
                            thenEffect: {
                                type: EFFECT_DO_IF,
                                params: {
                                    condition: {
                                        'player.superhero.currentSide.name':
                                            'Bruce Banner',
                                    },
                                    effect: {
                                        type: EFFECT_CHAINED,
                                        params: {
                                            effects: [
                                                {
                                                    type: EFFECT_SELECT_DISCARD_CARD,
                                                    params: {
                                                        target: TARGET_YOU,
                                                        count: 2,
                                                        paramsCalc: {
                                                            target: 'player.hand.cards',
                                                            formula: CALC_COUNT,
                                                            max: 2,
                                                        },
                                                        title: 'Descarta 2 cartas de tu mano',
                                                    },
                                                },
                                                {
                                                    type: EFFECT_DISCARD_GAME,
                                                    params: {
                                                        target: TARGET_THIS,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    effectNot: {
                                        type: EFFECT_CHAINED,
                                        params: {
                                            effects: [
                                                {
                                                    type: EFFECT_EXHAUST,
                                                    params: {
                                                        target: TARGET_YOUR_HERO,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_DISCARD_GAME,
                                                    params: {
                                                        target: TARGET_THIS,
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
            },
        ],
    },
};

const abomination = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Abominación',
        set: hulkSet,
        image: 'heroes/hulk/10026.png',
        unique: true,
        nemesis: true,
        traits: [TRAIT_ELITE, TRAIT_GAMMA],
        attack: 3,
        scheme: 2,
        hitPoints: 6,
        boost: 3,
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
                                        target: TARGET_YOU,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.cards.0.resources':
                                                RESOURCE_PHYSICAL,
                                        },
                                        effect: {
                                            type: EFFECT_TAKE_DAMAGE,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                damage: 2,
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
};

const totalDestruction = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Destrucción total',
        set: hulkSet,
        image: 'heroes/hulk/10027.png',
        unique: true,
        startingThreat: [2, true],
        boost: 3,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    validation: {
                        type: EFFECT_CANNOT_TARGET,
                        params: {
                            effectTypes: [EFFECT_REMOVE_THREAT],
                            condition: {
                                name: 'Abominación',
                            },
                        },
                    },
                },
            },
        ],
    },
};

export default {
    _id: 'hulk',
    order: 11,
    name: 'Hulk',
    folder: 'hulk',
    config: {
        sides: [
            {
                type: CARD_TYPE_ALTEREGO,
                params: {
                    name: 'Bruce Banner',
                    set: hulkSet,
                    image: 'heroes/hulk/10001b.png',
                    traits: [
                        TRAIT_GENIUS,
                        TRAIT_SCIENTIST,
                    ],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    recovery: 4,
                    handSize: 5,
                    hitPoints: 18,
                    abilities: [
                        {
                            type: ABILITY_ALTEREGO_ACTION,
                            params: {
                                name: 'Investigación experimental',
                                limit: {
                                    count: 1,
                                    target: TARGET_ROUND,
                                },
                                effect: {
                                    type: EFFECT_CHAINED,
                                    params: {
                                        effects: [
                                            {
                                                type: EFFECT_DRAW_CARD,
                                                params: {
                                                    target: TARGET_YOU,
                                                    count: 1,
                                                },
                                            },
                                            {
                                                type: EFFECT_SELECT_DISCARD_CARD,
                                                params: {
                                                    target: TARGET_YOU,
                                                    count: 1,
                                                    title: 'Elige 1 carta de tu mano para descartar',
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
            {
                type: CARD_TYPE_HERO,
                params: {
                    name: 'Hulk',
                    set: hulkSet,
                    image: 'heroes/hulk/10001a.png',
                    traits: [
                        TRAIT_AVENGER,
                        TRAIT_GAMMA,
                    ],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    thwart: 0,
                    attack: 3,
                    defense: 3,
                    handSize: 4,
                    hitPoints: 18,
                    abilities: [
                        {
                            type: ABILITY_FORCED_INTERRUPT,
                            params: {
                                name: 'Enfurecido',
                                trigger: TRIGGER_PLAYER_TURN_END,
                                effect: {
                                    type: EFFECT_DISCARD_CONDITION_HAND,
                                    params: {
                                        target: TARGET_YOU,
                                        condition: {},
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ],
        cards: [
            {
                count: 2,
                card: crushingBlow,
            },
            {
                count: 2,
                card: hulkSmash,
            },
            {
                count: 2,
                card: suborbitalLeap,
            },
            {
                count: 2,
                card: thunderclap,
            },
            {
                count: 2,
                card: unstoppableForce,
            },
            {
                count: 2,
                card: limitlessStrength,
            },
            {
                count: 1,
                card: bannerLaboratory,
            },
            {
                count: 1,
                card: unleashedFury,
            },
            {
                count: 1,
                card: immovableObject,
            },
        ],
        precon: [
            {
                classification: 'basic',
                cardRefs: [
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-al-rescate', count: 3},
                    {id: 'basic-avengers-mansion', count: 1},
                    {id: 'basic-helicarrier', count: 1},
                ],
            },
            {
                aspect: 'aggression',
                cardRefs: [
                    {id: 'aggression-the-power-of-aggression', count: 2},
                    {id: 'aggression-patada-doble-voladora', count: 3},
                    {id: 'aggression-cara-a-cara', count: 3},
                    {id: 'aggression-pagaras-por-eso', count: 3},
                    {id: 'aggression-vigor', count: 1},
                    {id: 'aggression-el-vigia', count: 1},
                    {id: 'aggression-hulka', count: 1},
                    {id: 'aggression-destreza-marcial', count: 3},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: innerDemons,
        },
        nemesis: [
            {
                count: 1,
                card: abomination,
            },
            {
                count: 1,
                card: totalDestruction,
            },
            {
                count: 3,
                card: duelOfTitans,
            },
        ],
    },
};
