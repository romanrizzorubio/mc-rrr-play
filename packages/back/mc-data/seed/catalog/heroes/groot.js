import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_OPTION,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CALC_COUNTERS,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_PROTECTION,
    EFFECT_ADD_ADDITIONAL_DAMAGE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DO_IF,
    EFFECT_DISCARD_GAME,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SIMULTANEOUS,
    EFFECT_SURGE,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ALL_PLAYERS,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ROUND,
    TARGET_ENEMY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_PARENT,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ATTACK,
    TRAIT_GUARDIAN,
    TRAIT_LEVIATHON,
    TRAIT_LOCATION,
    TRAIT_OUTLAW,
    TRAIT_SUPERPOWER,
    TRAIT_THWART,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_INSTANT,
    TRIGGER_THIS_ACTIVATES,
    TRIGGER_VILLAIN_PHASE_START,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
} from 'mc-shared';

const set = 'Groot';

const germination = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Germinación',
        set,
        image: 'heroes/groot/16002.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 0,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_ACTION,
                params: {
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            counters: 2,
                            maxCounters: 10,
                        },
                    },
                },
            },
        ],
    },
};

const iAmGroot = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Soy Groot',
        set,
        image: 'heroes/groot/16003.png',
        traits: [TRAIT_SUPERPOWER, TRAIT_THWART],
        cost: 3,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
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
                                target: 'player.superhero',
                                formula: CALC_COUNTERS,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const iAmGrootAttack = {
    type: CARD_TYPE_EVENT,
    params: {
        name: '¡SOY… GROOT!',
        set,
        image: 'heroes/groot/16004.png',
        traits: [TRAIT_ATTACK, TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
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
                                target: 'player.superhero',
                                formula: CALC_COUNTERS,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const crushingRoots = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Raíz aplastante',
        set,
        image: 'heroes/groot/16005.png',
        traits: [TRAIT_ATTACK, TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_ENEMY,
                            effects: [
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_PARENT,
                                        damage: 5,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        target: TARGET_PARENT,
                                        condition: {
                                            'effects.0.defeated': true,
                                        },
                                        effect: {
                                            type: EFFECT_PLACE_COUNTERS,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                counters: 1,
                                                maxCounters: 10,
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

const weAreGroot = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Somos Groot',
        set,
        image: 'heroes/groot/16006.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_REMOVE_COUNTER,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            count: 4,
                            upTo: true,
                            dialogTitle: 'Elige cuántos contadores de Crecimiento quieres quitar',
                        },
                    },
                    effect: {
                        type: EFFECT_TOUGH,
                        params: {
                            target: TARGET_FRIENDLY_CHARACTER,
                            multipleTarget: true,
                            targetCountCalc: {
                                target:
                                    'effect.ability.costs.paymentEffect.removedCounters',
                            },
                        },
                    },
                },
            },
        ],
    },
};

const fertileGround = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Terreno fértil',
        set,
        image: 'heroes/groot/16007.png',
        traits: [TRAIT_LOCATION],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_PLACE_COUNTERS,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        counters: 1,
                                        maxCounters: 10,
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

const vines = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Enredaderas',
        set,
        image: 'heroes/groot/16008.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_YOU_BASIC_THWART,
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        count: 1,
                                    },
                                },
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_MODIFY_THWART_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 2,
                        },
                    },
                },
            },
        ],
    },
};

const laceratingLianas = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Lianas lacerantes',
        set,
        image: 'heroes/groot/16009.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: [
                        TRIGGER_YOU_BASIC_ATTACK,
                        TRIGGER_YOU_BASIC_THWART,
                        TRIGGER_YOU_BASIC_DEFENSE,
                    ],
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        count: 2,
                                    },
                                },
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_READY,
                        params: {
                            target: TARGET_YOUR_HERO,
                        },
                    },
                },
            },
        ],
    },
};

const lianaShield = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Escudo de lianas',
        set,
        image: 'heroes/groot/16010.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_HERO_DEFENDS_ATTACK,
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        count: 1,
                                    },
                                },
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_MODIFY_DEFENSE_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 3,
                        },
                    },
                },
            },
        ],
    },
};

const pointedLianas = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Lianas puntiagudas',
        set,
        image: 'heroes/groot/16011.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_YOU_BASIC_ATTACK,
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        count: 1,
                                    },
                                },
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 2,
                        },
                    },
                },
            },
        ],
    },
};

const withering = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Marchitamiento',
        set,
        image: 'heroes/groot/16025.png',
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
                    name: 'Resolver Marchitamiento',
                    trigger: TRIGGER_INSTANT,
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Agota tu Alter ego para retirar Marchitamiento del juego',
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
                                        name: 'Quita 3 contadores de Crecimiento a Groot y descarta Marchitamiento',
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_REMOVE_COUNTER,
                                                        params: {
                                                            target: TARGET_YOUR_SUPERHERO,
                                                            count: 3,
                                                            allowZero: true,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_DO_IF,
                                                        params: {
                                                            condition: {
                                                                'effects.0.removedCounters': 0,
                                                            },
                                                            effect: {
                                                                type: EFFECT_SURGE,
                                                                params: {},
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
};

const burningInferno = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Infierno abrasador',
        set,
        image: 'heroes/groot/16026.png',
        boost: 2,
        startingThreat: 3,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_VILLAIN_PHASE_START,
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_ASSIGN_DAMAGE,
                                params: {
                                    target: TARGET_YOU,
                                    damage: 2,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const furnax = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Furnax',
        set,
        image: 'heroes/groot/16027.png',
        traits: [TRAIT_LEVIATHON],
        attack: 2,
        scheme: 2,
        hitPoints: 6,
        nemesis: true,
        boost: 3,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_ACTIVATES,
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_ASSIGN_DAMAGE,
                                params: {
                                    target: TARGET_YOU,
                                    damage: 2,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const kindleTheFlames = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Avivar las llamas',
        set,
        image: 'heroes/groot/16028.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            hasAdditional: true,
                            effects: [
                                {
                                    type: EFFECT_ASSIGN_DAMAGE,
                                    params: {
                                        target: TARGET_YOU,
                                        damage: 2,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'match.sideSchemes.*.name':
                                                'Infierno abrasador',
                                        },
                                        effect: {
                                            type: EFFECT_ADD_ADDITIONAL_DAMAGE,
                                            params: {
                                                target: TARGET_SOURCE,
                                                source: 'effects.0',
                                                count: 1,
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'match.minions.*.name': 'Furnax',
                                        },
                                        effect: {
                                            type: EFFECT_ADD_ADDITIONAL_DAMAGE,
                                            params: {
                                                target: TARGET_SOURCE,
                                                source: 'effects.0',
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

const grootAlterEgo = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: 'Groot',
        set,
        image: 'heroes/groot/16001b.png',
        traits: [TRAIT_OUTLAW],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 4,
        handSize: 6,
        hitPoints: 10,
        abilities: [
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    name: 'Crecimiento súbito',
                    limit: {
                        count: 1,
                        target: TARGET_ROUND,
                    },
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            counters: 2,
                            maxCounters: 10,
                        },
                    },
                },
            },
        ],
    },
};

const grootHero = {
    type: CARD_TYPE_HERO,
    params: {
        name: 'Groot',
        set,
        image: 'heroes/groot/16001a.png',
        traits: [TRAIT_GUARDIAN],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 1,
        attack: 2,
        defense: 3,
        handSize: 5,
        hitPoints: 10,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    name: 'Flora Colossus',
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_YOUR_SUPERHERO,
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            effects: [
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        paramsCalc: {
                                            target: 'triggeredTargetDamage',
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        condition: {
                                            'effects.0.removedCounters': '>0',
                                        },
                                        effect: {
                                            type: EFFECT_PREVENT_DAMAGE,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                paramsCalc: {
                                                    target: 'effects.0.removedCounters',
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

export default {
    _id: 'groot',
    order: 16,
    name: 'Groot',
    folder: 'groot',
    config: {
        sides: [grootAlterEgo, grootHero],
        cards: [
            {count: 2, card: germination},
            {count: 2, card: iAmGroot},
            {count: 2, card: iAmGrootAttack},
            {count: 3, card: crushingRoots},
            {count: 1, card: weAreGroot},
            {count: 1, card: fertileGround},
            {count: 1, card: vines},
            {count: 1, card: laceratingLianas},
            {count: 1, card: lianaShield},
            {count: 1, card: pointedLianas},
        ],
        precon: [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-mapache-cohete', count: 1},
                    {id: 'basic-flora-y-fauna', count: 1},
                    {id: 'basic-concentracion-eficaz', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_PROTECTION,
                cardRefs: [
                    {id: 'protection-defensa-desesperada', count: 3},
                    {id: 'protection-el-poder-de-la-proteccion', count: 2},
                    {id: 'protection-indomito', count: 2},
                    {id: 'protection-halcon-estelar', count: 1},
                    {id: 'protection-en-plena-forma', count: 3},
                    {id: 'protection-intrepido', count: 3},
                    {id: 'protection-dificil-de-ignorar', count: 3},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: withering,
        },
        nemesis: [
            {count: 1, card: burningInferno},
            {count: 1, card: furnax},
            {count: 3, card: kindleTheFlames},
        ],
    },
};
