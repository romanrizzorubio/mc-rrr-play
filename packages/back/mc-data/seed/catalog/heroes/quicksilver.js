import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESPONSE,
    ABILITY_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESOURCE,
    ABILITY_WHEN_REVEALED,
    CALC_BOOST_ICONS,
    CALC_COUNT,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_PROTECTION,
    DECK_POSITION_SHUFFLE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CANNOT,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MOVE_TO_DECK,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_REPEAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SPEND,
    EFFECT_STUN,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    RESOURCES_X,
    TARGET_ALTEREGO_SIDE,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALL_PLAYERS,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_VILLAIN,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_ENCOUNTER_DECK,
    TARGET_PHASE,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TIME_ROUND,
    TRAIT_AVENGER,
    TRAIT_BROTHERHOOD_OF_MUTANTS,
    TRAIT_CIVILIAN,
    TRAIT_CONDITION,
    TRAIT_LOCATION,
    TRAIT_SUPERPOWER,
    TRAIT_X_FACTOR,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_CHARACTER_READIED,
    TRIGGER_INSTANT,
    TRIGGER_PLAYER_CAN_READY,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_THWARTS,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
    TRIGGER_YOUR_HERO_GET_THWART,
} from 'mc-shared';

const set = 'Mercurio';

const scarletWitch = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Bruja Escarlata',
        subtitle: 'Wanda Maximoff',
        set,
        image: 'heroes/quicksilver/14002.png',
        traits: [TRAIT_AVENGER],
        unique: true,
        cost: 3,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        hitPoints: 3,
        attack: 1,
        attackConsequential: 1,
        thwart: 1,
        thwartConsequential: 1,
        abilities: [
            {
                type: ABILITY_INTERRUPT,
                params: {
                    trigger: TRIGGER_THIS_ATTACK,
                    condition: {'effect.ability.isBasic': true},
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        count: 1,
                                    },
                                },
                                {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: 0,
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
            {
                type: ABILITY_INTERRUPT,
                params: {
                    trigger: TRIGGER_THIS_THWARTS,
                    condition: {'effect.ability.isBasic': true},
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        count: 1,
                                    },
                                },
                                {
                                    type: EFFECT_MODIFY_THWART_VALUE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: 0,
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
    },
};

const alwaysRunning = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Siempre corriendo',
        set,
        image: 'heroes/quicksilver/14003.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_READY,
                        params: {
                            target: TARGET_ALL_FRIENDLY_CHARACTERS,
                            condition: {name: 'Mercurio'},
                        },
                    },
                },
            },
        ],
    },
};

const doubleTime = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Por partida doble',
        set,
        image: 'heroes/quicksilver/14004.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_REPEAT,
                        params: {
                            count: 2,
                            effect: {
                                type: EFFECT_CHOOSE_ABILITY,
                                params: {
                                    options: [
                                        {
                                            type: ABILITY_OPTION,
                                            params: {
                                                name: 'Inflige 2 de Daño a un enemigo',
                                                effect: {
                                                    type: EFFECT_DEAL_DAMAGE,
                                                    params: {
                                                        target: TARGET_ENEMY,
                                                        damage: 2,
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            type: ABILITY_OPTION,
                                            params: {
                                                name: 'Quita 2 de amenaza de un Plan',
                                                effect: {
                                                    type: EFFECT_REMOVE_THREAT,
                                                    params: {
                                                        target: TARGET_SCHEME,
                                                        threat: 2,
                                                    },
                                                },
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

const maxSpeed = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Máxima velocidad',
        set,
        image: 'heroes/quicksilver/14005.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    name: 'Máxima velocidad',
                    maximum: {
                        count: 1,
                        target: TARGET_PHASE,
                    },
                    effect: {
                        type: EFFECT_LASTING,
                        params: {
                            target: TARGET_YOUR_HERO,
                            until: TIME_ROUND,
                            effect: {
                                type: EFFECT_SIMULTANEOUS,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_MODIFY_THWART_VALUE,
                                            params: {
                                                target: TARGET_YOUR_HERO,
                                                count: 2,
                                            },
                                        },
                                        {
                                            type: EFFECT_MODIFY_ATTACK_VALUE,
                                            params: {
                                                target: TARGET_YOUR_HERO,
                                                count: 2,
                                            },
                                        },
                                        {
                                            type: EFFECT_MODIFY_DEFENSE_VALUE,
                                            params: {
                                                target: TARGET_YOUR_HERO,
                                                count: 2,
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

const hurricaneSpeed = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Velocidad de huracán',
        set,
        image: 'heroes/quicksilver/14006.png',
        traits: [TRAIT_SUPERPOWER],
        cost: RESOURCES_X,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_STUN,
                        params: {
                            target: TARGET_ENEMY,
                            multipleTarget: true,
                            targetCountCalc: {
                                target: 'playCardEffect.resourcesPaid',
                                formula: CALC_COUNT,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const servalIndustries = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Industrias Serval',
        set,
        image: 'heroes/quicksilver/14007.png',
        traits: [TRAIT_LOCATION, TRAIT_X_FACTOR],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {target: TARGET_THIS},
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_DISCARD_PILE],
                                        filter: {set},
                                        count: 2,
                                        upTo: true,
                                        title: 'Elige hasta 2 cartas de Mercurio de tu pila de descartes',
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
};

const frictionResistance = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Resistencia a la fricción',
        set,
        image: 'heroes/quicksilver/14009.png',
        traits: [TRAIT_CONDITION, TRAIT_SUPERPOWER],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_CHARACTER_READIED,
                    condition: {
                        'effect.readiedTargets.*.name': 'Mercurio',
                    },
                    effect: {
                        type: EFFECT_READY,
                        params: {target: TARGET_THIS},
                    },
                },
            },
            {
                type: ABILITY_RESOURCE,
                params: {
                    resource: RESOURCE_PHYSICAL,
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {target: TARGET_THIS},
                    },
                },
            },
        ],
    },
};

const statUpgrade = ({
    name,
    image,
    cost,
    resource,
    trigger,
    effectType,
}) => ({
    type: CARD_TYPE_UPGRADE,
    params: {
        name,
        set,
        image,
        traits: [TRAIT_CONDITION, TRAIT_SUPERPOWER],
        cost,
        resources: [resource],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    hideDialog: true,
                    trigger,
                    condition: {
                        'effect.selectedTarget.name': 'Mercurio',
                    },
                    effect: {
                        type: effectType,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
});

const discardTwoCardsFromHand = {
    type: EFFECT_DO_IF,
    params: {
        condition: {
            'player.hand.cards.length': '>1',
        },
        effect: {
            type: EFFECT_SELECT_DISCARD_CARD,
            params: {
                target: TARGET_YOU,
                count: 2,
                title: 'Descarta 2 cartas de tu mano',
            },
        },
        effectNot: {
            type: EFFECT_SELECT_DISCARD_CARD,
            params: {
                target: TARGET_YOU,
                count: 1,
                title: 'Descarta 1 carta de tu mano',
            },
        },
    },
};

const avalanche = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Avalancha',
        set,
        image: 'heroes/quicksilver/14026.png',
        unique: true,
        nemesis: true,
        traits: [TRAIT_BROTHERHOOD_OF_MUTANTS],
        attack: 2,
        scheme: 1,
        hitPoints: 4,
        keywords: {incite: 2},
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_CHOOSE_ABILITY,
                                params: {
                                    options: [
                                        {
                                            type: ABILITY_OPTION,
                                            params: {
                                                name: 'Sufre 2 de Daño indirecto',
                                                effect: {
                                                    type: EFFECT_ASSIGN_DAMAGE,
                                                    params: {
                                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                        damage: 2,
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            type: ABILITY_OPTION,
                                            params: {
                                                name: 'Agota tu carta de Superhéroe',
                                                effect: {
                                                    type: EFFECT_EXHAUST,
                                                    params: {
                                                        target: TARGET_YOUR_SUPERHERO,
                                                    },
                                                },
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

const vibrationResistance = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Resistencia a las vibraciones',
        set,
        image: 'heroes/quicksilver/14027.png',
        traits: [TRAIT_CONDITION],
        boost: 1,
        attach: {
            target: TARGET_ENEMY,
            condition: {name: 'Avalancha'},
            fallbackTarget: TARGET_VILLAIN,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_ATTACHED,
                    },
                    condition: {
                        'effect.isAttack': true,
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
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_YOUR_HERO,
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
};

const earthquake = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Terremoto',
        set,
        image: 'heroes/quicksilver/14028.png',
        keywords: {incite: 1},
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                discardTwoCardsFromHand,
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_CHOOSE_ABILITY,
                    params: {
                        options: [
                            {
                                type: ABILITY_OPTION,
                                params: {
                                    name: 'Gasta 2 recursos físicos',
                                    arrow: {
                                        type: EFFECT_SPEND,
                                        params: {
                                            target: TARGET_YOU,
                                            resources: [
                                                RESOURCE_PHYSICAL,
                                                RESOURCE_PHYSICAL,
                                            ],
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_OPTION,
                                params: {
                                    name: 'Agota tu carta de Superhéroe',
                                    effect: {
                                        type: EFFECT_EXHAUST,
                                        params: {
                                            target: TARGET_YOUR_SUPERHERO,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
};

const seismicExtortion = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Extorsión de proporciones sísmicas',
        set,
        image: 'heroes/quicksilver/14025.png',
        startingThreat: [2, true],
        icons: {crisis: true},
        keywords: {incite: 1},
        boost: 3,
    },
};

export default {
    _id: 'quicksilver',
    name: 'Mercurio',
    folder: 'quicksilver',
    config: {
        sides: [
            {
                type: CARD_TYPE_ALTEREGO,
                id: 'quicksilver-pietro-maximoff',
                params: {
                    name: 'Pietro Maximoff',
                    set,
                    image: 'heroes/quicksilver/14001a.png',
                    traits: [TRAIT_CIVILIAN],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    recovery: 3,
                    handSize: 6,
                    hitPoints: 9,
                    abilities: [
                        {
                            type: ABILITY_ALTEREGO_ACTION,
                            params: {
                                name: 'Hermanos con superpoderes',
                                limit: {
                                    count: 1,
                                    target: TARGET_ROUND,
                                },
                                arrow: {
                                    type: EFFECT_SELECT_DISCARD_CARD,
                                    params: {
                                        target: TARGET_YOU,
                                        count: 2,
                                        title: 'Descarta 2 cartas de tu mano',
                                    },
                                },
                                effect: {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: [
                                            {
                                                'match.inPlayCards.*.card.subtitle': 'Wanda Maximoff',
                                            },
                                            {
                                                'match.inPlayCards.*.name': 'Wanda Maximoff',
                                            },
                                        ],
                                        effect: {
                                            type: EFFECT_DRAW_CARD,
                                            params: {
                                                target: TARGET_YOU,
                                                count: 3,
                                            },
                                        },
                                        effectNot: {
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
            },
            {
                type: CARD_TYPE_HERO,
                id: 'quicksilver-mercurio',
                params: {
                    name: 'Mercurio',
                    set,
                    image: 'heroes/quicksilver/14001b.png',
                    traits: [TRAIT_AVENGER],
                    unique: true,
                    classification: CLASSIFICATION_HERO,
                    thwart: 1,
                    attack: 1,
                    defense: 1,
                    handSize: 5,
                    hitPoints: 9,
                    abilities: [
                        {
                            type: ABILITY_HERO_RESPONSE,
                            params: {
                                name: 'Supervelocidad',
                                trigger: [
                                    TRIGGER_YOU_BASIC_THWART,
                                    TRIGGER_YOU_BASIC_ATTACK,
                                    TRIGGER_YOU_BASIC_DEFENSE,
                                ],
                                limit: {
                                    count: 1,
                                    target: TARGET_PHASE,
                                },
                                effect: {
                                    type: EFFECT_READY,
                                    params: {target: TARGET_YOUR_HERO},
                                },
                            },
                        },
                    ],
                },
            },
        ],
        cards: [
            {count: 1, card: scarletWitch},
            {count: 4, card: alwaysRunning},
            {count: 2, card: doubleTime},
            {count: 2, card: maxSpeed},
            {count: 1, card: hurricaneSpeed},
            {count: 1, card: servalIndustries},
            {
                count: 1,
                card: statUpgrade({
                    name: 'Reflejos acelerados',
                    image: 'heroes/quicksilver/14008.png',
                    cost: 2,
                    resource: RESOURCE_ENERGY,
                    trigger: TRIGGER_YOUR_HERO_GET_DEFENSE,
                    effectType: EFFECT_MODIFY_DEFENSE_VALUE,
                }),
            },
            {count: 1, card: frictionResistance},
            {
                count: 1,
                card: statUpgrade({
                    name: 'Percepción superior',
                    image: 'heroes/quicksilver/14010.png',
                    cost: 2,
                    resource: RESOURCE_MENTAL,
                    trigger: TRIGGER_YOUR_HERO_GET_THWART,
                    effectType: EFFECT_MODIFY_THWART_VALUE,
                }),
            },
            {
                count: 1,
                card: statUpgrade({
                    name: 'Tendones reforzados',
                    image: 'heroes/quicksilver/14011.png',
                    cost: 2,
                    resource: RESOURCE_PHYSICAL,
                    trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
                    effectType: EFFECT_MODIFY_ATTACK_VALUE,
                }),
            },
        ],
        precon: [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-orden-y-caos', count: 1},
                    {id: 'basic-descarga-adrenalina', count: 3},
                    {id: 'basic-deber-civico', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_PROTECTION,
                cardRefs: [
                    {id: 'protection-chaleco-blindado', count: 2},
                    {id: 'protection-hombre-multiple', count: 3},
                    {id: 'protection-warlock', count: 1},
                    {id: 'protection-ni-un-paso-atras', count: 3},
                    {id: 'protection-esquiva-lateral', count: 3},
                    {id: 'protection-nervios-de-acero', count: 3},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: {
                type: CARD_TYPE_OBLIGATION,
                params: {
                    name: 'Vivir con prisa',
                    set,
                    image: 'heroes/quicksilver/14024.png',
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
                                                    name: 'Agota a Pietro Maximoff y retira del juego Vivir con prisa',
                                                    condition: {
                                                        'player.superhero.currentSide.name': 'Pietro Maximoff',
                                                    },
                                                    arrow: {
                                                        type: EFFECT_EXHAUST,
                                                        params: {
                                                            target: TARGET_YOUR_SUPERHERO,
                                                            condition: {
                                                                'currentSide.name': 'Pietro Maximoff',
                                                            },
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
                                                    name: 'Agota tu carta de Superhéroe. No puedes prepararla hasta que termine tu próximo turno. Descarta Vivir con prisa.',
                                                    effect: {
                                                        type: EFFECT_CHAINED,
                                                        params: {
                                                            effects: [
                                                                {
                                                                    type: EFFECT_EXHAUST,
                                                                    params: {
                                                                        target: TARGET_YOUR_SUPERHERO,
                                                                    },
                                                                },
                                                                {
                                                                    type: EFFECT_LASTING,
                                                                    params: {
                                                                        target: TARGET_YOU,
                                                                        until: TRIGGER_PLAYER_TURN_END,
                                                                        triggerType: TRIGGER_PLAYER_CAN_READY,
                                                                        triggerTarget: TARGET_YOUR_SUPERHERO,
                                                                        hideDialog: true,
                                                                        effect: {
                                                                            type: EFFECT_CANNOT,
                                                                            params: {
                                                                                target: TARGET_YOU,
                                                                                restriction: 'ready',
                                                                                targetCondition: {
                                                                                    isSuperhero: true,
                                                                                },
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
            {count: 1, card: seismicExtortion},
            {count: 1, card: avalanche},
            {count: 1, card: vibrationResistance},
            {count: 2, card: earthquake},
        ],
    },
};
