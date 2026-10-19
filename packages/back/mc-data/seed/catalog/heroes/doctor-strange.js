import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESOURCE,
    ABILITY_OPTION,
    ABILITY_SPECIAL,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_BOOST_ICONS,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_HERO,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CANCEL_CARD_EFFECTS,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FACEDOWN,
    EFFECT_FLIP,
    EFFECT_GET_TOP_CARD,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_LOOK_AT_TOP_CARDS,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PAY_PRINTED_COST,
    EFFECT_PLACE_THREAT,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_RESOLVE_SPECIAL_ABILITY,
    EFFECT_REPLACE_STATUS,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TOUGH,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_MAY,
    EFFECT_RETURN_FACEDOWN,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_CARDS,
    TARGET_ALL_CHARACTERS,
    TARGET_ANY_PLAYER,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_PLAYER_EXTRA_DECK,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TOP_CARD,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TARGET_PHASE,
    TARGET_ROUND,
    TRAIT_AERIAL,
    TRAIT_ARTIFACT,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_ELITE,
    TRAIT_INVOCATION,
    TRAIT_ITEM,
    TRAIT_LOCATION,
    TRAIT_MYSTIC,
    TRAIT_SPELL,
    TRAIT_THWART,
    TRIGGER_INSTANT,
    TRIGGER_ROUND_ENDS,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_YOU_PLAY_CARD,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
    TRIGGER_YOUR_HERO_GET_THWART,
    TRIGGER_YOUR_SUPERHERO_GET_TRAITS,
} from 'mc-shared';

const SET = 'Doctor Strange';
const INVOCATION_DECK_ID = 'invocation';

const chain = (effects, params = {}) => ({
    type: EFFECT_CHAINED,
    params: {
        ...params,
        effects,
    },
});

const simultaneous = (effects, target) => ({
    type: EFFECT_SIMULTANEOUS,
    params: {
        ...(target ? {target} : {}),
        effects,
    },
});

const invocationTarget = (type, params = {}) => ({
    type,
    params: {
        target: TARGET_PLAYER_EXTRA_DECK,
        deckId: INVOCATION_DECK_ID,
        ...params,
    },
});

const invocationTopTarget = (type, params = {}) => ({
    type,
    params: {
        target: TARGET_PLAYER_EXTRA_DECK,
        deckId: INVOCATION_DECK_ID,
        position: TARGET_TOP_CARD,
        ...params,
    },
});

const returnInvocationFacedown = () => ({
    type: EFFECT_RETURN_FACEDOWN,
    params: {
        target: TARGET_CARD,
        faceDownTarget: TARGET_ALL_CARDS,
        destination: {
            target: TARGET_PLAYER_EXTRA_DECK,
            deckId: INVOCATION_DECK_ID,
            position: DECK_POSITION_SHUFFLE,
        },
    },
});

const revealDarkDimensionPortal = () => chain(
    [
        {
            type: EFFECT_GET_TOP_CARD,
            params: {
                target: TARGET_PLAYER_EXTRA_DECK,
                deckId: INVOCATION_DECK_ID,
                remove: true,
            },
        },
        {
            type: EFFECT_FACEDOWN,
            params: {
                target: TARGET_CARD,
                cardsTarget: TARGET_SOURCE,
                source: 'selectedCards',
            },
        },
        {
            type: EFFECT_LASTING,
            params: {
                target: TARGET_CARD,
                until: TRIGGER_THIS_DEFEAT,
                endEffect: returnInvocationFacedown(),
            },
        },
    ],
    {
        target: TARGET_PLAYER_EXTRA_DECK,
        deckId: INVOCATION_DECK_ID,
    }
);

const payInvocationCost = () => invocationTopTarget(EFFECT_PAY_PRINTED_COST);

const resolveInvocation = () =>
    invocationTopTarget(EFFECT_RESOLVE_SPECIAL_ABILITY);

const discardInvocation = (params = {}) =>
    invocationTarget(EFFECT_DISCARD_FROM_DECK, {
        count: 1,
        showDialog: false,
        ...params,
    });

const discardResolvedInvocation = () =>
    invocationTarget(EFFECT_DISCARD_FROM_DECK, {
        cards: 'selectedCards',
        showDialog: false,
    });

const invocationCards = [
    {
        count: 1,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Bandas Carmesí de Cyttorak',
                set: SET,
                image: 'heroes/doctor-strange/09032.png',
                traits: [TRAIT_INVOCATION],
                cost: 2,
                classification: CLASSIFICATION_HERO,
                abilities: [
                    {
                        type: ABILITY_SPECIAL,
                        params: {
                            effect: chain([
                                simultaneous([
                                    {
                                        type: EFFECT_STUN,
                                        params: {
                                            target: TARGET_ENEMY,
                                        },
                                    },
                                    {
                                        type: EFFECT_DEAL_DAMAGE,
                                        params: {
                                            target: TARGET_ENEMY,
                                            damage: 7,
                                        },
                                    },
                                ]),
                                discardResolvedInvocation(),
                            ], {target: TARGET_ENEMY}),
                        },
                    },
                ],
            },
        },
    },
    {
        count: 1,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Imágenes de Ikonn',
                set: SET,
                image: 'heroes/doctor-strange/09033.png',
                traits: [TRAIT_INVOCATION],
                cost: 1,
                classification: CLASSIFICATION_HERO,
                abilities: [
                    {
                        type: ABILITY_SPECIAL,
                        params: {
                            effect: chain([
                                simultaneous([
                                    {
                                        type: EFFECT_CONFUSE,
                                        params: {
                                            target: TARGET_VILLAIN,
                                        },
                                    },
                                    {
                                        type: EFFECT_REMOVE_THREAT,
                                        params: {
                                            target: TARGET_SCHEME,
                                            threat: 4,
                                        },
                                    },
                                ]),
                                discardResolvedInvocation(),
                            ]),
                        },
                    },
                ],
            },
        },
    },
    {
        count: 1,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Siete Anillos de Raggador',
                set: SET,
                image: 'heroes/doctor-strange/09034.png',
                traits: [TRAIT_INVOCATION],
                cost: 1,
                classification: CLASSIFICATION_HERO,
                abilities: [
                    {
                        type: ABILITY_SPECIAL,
                        params: {
                            effect: chain([
                                {
                                    type: EFFECT_TOUGH,
                                    params: {
                                        target: TARGET_ALL_CHARACTERS,
                                        selectUpTo: true,
                                        selectCount: 3,
                                    },
                                },
                                discardResolvedInvocation(),
                            ]),
                        },
                    },
                ],
            },
        },
    },
    {
        count: 1,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Vapores de Valtorr',
                set: SET,
                image: 'heroes/doctor-strange/09035.png',
                traits: [TRAIT_INVOCATION],
                cost: 0,
                classification: CLASSIFICATION_HERO,
                abilities: [
                    {
                        type: ABILITY_SPECIAL,
                        params: {
                            effect: chain([
                                {
                                    type: EFFECT_REPLACE_STATUS,
                                },
                                discardResolvedInvocation(),
                            ]),
                        },
                    },
                ],
            },
        },
    },
    {
        count: 1,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Vientos de Watoomb',
                set: SET,
                image: 'heroes/doctor-strange/09036.png',
                traits: [TRAIT_INVOCATION],
                cost: 0,
                classification: CLASSIFICATION_HERO,
                abilities: [
                    {
                        type: ABILITY_SPECIAL,
                        params: {
                            effect: chain([
                                {
                                    type: EFFECT_DRAW_CARD,
                                    params: {
                                        target: TARGET_YOU,
                                        count: 3,
                                    },
                                },
                                discardResolvedInvocation(),
                            ]),
                        },
                    },
                ],
            },
        },
    },
];

const doctorStrange = {
    _id: 'doctor-strange',
    order: 10,
    name: 'Doctor Extraño',
    folder: 'doctor-strange',
    config: {
        sides: [
            {
                type: CARD_TYPE_ALTEREGO,
                params: {
                    name: 'Stephen Extraño',
                    set: SET,
                    traits: [TRAIT_MYSTIC],
                    recovery: 3,
                    hitPoints: 10,
                    handSize: 6,
                    abilities: [
                        {
                            type: ABILITY_ALTEREGO_ACTION,
                            params: {
                                name: 'Talento Innato',
                                limit: {
                                    count: 1,
                                    target: TARGET_PHASE,
                                },
                                effect: discardInvocation({
                                    showDialog: false,
                                }),
                            },
                        },
                    ],
                    image: 'heroes/doctor-strange/09001b.png',
                },
            },
            {
                type: CARD_TYPE_HERO,
                params: {
                    name: 'Doctor Extraño',
                    set: SET,
                    unique: true,
                    traits: [
                        TRAIT_AVENGER,
                        TRAIT_MYSTIC,
                    ],
                    thwart: 2,
                    attack: 1,
                    defense: 2,
                    hitPoints: 10,
                    handSize: 5,
                    abilities: [
                        {
                            type: ABILITY_ACTION,
                            params: {
                                name: 'Dominio de la magia',
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
                                            payInvocationCost(),
                                        ],
                                    },
                                },
                                effect: resolveInvocation(),
                            },
                        },
                    ],
                    image: 'heroes/doctor-strange/09001a.png',
                },
            },
        ],
        extraDecks: [
            {
                id: INVOCATION_DECK_ID,
                name: 'Invocación',
                cards: invocationCards,
            },
        ],
        cards: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_ALLY,
                    params: {
                        name: 'Wong',
                        set: SET,
                        image: 'heroes/doctor-strange/09002.png',
                        unique: true,
                        traits: [TRAIT_MYSTIC],
                        cost: 3,
                        resources: [RESOURCE_WILD],
                        classification: CLASSIFICATION_HERO,
                        attack: 2,
                        attackConsequential: 1,
                        thwart: 1,
                        thwartConsequential: 1,
                        hitPoints: 3,
                        abilities: [
                            {
                                type: ABILITY_ACTION,
                                params: {
                                    name: 'Cura 1 de Daño a tu carta de Superhéroe',
                                    arrow: {
                                        type: EFFECT_EXHAUST,
                                        params: {
                                            target: TARGET_THIS,
                                        },
                                    },
                                    effect: {
                                        type: EFFECT_HEAL,
                                        params: {
                                            target: TARGET_YOUR_SUPERHERO,
                                            damage: 1,
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_ACTION,
                                params: {
                                    name: 'Descarta la primera carta del mazo de Invocación',
                                    arrow: {
                                        type: EFFECT_EXHAUST,
                                        params: {
                                            target: TARGET_THIS,
                                        },
                                    },
                                    effect: discardInvocation(),
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_EVENT,
                    params: {
                        name: 'Proyección astral',
                        set: SET,
                        image: 'heroes/doctor-strange/09003.png',
                        traits: [TRAIT_SPELL, TRAIT_THWART],
                        cost: 2,
                        resources: [RESOURCE_MENTAL],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_HERO_ACTION,
                                params: {
                                    name: 'Proyección astral',
                                    labels: [LABEL_THWART],
                                    effect: chain([
                                        {
                                            type: EFFECT_LOOK_AT_TOP_CARDS,
                                            params: {
                                                target: TARGET_ENCOUNTER_DECK,
                                                count: 1,
                                            },
                                        },
                                        {
                                            type: EFFECT_REMOVE_THREAT,
                                            params: {
                                                target: TARGET_SCHEME,
                                                threat: 3,
                                                paramsCalc: {
                                                    target: 'effects.0.cards',
                                                    formula: CALC_BOOST_ICONS,
                                                    plus: 3,
                                                },
                                            },
                                        },
                                    ], {target: TARGET_SCHEME}),
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_EVENT,
                    params: {
                        name: 'Rayo mágico',
                        set: SET,
                        image: 'heroes/doctor-strange/09004.png',
                        traits: [TRAIT_ATTACK, TRAIT_SPELL],
                        cost: 3,
                        resources: [RESOURCE_ENERGY],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_HERO_ACTION,
                                params: {
                                    name: 'Rayo mágico',
                                    labels: [LABEL_ATTACK],
                                    effect: chain([
                                        simultaneous([
                                            {
                                                type: EFFECT_DEAL_DAMAGE,
                                                params: {
                                                    target: TARGET_ENEMY,
                                                    damage: 5,
                                                },
                                            },
                                            {
                                                type: EFFECT_DISCARD_FROM_DECK,
                                                params: {
                                                    target: TARGET_YOU,
                                                },
                                            },
                                        ], TARGET_ENEMY),
                                        {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                target: TARGET_ENEMY,
                                                condition: {
                                                    'effects.0.effects.1.cards.0.resources': RESOURCE_PHYSICAL,
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
                                            type: EFFECT_DO_IF,
                                            params: {
                                                target: TARGET_ENEMY,
                                                condition: {
                                                    'effects.0.effects.1.cards.0.resources': RESOURCE_ENERGY,
                                                },
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
                                            type: EFFECT_DO_IF,
                                            params: {
                                                target: TARGET_ENEMY,
                                                condition: {
                                                    'effects.0.effects.1.cards.0.resources': RESOURCE_MENTAL,
                                                },
                                                effect: {
                                                    type: EFFECT_CONFUSE,
                                                    params: {
                                                        target: TARGET_ENEMY,
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                target: TARGET_ENEMY,
                                                condition: {
                                                    'effects.0.effects.1.cards.0.resources': RESOURCE_WILD,
                                                },
                                                effect: chain([
                                                    {
                                                        type: EFFECT_STUN,
                                                        params: {
                                                            target: TARGET_ENEMY,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_DEAL_DAMAGE,
                                                        params: {
                                                            target: TARGET_ENEMY,
                                                            damage: 2,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_CONFUSE,
                                                        params: {
                                                            target: TARGET_ENEMY,
                                                        },
                                                    },
                                                ], {target: TARGET_ENEMY}),
                                            },
                                        },
                                    ], {target: TARGET_ENEMY}),
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_EVENT,
                    params: {
                        name: 'Maestro de las artes místicas',
                        set: SET,
                        image: 'heroes/doctor-strange/09005.png',
                        cost: 1,
                        resources: [RESOURCE_MENTAL],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_HERO_ACTION,
                                params: {
                                    name: 'Maestro de las artes místicas',
                                    effect: chain([
                                        resolveInvocation(),
                                        invocationTarget(EFFECT_MOVE_TO_DECK, {
                                            cards: 'selectedCards',
                                            position: DECK_POSITION_TOP,
                                        }),
                                    ]),
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_EVENT,
                    params: {
                        name: 'Estudios místicos',
                        set: SET,
                        image: 'heroes/doctor-strange/09006.png',
                        cost: 1,
                        resources: [RESOURCE_PHYSICAL],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_ALTEREGO_ACTION,
                                params: {
                                    name: 'Estudios místicos',
                                    effect: chain([
                                        {
                                            type: EFFECT_SEARCH_CARDS,
                                            params: {
                                                locations: [
                                                    PLACE_DECK,
                                                    PLACE_DISCARD_PILE,
                                                ],
                                                filter: {
                                                    set: SET,
                                                },
                                                title: 'Busca una carta del Doctor Extraño',
                                            },
                                        },
                                        {
                                            type: EFFECT_MOVE_TO_HAND,
                                            params: {
                                                target: TARGET_SOURCE,
                                                source: 'selectedCards',
                                            },
                                        },
                                        {
                                            type: EFFECT_SHUFFLE_DECK,
                                        },
                                    ]),
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_EVENT,
                    params: {
                        name: 'Salvaguarda arcana',
                        set: SET,
                        image: 'heroes/doctor-strange/09007.png',
                        traits: [TRAIT_SPELL],
                        cost: 1,
                        resources: [RESOURCE_PHYSICAL],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_HERO_INTERRUPT,
                                params: {
                                    name: 'Salvaguarda arcana',
                                    trigger: TRIGGER_TREACHERY_REVEAL,
                                    effect: {
                                        type: EFFECT_CANCEL_ENCOUNTER,
                                        params: {
                                            target: TARGET_EFFECT,
                                            full: true,
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
                    type: CARD_TYPE_SUPPORT,
                    params: {
                        name: 'Sancta Sanctorum',
                        set: SET,
                        image: 'heroes/doctor-strange/09008.png',
                        unique: true,
                        traits: [TRAIT_LOCATION],
                        cost: 1,
                        resources: [RESOURCE_MENTAL],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_ALTEREGO_ACTION,
                                params: {
                                    name: 'Sancta Sanctorum',
                                    arrow: {
                                        type: EFFECT_EXHAUST,
                                        params: {
                                            target: TARGET_THIS,
                                        },
                                    },
                                    effect: chain([
                                        {
                                            type: EFFECT_SEARCH_CARDS,
                                            params: {
                                                locations: [PLACE_DISCARD_PILE],
                                                filter: {
                                                    traits: TRAIT_SPELL,
                                                },
                                                count: 1,
                                                title: 'Elige una carta Hechizo de tu pila de descartes',
                                            },
                                        },
                                        {
                                            type: EFFECT_MOVE_TO_DECK,
                                            params: {
                                                target: TARGET_SOURCE,
                                                source: 'selectedCards',
                                                position: DECK_POSITION_SHUFFLE,
                                            },
                                        },
                                        {
                                            type: EFFECT_DRAW_CARD,
                                            params: {
                                                target: TARGET_YOU,
                                            },
                                        },
                                    ]),
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_UPGRADE,
                    params: {
                        name: 'Capa de levitación',
                        set: SET,
                        image: 'heroes/doctor-strange/09009.png',
                        unique: true,
                        traits: [TRAIT_ARTIFACT, TRAIT_ITEM],
                        cost: 2,
                        resources: [RESOURCE_PHYSICAL],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    trigger: TRIGGER_YOUR_SUPERHERO_GET_TRAITS,
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
                                type: ABILITY_HERO_ACTION,
                                params: {
                                    name: 'Capa de levitación',
                                    arrow: {
                                        type: EFFECT_EXHAUST,
                                        params: {
                                            target: TARGET_THIS,
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
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_UPGRADE,
                    params: {
                        name: 'Mejoras mágicas',
                        set: SET,
                        image: 'heroes/doctor-strange/09010.png',
                        traits: [TRAIT_CONDITION, TRAIT_SPELL],
                        cost: 1,
                        resources: [RESOURCE_ENERGY],
                        classification: CLASSIFICATION_HERO,
                        controllerTarget: TARGET_ANY_PLAYER,
                        abilities: [
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
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
                                    trigger: TRIGGER_YOUR_HERO_GET_THWART,
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
                                    trigger: TRIGGER_YOUR_HERO_GET_DEFENSE,
                                    effect: {
                                        type: EFFECT_MODIFY_DEFENSE_VALUE,
                                        params: {
                                            target: TARGET_EFFECT,
                                            count: 1,
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_FORCED_INTERRUPT,
                                params: {
                                    trigger: TRIGGER_ROUND_ENDS,
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
                count: 1,
                card: {
                    type: CARD_TYPE_UPGRADE,
                    params: {
                        name: 'El Ojo de Agamotto',
                        set: SET,
                        image: 'heroes/doctor-strange/09011.png',
                        unique: true,
                        traits: [TRAIT_ARTIFACT, TRAIT_ITEM],
                        cost: 2,
                        resources: [RESOURCE_ENERGY],
                        classification: CLASSIFICATION_HERO,
                        abilities: [
                            {
                                type: ABILITY_HERO_RESOURCE,
                                params: {
                                    resource: RESOURCE_WILD,
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
                },
            },
        ],
        precon: [
            {
                aspect: 'basic',
                cardRefs: [
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-alerta', count: 3},
                    {id: 'basic-avengers-mansion', count: 1},
                    {id: 'basic-el-hechicero-supremo', count: 1},
                ],
            },
            {
                aspect: 'protection',
                cardRefs: [
                    {id: 'protection-hermano-vudu', count: 1},
                    {id: 'protection-clea', count: 1},
                    {id: 'protection-puno-de-hierro', count: 1},
                    {id: 'protection-defensa-desesperada', count: 3},
                    {id: 'protection-invertir-las-tornas', count: 3},
                    {id: 'protection-el-poder-de-la-proteccion', count: 2},
                    {id: 'protection-equipo-medico', count: 2},
                    {id: 'protection-enfermera-de-noche', count: 1},
                    {id: 'protection-imperturbable', count: 3},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: {
                type: CARD_TYPE_OBLIGATION,
                params: {
                    name: 'Desgaste físico',
                    set: SET,
                    image: 'heroes/doctor-strange/09027.png',
                    boost: 2,
                    giveToOwner: true,
                    triggerInstant: true,
                    abilities: [
                        {
                            type: ABILITY_CONSTANT,
                            params: {
                                trigger: TRIGGER_INSTANT,
                                name: 'Adoptar la identidad de alter ego',
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
                                trigger: TRIGGER_INSTANT,
                                name: 'Resolver la obligación',
                                effect: {
                                    type: EFFECT_CHOOSE_ABILITY,
                                    params: {
                                        options: [
                                            {
                                                type: ABILITY_OPTION,
                                                params: {
                                                    name: 'Agota a Stephen Extraño y retira del juego Desgaste físico',
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
                                                    name: 'El próximo Evento que juegues costará 3 recursos adicionales',
                                                    effect: {
                                                        type: EFFECT_LASTING,
                                                        params: {
                                                            target: TARGET_CARD,
                                                            until: TRIGGER_YOU_END_PLAY_CARD,
                                                            triggerType: TRIGGER_YOU_PLAY_CARD,
                                                            condition: {
                                                                'effect.card.isEvent': true,
                                                            },
                                                            limit: {
                                                                count: 1,
                                                                target: TARGET_ROUND,
                                                            },
                                                            effect: {
                                                                type: EFFECT_MODIFY_COST,
                                                                params: {
                                                                    target: TARGET_EFFECT,
                                                                    count: 3,
                                                                },
                                                            },
                                                            endEffect: {
                                                                type: EFFECT_DISCARD_GAME,
                                                                params: {
                                                                    target: TARGET_CARD,
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
            },
        },
        nemesis: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_MINION,
                    params: {
                        name: 'Barón Mordo',
                        set: SET,
                        image: 'heroes/doctor-strange/09028.png',
                        unique: true,
                        nemesis: true,
                        traits: [TRAIT_ELITE, TRAIT_MYSTIC],
                        attack: 2,
                        scheme: 2,
                        hitPoints: 5,
                        boost: 2,
                        abilities: [
                            {
                                type: ABILITY_FORCED_INTERRUPT,
                                params: {
                                    trigger: TRIGGER_THIS_ATTACK,
                                    effect: chain([
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
                                                    'effects.0.cards.0.resources': RESOURCE_PHYSICAL,
                                                },
                                                effect: {
                                                    type: EFFECT_STUN,
                                                    params: {
                                                        target: TARGET_YOUR_SUPERHERO,
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                condition: {
                                                    'effects.0.cards.0.resources': RESOURCE_ENERGY,
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
                                        {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                condition: {
                                                    'effects.0.cards.0.resources': RESOURCE_MENTAL,
                                                },
                                                effect: {
                                                    type: EFFECT_CONFUSE,
                                                    params: {
                                                        target: TARGET_YOUR_SUPERHERO,
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                condition: {
                                                    'effects.0.cards.0.resources': RESOURCE_WILD,
                                                },
                                                effect: chain([
                                                    {
                                                        type: EFFECT_STUN,
                                                        params: {
                                                            target: TARGET_YOUR_SUPERHERO,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_TAKE_DAMAGE,
                                                        params: {
                                                            target: TARGET_YOUR_SUPERHERO,
                                                            damage: 2,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_CONFUSE,
                                                        params: {
                                                            target: TARGET_YOUR_SUPERHERO,
                                                        },
                                                    },
                                                ]),
                                            },
                                        },
                                    ]),
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'Abrir un portal a la Dimensión Oscura',
                        set: SET,
                        image: 'heroes/doctor-strange/09029.png',
                        boost: 3,
                        startingThreat: [3, true],
                        icons: {
                            acceleration: 1,
                        },
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: revealDarkDimensionPortal(),
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
                        name: 'Contrahechizo',
                        set: SET,
                        image: 'heroes/doctor-strange/09030.png',
                        traits: [TRAIT_CONDITION, TRAIT_SPELL],
                        attach: {
                            target: TARGET_YOUR_HERO,
                        },
                        boost: 1,
                        abilities: [
                            {
                                type: ABILITY_FORCED_INTERRUPT,
                                params: {
                                    trigger: TRIGGER_YOU_PLAY_CARD,
                                    condition: {
                                        'effect.card.isEvent': true,
                                    },
                                    effect: {
                                        type: EFFECT_SIMULTANEOUS,
                                        params: {
                                            effects: [
                                                {
                                                    type: EFFECT_CANCEL_CARD_EFFECTS,
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
                        ],
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Intrusión mental',
                        set: SET,
                        image: 'heroes/doctor-strange/09031.png',
                        boost: 1,
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                                params: {
                                    effect: chain([
                                        {
                                            type: EFFECT_SELECT_DISCARD_CARD,
                                            params: {
                                                target: TARGET_YOU,
                                                filter: {
                                                    cost: {
                                                        operator: 'max',
                                                        defaultValue: 0,
                                                    },
                                                },
                                                title: 'Descarta una carta con el coste más alto',
                                            },
                                        },
                                        {
                                            type: EFFECT_PLACE_THREAT,
                                            params: {
                                                target: TARGET_MAIN_SCHEME,
                                                threat: 0,
                                                paramsCalc: {
                                                    target: 'effects.0.cards.0.cost',
                                                },
                                            },
                                        },
                                    ]),
                                },
                            },
                            {
                                type: ABILITY_WHEN_REVEALED_HERO,
                                params: {
                                    effect: chain([
                                        {
                                            type: EFFECT_SELECT_DISCARD_CARD,
                                            params: {
                                                target: TARGET_YOU,
                                                filter: {
                                                    cost: {
                                                        operator: 'max',
                                                        defaultValue: 0,
                                                    },
                                                },
                                                title: 'Descarta una carta con el coste más alto',
                                            },
                                        },
                                        {
                                            type: EFFECT_TAKE_DAMAGE,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                damage: 0,
                                                paramsCalc: {
                                                    target: 'effects.0.cards.0.cost',
                                                },
                                            },
                                        },
                                    ]),
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};

export default doctorStrange;
