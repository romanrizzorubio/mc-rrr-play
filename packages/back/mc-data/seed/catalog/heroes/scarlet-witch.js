import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_WHEN_REVEALED,
    CALC_ALL,
    CALC_COUNT,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ANY,
    CARD_TYPE_ALLY,
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
    CLASSIFICATION_JUSTICE,
    DECK_POSITION_BOTTOM,
    EFFECT_ACTIVATE,
    EFFECT_CANCEL_BOOST_ICONS,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_COUNT_BOOST_ICONS,
    EFFECT_COUNT_BOOST_ICONS_BATCH,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_GET_ENCOUNTER_CARD,
    EFFECT_MAY,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_MODIFY_COST,
    EFFECT_PLAY_CARD,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_RESOLVE_CARDS_IN_ORDER,
    EFFECT_SEARCH_CARDS,
    EFFECT_SELECT_AND_ORDER_TOP_CARDS,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_STUN,
    EFFECT_CONFUSE,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    PLACE_ENCOUNTER_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_HAND,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    RESOURCES_X,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CHARACTER,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_MAIN_SCHEME,
    TARGET_MINION,
    TARGET_PARENT,
    TARGET_PHASE,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_ELITE,
    TRAIT_ITEM,
    TRAIT_MYSTIC,
    TRAIT_PERSONA,
    TRAIT_SPELL,
    TRAIT_SUPERPOWER,
    TRIGGER_BOOST_ICONS_COUNTED,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_INSTANT,
    TRIGGER_PLAY_CARD,
    TRIGGER_THIS_ACTIVATES,
} from 'mc-shared';

const set = 'Bruja Escarlata';

const mercurio = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Mercurio',
        subtitle: 'Pietro Maximoff',
        set,
        image: 'heroes/scarlet-witch/15002.png',
        traits: [TRAIT_AVENGER],
        unique: true,
        cost: 4,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        hitPoints: 4,
        attack: 2,
        attackConsequential: 1,
        thwart: 1,
        thwartConsequential: 1,
        abilities: [
            {
                type: ABILITY_ACTION,
                params: {
                    name: 'Prepara a Mercurio',
                    limit: {
                        count: 1,
                        target: TARGET_PHASE,
                    },
                    effect: {
                        type: EFFECT_READY,
                        params: {target: TARGET_THIS},
                    },
                },
            },
        ],
    },
};

const chaosMagic = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Magia del caos',
        set,
        image: 'heroes/scarlet-witch/15003.png',
        traits: [TRAIT_SPELL, TRAIT_SUPERPOWER],
        cost: 0,
        resources: [RESOURCE_WILD],
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
                                    type: EFFECT_PLAY_CARD,
                                    params: {
                                        target: TARGET_SOURCE,
                                        source: 'player.hand.cards',
                                        ignoreResourceCost: true,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.playCardEffect.played': true,
                                        },
                                        effect: {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                condition: {
                                                    'effects.0.playCardEffect.printedCost': RESOURCES_X,
                                                },
                                                effect: {
                                                    type: EFFECT_DISCARD_FROM_DECK,
                                                    params: {
                                                        target: TARGET_ENCOUNTER_DECK,
                                                        count: 0,
                                                        paramsCalc: {
                                                            target: 'effects.0.playCardEffect.xValue',
                                                            formula: CALC_ALL,
                                                        },
                                                    },
                                                },
                                                effectNot: {
                                                    type: EFFECT_DISCARD_FROM_DECK,
                                                    params: {
                                                        target: TARGET_ENCOUNTER_DECK,
                                                        count: 0,
                                                        paramsCalc: {
                                                            target: 'effects.0.playCardEffect.printedCost',
                                                            formula: CALC_ALL,
                                                        },
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

const hex = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Maleficio',
        set,
        image: 'heroes/scarlet-witch/15004.png',
        traits: [TRAIT_SPELL, TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_MENTAL],
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
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        count: 3,
                                        showDialog: false,
                                    },
                                },
                                {
                                    type: EFFECT_RESOLVE_CARDS_IN_ORDER,
                                    params: {
                                        cards: 'effects.0.cards',
                                        showSingleCardDialog: true,
                                        effectDefinition: {
                                            type: EFFECT_COUNT_BOOST_ICONS,
                                            params: {
                                                card: 'card',
                                                showDialog: false,
                                                effectDefinition: {
                                                    type: EFFECT_DO_IF,
                                                    params: {
                                                        condition: {countedBoostIcons: 0},
                                                        effect: {
                                                            type: EFFECT_DEAL_DAMAGE,
                                                            params: {
                                                                target: TARGET_ENEMY,
                                                                damage: 2,
                                                            },
                                                        },
                                                        effectNot: {
                                                            type: EFFECT_DO_IF,
                                                            params: {
                                                                condition: {countedBoostIcons: 1},
                                                                effect: {
                                                                    type: EFFECT_REMOVE_THREAT,
                                                                    params: {
                                                                        target: TARGET_SCHEME,
                                                                        threat: 2,
                                                                    },
                                                                },
                                                                effectNot: {
                                                                    type: EFFECT_DO_IF,
                                                                    params: {
                                                                        condition: {countedBoostIcons: 2},
                                                                        effect: {
                                                                            type: EFFECT_DRAW_CARD,
                                                                            params: {
                                                                                target: TARGET_YOU,
                                                                                count: 1,
                                                                            },
                                                                        },
                                                                        effectNot: {
                                                                            type: EFFECT_DO_IF,
                                                                            params: {
                                                                                condition: {
                                                                                    countedBoostIcons: '>2',
                                                                                },
                                                                                effect: {
                                                                                    type: EFFECT_CHOOSE,
                                                                                    params: {
                                                                                        options: [
                                                                                            {
                                                                                                type: EFFECT_STUN,
                                                                                                params: {
                                                                                                    title: 'Aturde a un personaje',
                                                                                                    target: TARGET_CHARACTER,
                                                                                                },
                                                                                            },
                                                                                            {
                                                                                                type: EFFECT_CONFUSE,
                                                                                                params: {
                                                                                                    title: 'Confunde a un personaje',
                                                                                                    target: TARGET_CHARACTER,
                                                                                                },
                                                                                            },
                                                                                            {
                                                                                                type: EFFECT_TOUGH,
                                                                                                params: {
                                                                                                    title: 'Dale Duro a un personaje',
                                                                                                    target: TARGET_CHARACTER,
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

const molecularDecomposition = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Descomposición molecular',
        set,
        image: 'heroes/scarlet-witch/15005.png',
        traits: [TRAIT_ATTACK, TRAIT_SPELL],
        cost: 3,
        resources: [RESOURCE_ENERGY],
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
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        count: 2,
                                        showDialog: false,
                                    },
                                },
                                {
                                    type: EFFECT_COUNT_BOOST_ICONS_BATCH,
                                    params: {
                                        cards: 'effects.0.cards',
                                        interactionInstructions: 'Haz clic en una carta para elegirla como objetivo de una interrupción.',
                                        showDialog: true,
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_PARENT,
                                        damage: 5,
                                        isAttack: true,
                                        additionalDamageCalc: {
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

const realityAlteration = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Alterar la realidad',
        set,
        image: 'heroes/scarlet-witch/15006.png',
        traits: [TRAIT_SPELL, TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_ENCOUNTER_REVEAL,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_CANCEL_ENCOUNTER,
                                    params: {
                                        target: TARGET_EFFECT,
                                        type: CARD_TYPE_ANY,
                                        full: true,
                                    },
                                },
                                {
                                    type: EFFECT_COUNT_BOOST_ICONS,
                                    params: {
                                        card: 'triggeredEffect.selectedTarget',
                                    },
                                },
                                {
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        count: 0,
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

const agathaHarkness = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Agatha Harkness',
        set,
        image: 'heroes/scarlet-witch/15007.png',
        traits: [TRAIT_PERSONA],
        unique: true,
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
                        type: EFFECT_SELECT_AND_ORDER_TOP_CARDS,
                        params: {
                            target: TARGET_SOURCE,
                            source: 'player.deck',
                            count: 3,
                            title: 'Elige una carta para añadir a tu mano',
                            orderTitle: 'Ordena las cartas que van al fondo de tu mazo',
                            selectionDestination: PLACE_HAND,
                            returnPosition: DECK_POSITION_BOTTOM,
                            selectionHeading: 'Añadir a mi mano',
                            returnHeading: 'Cartas que van al fondo del mazo',
                            selectionInstructions: 'Añade una carta a tu mano y ordena las demás para devolverlas al fondo del mazo. La carta situada más a la derecha quedará en el fondo del mazo; las demás quedarán encima en el orden elegido.',
                            selectionDropText: 'Arrastra aquí la carta que añades a tu mano',
                            confirmText: 'Confirmar carta y orden',
                        },
                    },
                },
            },
        ],
    },
};

const magicShield = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Escudo mágico',
        set,
        image: 'heroes/scarlet-witch/15008.png',
        traits: [TRAIT_SPELL],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {target: TARGET_FRIENDLY_CHARACTER},
                    arrow: {
                        type: EFFECT_DISCARD_GAME,
                        params: {target: TARGET_THIS},
                    },
                    effect: {
                        type: EFFECT_PREVENT_DAMAGE,
                        params: {
                            target: TARGET_EFFECT,
                            damage: 3,
                        },
                    },
                },
            },
        ],
    },
};

const scarletWitchTiara = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Tiara de la Bruja Escarlata',
        set,
        image: 'heroes/scarlet-witch/15009.png',
        traits: [TRAIT_ITEM],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_INTERRUPT,
                params: {
                    trigger: TRIGGER_BOOST_ICONS_COUNTED,
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {target: TARGET_THIS},
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_SOURCE,
                            source: 'triggeredEffect.boostCountWindows',
                            condition: {countReplaced: false},
                            showCancel: true,
                            dialogTitle: 'Elige la carta cuyo Aumento quieres modificar',
                            effects: [
                                {
                                    type: EFFECT_CHOOSE,
                                    params: {
                                        target: TARGET_PARENT,
                                        showCancel: true,
                                        contextCards: [
                                            {
                                                card: 'effects.0.selectedTarget',
                                                label: 'Carta cuyo Aumento se modifica',
                                            },
                                        ],
                                        options: [
                                            {
                                                type: EFFECT_MODIFY_BOOST_ICONS,
                                                params: {
                                                    title: 'Incrementa en 1 los iconos de Aumento',
                                                    target: TARGET_PARENT,
                                                    count: 1,
                                                },
                                            },
                                            {
                                                type: EFFECT_MODIFY_BOOST_ICONS,
                                                params: {
                                                    title: 'Reduce en 1 los iconos de Aumento',
                                                    target: TARGET_PARENT,
                                                    count: -1,
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

const scarletWitchAbility = {
    type: ABILITY_INTERRUPT,
    params: {
        name: 'Control del caos',
        trigger: TRIGGER_BOOST_ICONS_COUNTED,
        limit: {
            count: 1,
            target: TARGET_PHASE,
        },
        effect: {
            type: EFFECT_CHAINED,
            params: {
                target: TARGET_SOURCE,
                source: 'triggeredEffect.boostCountWindows',
                condition: {countReplaced: false},
                showCancel: true,
                dialogTitle: 'Elige la carta cuyo Aumento quieres sustituir',
                effects: [
                    {
                        type: EFFECT_CANCEL_BOOST_ICONS,
                        params: {
                            target: TARGET_PARENT,
                            allowZero: true,
                            replaceCount: true,
                        },
                    },
                    {
                        type: EFFECT_DISCARD_FROM_DECK,
                        params: {
                            target: TARGET_ENCOUNTER_DECK,
                            count: 1,
                        },
                    },
                    {
                        type: EFFECT_COUNT_BOOST_ICONS,
                        params: {
                            card: 'effects.1.cards.0',
                            showDialog: false,
                        },
                    },
                    {
                        type: EFFECT_MODIFY_BOOST_ICONS,
                        params: {
                            target: TARGET_PARENT,
                            count: 0,
                            countedCard: 'effects.1.cards.0',
                            paramsCalc: {
                                target: 'effects.2.value',
                                formula: CALC_ALL,
                            },
                        },
                    },
                ],
            },
        },
    },
};

const wandaMaximoff = {
    type: CARD_TYPE_ALTEREGO,
    id: 'scarlet-witch-wanda-maximoff',
    params: {
        name: 'Wanda Maximoff',
        set,
        image: 'heroes/scarlet-witch/15001b.png',
        traits: [TRAIT_MYSTIC],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 3,
        handSize: 6,
        hitPoints: 10,
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
                                    'match.inPlayCards.*.card.subtitle': 'Pietro Maximoff',
                                },
                                {
                                    'match.inPlayCards.*.name': 'Pietro Maximoff',
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
};

const scarletWitchSide = {
    type: CARD_TYPE_HERO,
    id: 'scarlet-witch-scarlet-witch',
    params: {
        name: 'Bruja Escarlata',
        set,
        image: 'heroes/scarlet-witch/15001a.png',
        traits: [TRAIT_AVENGER, TRAIT_MYSTIC],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 2,
        attack: 1,
        defense: 2,
        handSize: 5,
        hitPoints: 10,
        abilities: [scarletWitchAbility],
    },
};

const edgeOfMadnessObligation = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Al borde de la locura',
        set,
        image: 'heroes/scarlet-witch/15023.png',
        boost: 3,
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
                                        name: 'Agota a Wanda Maximoff y retira del juego Al borde de la locura',
                                        condition: {
                                            'player.superhero.currentSide.name': 'Wanda Maximoff',
                                        },
                                        arrow: {
                                            type: EFFECT_EXHAUST,
                                            params: {
                                                target: TARGET_ALTEREGO,
                                            },
                                        },
                                        effect: {
                                            type: EFFECT_REMOVE_CARD,
                                            params: {target: TARGET_CARD},
                                        },
                                    },
                                },
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Descarta las 5 primeras cartas del mazo de Encuentros y coloca 1 de Amenaza en el Plan principal por cada icono de estrella. Descarta esta Obligación.',
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_DISCARD_FROM_DECK,
                                                        params: {
                                                            target: TARGET_ENCOUNTER_DECK,
                                                            count: 5,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_PLACE_THREAT,
                                                        params: {
                                                            target: TARGET_MAIN_SCHEME,
                                                            threat: 0,
                                                            paramsCalc: {
                                                                target: 'effects.0.cards',
                                                                formula: CALC_COUNT,
                                                                conditions: {
                                                                    hasBoostAbility: true,
                                                                },
                                                            },
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_DISCARD_GAME,
                                                        params: {target: TARGET_CARD},
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

const nextEvolution = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'La siguiente evolución',
        set,
        image: 'heroes/scarlet-witch/15024.png',
        startingThreat: [2, true],
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_BOOST_ICONS_COUNTED,
                    effect: {
                        type: EFFECT_MODIFY_BOOST_ICONS,
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

const luminous = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Luminosa',
        set,
        image: 'heroes/scarlet-witch/15025.png',
        unique: true,
        nemesis: true,
        traits: [TRAIT_ELITE],
        attack: 2,
        scheme: 2,
        hitPoints: 5,
        boost: 2,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_ACTIVATES,
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
                                    type: EFFECT_COUNT_BOOST_ICONS,
                                    params: {
                                        card: 'effects.0.cards.0',
                                        showDialog: false,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {'effects.1.value': '>1'},
                                        effect: {
                                            type: EFFECT_DEAL_ENCOUNTER,
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

const magicalSuspension = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Suspensión mágica',
        set,
        image: 'heroes/scarlet-witch/15026.png',
        traits: [TRAIT_SPELL],
        attach: TARGET_YOUR_SUPERHERO,
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_PLAY_CARD,
                    triggerParams: {
                        player: 'ability.card.attachedTo.owner',
                    },
                    effect: {
                        type: EFFECT_MODIFY_COST,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {target: TARGET_YOUR_HERO},
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

const chaosManipulation = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Manipulación del caos',
        set,
        image: 'heroes/scarlet-witch/15027.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_ENCOUNTER_DECK_CARDS],
                                        filter: {name: 'Luminosa'},
                                        firstMatch: true,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {'selectedCards.length': '>0'},
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_GET_ENCOUNTER_CARD,
                                                        params: {
                                                            from: PLACE_ENCOUNTER_DECK,
                                                            cardSource: 'selectedCard',
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_ENGAGE,
                                                        params: {
                                                            target: TARGET_YOU,
                                                            cardSource: 'effects.0.card',
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
                                                        type: EFFECT_SEARCH_CARDS,
                                                        params: {
                                                            locations: [PLACE_ENCOUNTER_DISCARD],
                                                            filter: {name: 'Luminosa'},
                                                            firstMatch: true,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_GET_ENCOUNTER_CARD,
                                                        params: {
                                                            from: PLACE_ENCOUNTER_DISCARD,
                                                            cardSource: 'selectedCard',
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_ENGAGE,
                                                        params: {
                                                            target: TARGET_YOU,
                                                            cardSource: 'effects.1.card',
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        count: 1,
                                    },
                                },
                                {
                                    type: EFFECT_COUNT_BOOST_ICONS,
                                    params: {
                                        card: 'effects.2.cards.0',
                                        showDialog: false,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {'effects.3.value': '>1'},
                                        effect: {
                                            type: EFFECT_ACTIVATE,
                                            params: {
                                                target: TARGET_MINION,
                                                condition: {name: 'Luminosa'},
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
    _id: 'scarlet-witch',
    order: 17,
    name: 'Bruja Escarlata',
    folder: 'scarlet-witch',
    config: {
        sides: [wandaMaximoff, scarletWitchSide],
        cards: [
            {count: 1, card: mercurio},
            {count: 1, card: chaosMagic},
            {count: 4, card: hex},
            {count: 3, card: molecularDecomposition},
            {count: 1, card: realityAlteration},
            {count: 1, card: agathaHarkness},
            {count: 3, card: magicShield},
            {count: 1, card: scarletWitchTiara},
        ],
        precon: [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-orden-y-caos', count: 1},
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-meditacion-espiritual', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_JUSTICE,
                cardRefs: [
                    {id: 'justice-the-power-of-justice', count: 2},
                    {id: 'justice-intuicion-heroica', count: 2},
                    {id: 'justice-veloz', count: 1},
                    {id: 'justice-wiccan', count: 1},
                    {id: 'justice-crisis-resuelta', count: 3},
                    {id: 'justice-multitarea', count: 3},
                    {id: 'justice-castigo-inmediato', count: 3},
                    {id: 'justice-cambiar-la-situacion', count: 3},
                ],
            },
        ],
        obligation: {
            count: 2,
            card: edgeOfMadnessObligation,
        },
        nemesis: [
            {count: 1, card: nextEvolution},
            {count: 1, card: luminous},
            {count: 1, card: magicalSuspension},
            {count: 1, card: chaosManipulation},
        ],
    },
};
