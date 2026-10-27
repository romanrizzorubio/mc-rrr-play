import {
    ABILITY_ALTEREGO_RESPONSE,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESPONSE,
    ABILITY_OPTION,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CALC_COUNT,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_LEADERSHIP,
    EFFECT_ADD_KEYWORD,
    EFFECT_ADD_TRAIT,
    EFFECT_BLANK_TEXT,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CANNOT,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_GET_ENCOUNTER_CARD,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MAY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_COUNTER,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_REMOVE_THREAT,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_STUN,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_MINIONS,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_HERO_SIDE,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_YOU,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_ANTS,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_CIVILIAN,
    TRAIT_CONDITION,
    TRAIT_GIANT,
    TRAIT_ITEM,
    TRAIT_SUPERPOWER,
    TRAIT_TECH,
    TRAIT_THWART,
    TRAIT_TINY,
    TRIGGER_ATTACHED_ACTIVATES,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_INSTANT,
    TRIGGER_PLAYER_CAN_FLIP,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_THIS_FLIP,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_THIS_SPEND,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';

const set = 'Hombre Hormiga';

const wasp = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Avispa',
        subtitle: 'Nadia Van Dyne',
        set,
        image: 'heroes/ant-man/12002.png',
        traits: [TRAIT_AERIAL, TRAIT_AVENGER],
        unique: true,
        cost: 3,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        attack: 2,
        attackConsequential: 1,
        thwart: 2,
        thwartConsequential: 1,
        hitPoints: 3,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    condition: {
                        'player.superhero.currentSide.traits': [
                            TRAIT_GIANT,
                            TRAIT_TINY,
                        ],
                    },
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'player.superhero.currentSide.traits': TRAIT_GIANT,
                            },
                            effect: {
                                type: EFFECT_DEAL_DAMAGE,
                                params: {
                                    target: TARGET_ENEMY,
                                    damage: 2,
                                },
                            },
                            effectNot: {
                                type: EFFECT_REMOVE_THREAT,
                                params: {
                                    target: TARGET_SCHEME,
                                    threat: 2,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const giantStomp = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Pisotón de gigante',
        set,
        image: 'heroes/ant-man/12003.png',
        traits: [TRAIT_ATTACK, TRAIT_GIANT],
        cost: 3,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        paramsToPlay: {
            isHero: true,
            'superhero.currentSide.traits': TRAIT_GIANT,
        },
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ALL_MINIONS,
                                        damage: 1,
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ENEMY,
                                        damage: 8,
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

const hiveMind = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Mente colmena',
        set,
        image: 'heroes/ant-man/12004.png',
        traits: [TRAIT_THWART, TRAIT_TINY],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        paramsToPlay: {
            isHero: true,
            'superhero.currentSide.traits': TRAIT_TINY,
        },
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_THWART],
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            target: TARGET_SCHEME,
                            paramsCalc: {
                                target: 'player.gameZone.inPlayCards',
                                formula: CALC_COUNT,
                                conditions: {
                                    name: 'Ejército de hormigas',
                                    isSupport: true,
                                },
                                plus: 2,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const sizeChange = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Cambio de tamaño',
        set,
        image: 'heroes/ant-man/12005.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 0,
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
                                    type: EFFECT_FLIP,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        formTarget: TARGET_HERO_SIDE,
                                    },
                                },
                                {
                                    type: EFFECT_DRAW_CARD,
                                    params: {
                                        target: TARGET_YOU,
                                        count: 1,
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

const pymParticles = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Partículas Pym',
        set,
        image: 'heroes/ant-man/12006.png',
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_SPEND,
                    workInHand: true,
                    condition: {
                        'player.superhero.currentSide.traits': [
                            TRAIT_GIANT,
                            TRAIT_TINY,
                        ],
                    },
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'player.superhero.currentSide.traits': TRAIT_GIANT,
                            },
                            effect: {
                                type: EFFECT_HEAL,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    damage: 2,
                                },
                            },
                            effectNot: {
                                type: EFFECT_DRAW_CARD,
                                params: {
                                    target: TARGET_YOU,
                                    count: 1,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const armyOfAnts = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Ejército de hormigas',
        set,
        image: 'heroes/ant-man/12007.png',
        traits: [TRAIT_ANTS, TRAIT_TINY],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 1,
                        },
                    },
                },
            },
        ],
    },
};

const antManHelmet = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Casco del Hombre Hormiga',
        set,
        image: 'heroes/ant-man/12008.png',
        traits: [TRAIT_ARMOR, TRAIT_TECH],
        unique: true,
        cost: 3,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_YOUR_SUPERHERO_FLIPS,
                    condition: {
                        'triggeredCard.currentSide.traits': TRAIT_GIANT,
                    },
                    effect: {
                        type: EFFECT_HEAL,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            damage: 2,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_YOUR_SUPERHERO_FLIPS,
                    condition: {
                        'triggeredCard.currentSide.traits': TRAIT_TINY,
                    },
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
};

const giantStrength = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Fuerza de gigante',
        set,
        image: 'heroes/ant-man/12009.png',
        traits: [TRAIT_CONDITION, TRAIT_GIANT],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_YOUR_SUPERHERO_FLIPS,
                    condition: {
                        'triggeredCard.currentSide.traits': TRAIT_GIANT,
                    },
                    effect: {
                        type: EFFECT_LASTING,
                        params: {
                            target: TARGET_YOUR_HERO,
                            until: TRIGGER_PLAYER_TURN_END,
                            effect: {
                                type: EFFECT_MODIFY_ATTACK_VALUE,
                                params: {
                                    target: TARGET_YOUR_HERO,
                                    count: 1,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const shockGloves = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Guantes de descargas',
        set,
        image: 'heroes/ant-man/12010.png',
        traits: [TRAIT_ITEM, TRAIT_TECH],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_GIANT,
                    },
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        resources: [
                                            RESOURCE_PHYSICAL,
                                            RESOURCE_PHYSICAL,
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_STUN,
                        params: {
                            target: TARGET_ENEMY,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        resources: [
                                            RESOURCE_ENERGY,
                                            RESOURCE_ENERGY,
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_CONFUSE,
                        params: {
                            target: TARGET_ENEMY,
                        },
                    },
                },
            },
        ],
    },
};

const technologyRobbery = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Robo de tecnología',
        set,
        image: 'heroes/ant-man/12026.png',
        startingThreat: [2, true],
        boost: 3,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_SOURCE,
                            source: 'ability.card.match.inPlayCards',
                            condition: {
                                isPlayerCard: true,
                            },
                            effect: {
                                type: EFFECT_BLANK_TEXT,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'ability.card.match.inPlayCards',
                                    modifierCondition: {
                                        'card.traits': TRAIT_TECH,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    triggerParams: {
                        cardCondition: {
                            isPlayerCard: true,
                        },
                    },
                    effect: {
                        type: EFFECT_BLANK_TEXT,
                        params: {
                            target: TARGET_TRIGGERED_CARD,
                            modifierCondition: {
                                'card.traits': TRAIT_TECH,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const yellowJacket = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Chaqueta Amarilla',
        set,
        image: 'heroes/ant-man/12027.png',
        unique: true,
        nemesis: true,
        attack: 2,
        scheme: 2,
        hitPoints: 4,
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ADD_TRAIT,
                                    params: {
                                        target: TARGET_THIS,
                                        trait: TRAIT_GIANT,
                                        modifierCondition: {
                                            'card.engaged.superhero.currentSide.traits': TRAIT_GIANT,
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_ADD_KEYWORD,
                                    params: {
                                        target: TARGET_THIS,
                                        keyword: {retaliate: 1},
                                        modifierCondition: {
                                            'card.engaged.superhero.currentSide.traits': TRAIT_GIANT,
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_ADD_TRAIT,
                                    params: {
                                        target: TARGET_THIS,
                                        trait: TRAIT_TINY,
                                        modifierCondition: {
                                            'card.engaged.superhero.currentSide.traits': TRAIT_TINY,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_GET_ATTACK,
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

const sizeIncrease = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Aumento de tamaño',
        set,
        image: 'heroes/ant-man/12028.png',
        attack: 2,
        scheme: 2,
        boost: 1,
        keywords: {uses: 3},
        attach: {
            target: TARGET_ENEMY,
            condition: {name: 'Chaqueta Amarilla'},
            fallbackTarget: TARGET_VILLAIN,
        },
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_ATTACHED_ACTIVATES,
                    effect: {
                        type: EFFECT_REMOVE_COUNTER,
                        params: {
                            target: TARGET_THIS,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

const yellowJacketPlan = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'El plan de Chaqueta Amarilla',
        set,
        image: 'heroes/ant-man/12029.png',
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
                                    type: EFFECT_DISCARD_UNTIL,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        condition: {set},
                                        showDiscardedCards: true,
                                    },
                                },
                                {
                                    type: EFFECT_CHAINED,
                                    params: {
                                        effects: [
                                            {
                                                type: EFFECT_GET_ENCOUNTER_CARD,
                                                params: {
                                                    from: PLACE_ENCOUNTER_DISCARD,
                                                    cardSource: 'selectedCard',
                                                },
                                            },
                                            {
                                                type: EFFECT_REVEAL_ENCOUNTER,
                                                params: {
                                                    card: 'effects.0.card',
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
        ],
    },
};

export default {
    _id: 'ant-man',
    order: 14,
    name: 'Hombre Hormiga',
    folder: 'ant-man',
    config: {
        sides: [
            {
                type: CARD_TYPE_ALTEREGO,
                id: 'ant-man-scott-lang',
                params: {
                    name: 'Scott Lang',
                    set,
                    image: 'heroes/ant-man/12001b.png',
                    traits: [TRAIT_CIVILIAN],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    recovery: 3,
                    handSize: 6,
                    hitPoints: 12,
                    abilities: [
                        {
                            type: ABILITY_ALTEREGO_RESPONSE,
                            params: {
                                name: 'Tiempo para relajarse',
                                trigger: TRIGGER_THIS_FLIP,
                                effect: {
                                    type: EFFECT_HEAL,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        damage: 1,
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            {
                type: CARD_TYPE_HERO,
                id: 'ant-man-tiny',
                params: {
                    name: 'Hombre Hormiga',
                    set,
                    image: 'heroes/ant-man/12001a.png',
                    traits: [TRAIT_AVENGER, TRAIT_TINY],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    thwart: 2,
                    attack: 1,
                    defense: 2,
                    handSize: 5,
                    hitPoints: 12,
                    abilities: [
                        {
                            type: ABILITY_HERO_RESPONSE,
                            params: {
                                name: 'Insecto irritante',
                                trigger: TRIGGER_THIS_FLIP,
                                effect: {
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        target: TARGET_SCHEME,
                                        threat: 1,
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            {
                type: CARD_TYPE_HERO,
                id: 'ant-man-giant',
                params: {
                    name: 'Hombre Hormiga',
                    set,
                    image: 'heroes/ant-man/12001c.png',
                    traits: [TRAIT_AVENGER, TRAIT_GIANT],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    thwart: 1,
                    attack: 3,
                    defense: 3,
                    handSize: 4,
                    hitPoints: 12,
                    abilities: [
                        {
                            type: ABILITY_HERO_RESPONSE,
                            params: {
                                name: 'Molestia mayúscula',
                                trigger: TRIGGER_THIS_FLIP,
                                effect: {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ENEMY,
                                        damage: 1,
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
                count: 1,
                card: wasp,
            },
            {
                count: 2,
                card: giantStomp,
            },
            {
                count: 1,
                card: hiveMind,
            },
            {
                count: 2,
                card: sizeChange,
            },
            {
                count: 2,
                card: pymParticles,
            },
            {
                count: 3,
                card: armyOfAnts,
            },
            {
                count: 1,
                card: antManHelmet,
            },
            {
                count: 2,
                card: giantStrength,
            },
            {
                count: 1,
                card: shockGloves,
            },
        ],
        precon: [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-first-aid', count: 2},
                    {id: 'basic-tacticas-de-enjambre', count: 1},
                    {id: 'basic-espiritu-de-equipo', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_LEADERSHIP,
                cardRefs: [
                    {id: 'leadership-hombre-hormiga', count: 1},
                    {id: 'leadership-hombre-gigante', count: 1},
                    {id: 'leadership-ronin', count: 1},
                    {id: 'leadership-aguijon', count: 1},
                    {id: 'leadership-pedir-ayuda', count: 3},
                    {id: 'leadership-aplomo', count: 3},
                    {id: 'leadership-guanteletes-de-energia', count: 3},
                    {id: 'leadership-traje-reforzado', count: 3},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: {
                type: CARD_TYPE_OBLIGATION,
                params: {
                    name: 'Cuidar de Cassie',
                    set,
                    image: 'heroes/ant-man/12025.png',
                    boost: 2,
                    giveToOwner: true,
                    triggerInstant: true,
                    abilities: [
                        {
                            type: ABILITY_CONSTANT,
                            params: {
                                name: 'Adoptar la identidad de alter ego',
                                trigger: TRIGGER_INSTANT,
                                effect: {
                                    type: EFFECT_MAY,
                                    params: {
                                        effect: {
                                            type: EFFECT_FLIP,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                formTarget: TARGET_ALTEREGO_SIDE,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        {
                            type: ABILITY_CONSTANT,
                            params: {
                                name: 'Resolver la obligación',
                                trigger: TRIGGER_INSTANT,
                                effect: {
                                    type: EFFECT_CHOOSE_ABILITY,
                                    params: {
                                        options: [
                                            {
                                                type: ABILITY_OPTION,
                                                params: {
                                                    name: 'Agota a Scott Lang y retira del juego Cuidar de Cassie',
                                                    arrow: {
                                                        type: EFFECT_EXHAUST,
                                                        params: {
                                                            target: TARGET_ALTEREGO,
                                                        },
                                                    },
                                                    effect: {
                                                        type: EFFECT_REMOVE_CARD,
                                                        params: {
                                                            target: TARGET_CARD,
                                                        },
                                                    },
                                                },
                                            },
                                            {
                                                type: ABILITY_OPTION,
                                                params: {
                                                    name: 'Descarta 1 carta de tu mano. No puedes cambiar de identidad hasta que termine tu próximo turno. Descarta Cuidar de Cassie.',
                                                    effect: {
                                                        type: EFFECT_CHAINED,
                                                        params: {
                                                            effects: [
                                                                {
                                                                    type: EFFECT_SELECT_DISCARD_CARD,
                                                                    params: {
                                                                        target: TARGET_YOU,
                                                                        count: 1,
                                                                        title: 'Elige 1 carta de tu mano para descartar',
                                                                    },
                                                                },
                                                                {
                                                                    type: EFFECT_LASTING,
                                                                    params: {
                                                                        target: TARGET_YOU,
                                                                        until: TRIGGER_PLAYER_TURN_END,
                                                                        triggerType: TRIGGER_PLAYER_CAN_FLIP,
                                                                        triggerTarget: TARGET_YOUR_SUPERHERO,
                                                                        hideDialog: true,
                                                                        effect: {
                                                                            type: EFFECT_CANNOT,
                                                                            params: {
                                                                                target: TARGET_YOU,
                                                                                restriction: 'flip',
                                                                                sourceIn: 'player.superhero.obligations',
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                {
                                                                    type: EFFECT_DISCARD_GAME,
                                                                    params: {
                                                                        target: TARGET_CARD,
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
                        },
                    ],
                },
            },
        },
        nemesis: [
            {
                count: 1,
                card: technologyRobbery,
            },
            {
                count: 1,
                card: yellowJacket,
            },
            {
                count: 2,
                card: sizeIncrease,
            },
            {
                count: 1,
                card: yellowJacketPlan,
            },
        ],
    },
};
