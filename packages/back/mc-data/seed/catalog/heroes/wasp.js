import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_OPTION,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    DECK_POSITION_SHUFFLE,
    EFFECT_ADD_ADDITIONAL_COST,
    EFFECT_ADD_KEYWORD,
    EFFECT_ADD_TRAIT,
    EFFECT_ASSIGN_THREAT,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_EFFECT_VALUE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MODIFY_TRAITS,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_MOVE_TO_DECK,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SPEND,
    EFFECT_SIMULTANEOUS,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DISCARD_PILE,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_SCHEMES,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_CHARACTER,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_HERO_SIDE,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TARGET_VILLAIN,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_ARMOR,
    TRAIT_CRIMINAL,
    TRAIT_GENIUS,
    TRAIT_GIANT,
    TRAIT_ITEM,
    TRAIT_SKILL,
    TRAIT_SUPERPOWER,
    TRAIT_TECH,
    TRAIT_TINY,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_ABILITY_COST,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_YOU_ATTACK,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_DEFEAT_MINION,
    TRIGGER_YOU_DEFEAT_SIDE_SCHEME,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_THWART,
    TRIGGER_INSTANT,
} from 'mc-shared';
import {pymParticles} from '../shared/resources.js';

const set = 'Avispa';

const antMan = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Hombre Hormiga',
        subtitle: 'Scott Lang',
        set,
        image: 'heroes/wasp/13002.png',
        traits: [TRAIT_AVENGER],
        unique: true,
        cost: 4,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        attack: 2,
        attackConsequential: 1,
        thwart: 2,
        thwartConsequential: 1,
        hitPoints: 3,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
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
                                            'card.owner.superhero.currentSide.traits': TRAIT_GIANT,
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_ADD_TRAIT,
                                    params: {
                                        target: TARGET_THIS,
                                        trait: TRAIT_TINY,
                                        modifierCondition: {
                                            'card.owner.superhero.currentSide.traits': TRAIT_TINY,
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
                        'player.superhero.currentSide.traits': TRAIT_GIANT,
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
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_GET_THWART,
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                    effect: {
                        type: EFFECT_MODIFY_THWART_VALUE,
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

const helpingHand = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'De gran ayuda',
        set,
        image: 'heroes/wasp/13003.png',
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_THWART],
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'player.superhero.currentSide.traits': TRAIT_GIANT,
                            },
                            effect: {
                                type: EFFECT_ASSIGN_THREAT,
                                params: {
                                    target: TARGET_ALL_SCHEMES,
                                    threat: 4,
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

const sureStrike = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Golpe certero',
        set,
        image: 'heroes/wasp/13004.png',
        cost: 3,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 8,
                            keywords: {overkill: true},
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    condition: {
                        not: {
                            'player.superhero.currentSide.traits': TRAIT_TINY,
                        },
                    },
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 7,
                        },
                    },
                },
            },
        ],
    },
};

const quickGrowth = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Crecimiento rápido',
        set,
        image: 'heroes/wasp/13005.png',
        traits: [TRAIT_GIANT, TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_YOU_BASIC_THWART,
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'player.superhero.currentSide.traits': TRAIT_TINY,
                                        },
                                        effect: {
                                            type: EFFECT_FLIP,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                formTarget: TARGET_HERO_SIDE,
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_MODIFY_THWART_VALUE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: 2,
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_YOU_BASIC_ATTACK,
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'player.superhero.currentSide.traits': TRAIT_TINY,
                                        },
                                        effect: {
                                            type: EFFECT_FLIP,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                formTarget: TARGET_HERO_SIDE,
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: 2,
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_YOU_BASIC_DEFENSE,
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'player.superhero.currentSide.traits': TRAIT_TINY,
                                        },
                                        effect: {
                                            type: EFFECT_FLIP,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                formTarget: TARGET_HERO_SIDE,
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_MODIFY_DEFENSE_VALUE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: 2,
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

const waspSting = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Aguijón de avispa',
        set,
        image: 'heroes/wasp/13006.png',
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_GIANT,
                    },
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ALL_ENEMIES,
                            damage: 4,
                            distribute: true,
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
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 5,
                        },
                    },
                },
            },
        ],
    },
};

const waspPymParticles = {
    ...pymParticles,
    params: {
        ...pymParticles.params,
        set,
        image: 'heroes/wasp/13007.png',
    },
};

const redRoomTraining = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Entrenamiento en la Sala Roja',
        set,
        image: 'heroes/wasp/13008.png',
        traits: [TRAIT_SKILL],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    effect: {
                        type: EFFECT_ADD_KEYWORD,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            keyword: {retaliate: 1},
                            modifierCondition: {
                                'card.traits': TRAIT_GIANT,
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOU_ATTACK,
                    condition: {
                        'effect.ability.isBasic': true,
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                    effect: {
                        type: EFFECT_MODIFY_ATTACK,
                        params: {
                            target: TARGET_EFFECT,
                            modify: {
                                keywords: {piercing: true},
                            },
                        },
                    },
                },
            },
        ],
    },
};

const biosyntheticWings = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Alas biosintéticas',
        set,
        image: 'heroes/wasp/13009.png',
        traits: [TRAIT_ITEM, TRAIT_TECH],
        unique: true,
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    hideDialog: true,
                    trigger: TRIGGER_CONDITION_GET_TRAITS,
                    triggerParams: {
                        conditionTrigger: {name: 'Avispa'},
                        conditionSource: 'effect.selectedTarget',
                    },
                    effect: {
                        type: EFFECT_MODIFY_TRAITS,
                        params: {
                            target: TARGET_EFFECT,
                            traits: [TRAIT_AERIAL],
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {target: TARGET_YOUR_SUPERHERO},
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_TINY,
                    },
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {target: TARGET_THIS},
                    },
                    effect: {
                        type: EFFECT_PREVENT_DAMAGE,
                        params: {
                            target: TARGET_EFFECT,
                            damage: 1,
                        },
                    },
                },
            },
        ],
    },
};

const waspHelmet = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Casco de la Avispa',
        set,
        image: 'heroes/wasp/13010.png',
        traits: [TRAIT_ARMOR, TRAIT_TECH],
        unique: true,
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_THWART,
                    condition: {
                        'player.superhero.currentSide.traits': TRAIT_GIANT,
                    },
                    effect: {
                        type: EFFECT_MODIFY_THWART_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
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

const mothersOrders = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Órdenes de Madre',
        set,
        image: 'heroes/wasp/13027.png',
        startingThreat: [2, true],
        boost: 3,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_ABILITY_COST,
                    effect: {
                        type: EFFECT_ADD_ADDITIONAL_COST,
                        params: {
                            abilityCondition: {
                                isBasic: true,
                                isAttack: true,
                                'card.isHero': true,
                            },
                            cost: {
                                type: EFFECT_SPEND,
                                params: {
                                    resources: [RESOURCE_ANY],
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const beetle = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Escarabajo',
        set,
        image: 'heroes/wasp/13028.png',
        unique: true,
        nemesis: true,
        traits: [TRAIT_CRIMINAL],
        boost: 2,
        attack: 1,
        scheme: 1,
        hitPoints: 4,
        keywords: {guard: true},
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_THIS_DEFEAT,
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Gasta 1 recurso [p]',
                                        effect: {
                                            type: EFFECT_SPEND,
                                            params: {
                                                resources: [RESOURCE_PHYSICAL],
                                            },
                                        },
                                    },
                                },
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Añade Escarabajo al mazo de Encuentros y barájalo',
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
                    },
                },
            },
        ],
    },
};

const beetleArmor = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Armadura de Escarabajo MK IV',
        set,
        image: 'heroes/wasp/13029.png',
        unique: true,
        traits: [TRAIT_ARMOR, TRAIT_TECH],
        boost: 2,
        attach: {
            target: TARGET_CHARACTER,
            condition: {name: 'Escarabajo'},
            fallbackTarget: TARGET_VILLAIN,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                    effect: {
                        type: EFFECT_MODIFY_HIT_POINTS,
                        params: {
                            target: TARGET_ATTACHED,
                            count: 4,
                        },
                    },
                },
            },
        ],
    },
};

const beetleObsession = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'La obsesión de la Escarabajo',
        set,
        image: 'heroes/wasp/13030.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {
                        type: EFFECT_SURGE,
                        params: {},
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED_HERO,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ENEMY_ATTACK,
                                    params: {
                                        enemyType: TARGET_ENEMY,
                                        condition: {name: 'Escarabajo'},
                                        target: TARGET_YOU,
                                        attackModifier: 1,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {'effects.0.resolved': false},
                                        effect: {
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
    },
};

export default {
    _id: 'wasp',
    name: 'Avispa',
    folder: 'wasp',
    config: {
        sides: [
            {
                type: CARD_TYPE_ALTEREGO,
                id: 'wasp-nadia-van-dyne',
                params: {
                    name: 'Nadia Van Dyne',
                    set,
                    image: 'heroes/wasp/13001a.png',
                    traits: [TRAIT_GENIUS],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    recovery: 3,
                    handSize: 6,
                    hitPoints: 11,
                    abilities: [
                        {
                            type: ABILITY_ALTEREGO_ACTION,
                            params: {
                                name: 'C.H.I.C.A',
                                limit: {
                                    count: 1,
                                    target: TARGET_ROUND,
                                },
                                effect: {
                                    type: EFFECT_CHAINED,
                                    params: {
                                        effects: [
                                            {
                                                type: EFFECT_SEARCH_CARDS,
                                                params: {
                                                    locations: [PLACE_DISCARD_PILE],
                                                    filter: {
                                                        resources: RESOURCE_MENTAL,
                                                    },
                                                    count: 2,
                                                    upTo: true,
                                                    title: 'Elige hasta 2 cartas con un recurso [m] impreso de tu pila de descartes',
                                                },
                                            },
                                            {
                                                type: EFFECT_MOVE_TO_DECK,
                                                params: {
                                                    target: TARGET_YOU,
                                                    cards: 'selectedCards',
                                                    position: DECK_POSITION_SHUFFLE,
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
                id: 'wasp-tiny',
                params: {
                    name: 'Avispa',
                    set,
                    image: 'heroes/wasp/13001b.png',
                    traits: [TRAIT_AVENGER, TRAIT_TINY],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    thwart: 1,
                    attack: 1,
                    defense: 2,
                    handSize: 5,
                    hitPoints: 11,
                    abilities: [
                        {
                            type: ABILITY_HERO_RESPONSE,
                            params: {
                                name: 'Pequeña pero poderosa',
                                trigger: [
                                    TRIGGER_YOU_DEFEAT_MINION,
                                    TRIGGER_YOU_DEFEAT_SIDE_SCHEME,
                                ],
                                effect: {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_VILLAIN,
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
                id: 'wasp-giant',
                params: {
                    name: 'Avispa',
                    set,
                    image: 'heroes/wasp/13001c.png',
                    traits: [TRAIT_AVENGER, TRAIT_GIANT],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    thwart: 2,
                    attack: 2,
                    defense: 3,
                    handSize: 5,
                    hitPoints: 11,
                    abilities: [
                        {
                            type: ABILITY_CONSTANT,
                            params: {
                                trigger: [
                                    TRIGGER_YOUR_HERO_GET_ATTACK,
                                    TRIGGER_YOUR_HERO_GET_THWART,
                                ],
                                condition: {
                                    'player.superhero.currentSide.traits': TRAIT_GIANT,
                                },
                                effect: {
                                    type: EFFECT_SIMULTANEOUS,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        effects: [
                                            {
                                                type: EFFECT_MODIFY_EFFECT_VALUE,
                                                params: {
                                                    target: TARGET_YOUR_SUPERHERO,
                                                    abilityCondition: {isBasic: true},
                                                    effectTypes: [EFFECT_DEAL_DAMAGE],
                                                    value: {
                                                        target: TARGET_ALL_ENEMIES,
                                                        distribute: true,
                                                    },
                                                },
                                            },
                                            {
                                                type: EFFECT_MODIFY_EFFECT_VALUE,
                                                params: {
                                                    target: TARGET_YOUR_SUPERHERO,
                                                    abilityCondition: {isBasic: true},
                                                    effectTypes: [EFFECT_REMOVE_THREAT],
                                                    value: {
                                                        target: TARGET_ALL_SCHEMES,
                                                        distribute: true,
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
        ],
        cards: [
            {
                count: 1,
                card: antMan,
            },
            {
                count: 2,
                card: helpingHand,
            },
            {
                count: 3,
                card: sureStrike,
            },
            {
                count: 2,
                card: quickGrowth,
            },
            {
                count: 2,
                card: waspSting,
            },
            {
                count: 2,
                card: waspPymParticles,
            },
            {
                count: 1,
                card: redRoomTraining,
            },
            {
                count: 1,
                card: biosyntheticWings,
            },
            {
                count: 1,
                card: waspHelmet,
            },
        ],
        precon: [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-quintransporte', count: 1},
                    {id: 'basic-ironheart', count: 1},
                    {id: 'basic-spiderman-miles-morales', count: 1},
                    {id: 'basic-tacticas-de-enjambre', count: 1},
                    {id: 'basic-el-poder-de-todos-unidos', count: 2},
                ],
            },
            {
                aspect: CLASSIFICATION_AGGRESSION,
                cardRefs: [
                    {id: 'aggression-the-power-of-aggression', count: 2},
                    {id: 'aggression-thor', count: 1},
                    {id: 'aggression-wasp', count: 1},
                    {id: 'aggression-entrar-en-combate', count: 3},
                    {id: 'aggression-ataque-sorpresa', count: 3},
                    {id: 'aggression-centro-de-entrenamiento', count: 3},
                    {id: 'aggression-al-acecho', count: 3},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: {
                type: CARD_TYPE_OBLIGATION,
                params: {
                    name: 'Sueños rojos',
                    set,
                    image: 'heroes/wasp/13026.png',
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
                                                    name: 'Agota a Nadia Van Dyne y retira del juego Sueños rojos',
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
                                                    name: 'Descarta de tu mano todas las cartas que tengan impreso un recurso [m] y sufre 1 de Daño. Descarta esta Obligación.',
                                                    effect: {
                                                        type: EFFECT_CHAINED,
                                                        params: {
                                                            effects: [
                                                                {
                                                                    type: EFFECT_SIMULTANEOUS,
                                                                    params: {
                                                                        effects: [
                                                                            {
                                                                                type: EFFECT_DISCARD_CONDITION_HAND,
                                                                                params: {
                                                                                    target: TARGET_YOU,
                                                                                    condition: {
                                                                                        resources: RESOURCE_MENTAL,
                                                                                    },
                                                                                },
                                                                            },
                                                                            {
                                                                                type: EFFECT_TAKE_DAMAGE,
                                                                                params: {
                                                                                    target: TARGET_YOUR_SUPERHERO,
                                                                                    damage: 1,
                                                                                },
                                                                            },
                                                                        ],
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
                card: mothersOrders,
            },
            {
                count: 1,
                card: beetle,
            },
            {
                count: 1,
                card: beetleArmor,
            },
            {
                count: 2,
                card: beetleObsession,
            },
        ],
    },
};
