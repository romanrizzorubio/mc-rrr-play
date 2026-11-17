import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESOURCE,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ATTACHMENT,
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
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_JUSTICE,
    CLASSIFICATION_PROTECTION,
    CLASSIFICATION_HERO,
    EFFECT_CHAINED,
    EFFECT_BLANK_TEXT,
    EFFECT_CATEGORY_THREAT_REMOVAL,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CANNOT_TARGET,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_HEAL,
    EFFECT_LOOK_AT_TOP_CARDS,
    EFFECT_MAY,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_SURGE,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_ALLIES,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SUPERHEROES,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_PHASE,
    TARGET_PLAYER_DECK,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_DEFENSE,
    TRAIT_ELITE,
    TRAIT_GUARDIAN,
    TRAIT_LOCATION,
    TRAIT_OUTLAW,
    TRAIT_SKILL,
    TRAIT_THWART,
    TRAIT_TECH,
    TRAIT_WEAPON,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_INSTANT,
    TRIGGER_PHASE_ENDS,
    TRIGGER_VILLAIN_PHASE_START,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';

const gamoraSet = 'Gamora';

const gamoraAlterEgo = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: 'Gamora',
        set: gamoraSet,
        image: 'heroes/gamora/18001b.png',
        traits: [TRAIT_OUTLAW],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 3,
        handSize: 6,
        hitPoints: 10,
        abilities: [
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    name: 'Experta en tácticas',
                    limit: {
                        count: 1,
                        target: TARGET_ROUND,
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_LOOK_AT_TOP_CARDS,
                                    params: {
                                        target: TARGET_PLAYER_DECK,
                                        count: 1,
                                        filter: {
                                            isEvent: true,
                                            traits: [TRAIT_ATTACK, TRAIT_THWART],
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.matchingCards.length': '>0',
                                        },
                                        effect: {
                                            type: EFFECT_MOVE_TO_HAND,
                                            params: {
                                                target: TARGET_SOURCE,
                                                source: 'effects.0.matchingCards',
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

const gamoraHero = {
    type: CARD_TYPE_HERO,
    params: {
        name: 'Gamora',
        set: gamoraSet,
        image: 'heroes/gamora/18001a.png',
        traits: [TRAIT_GUARDIAN],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 2,
        attack: 2,
        defense: 2,
        handSize: 5,
        hitPoints: 10,
        abilities: [
            {
                type: ABILITY_RESPONSE,
                params: {
                    name: 'Sutileza',
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {
                        'effect.card.isEvent': true,
                        'effect.card.traits': TRAIT_ATTACK,
                    },
                    aspectMarker: TRAIT_ATTACK,
                    limit: {
                        count: 1,
                        target: TARGET_PHASE,
                    },
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            target: TARGET_SCHEME,
                            threat: 1,
                        },
                    },
                },
            },
            {
                type: ABILITY_RESPONSE,
                params: {
                    name: 'Precisión',
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {
                        'effect.card.isEvent': true,
                        'effect.card.traits': TRAIT_THWART,
                    },
                    aspectMarker: TRAIT_THWART,
                    limit: {
                        count: 1,
                        target: TARGET_PHASE,
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

const nebulaAlly = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Nébula',
        set: gamoraSet,
        image: 'heroes/gamora/18002.png',
        traits: [TRAIT_GUARDIAN],
        unique: true,
        classification: CLASSIFICATION_HERO,
        cost: 2,
        resources: [RESOURCE_WILD],
        attack: 2,
        attackConsequential: 1,
        thwart: 2,
        thwartConsequential: 1,
        hitPoints: 2,
        abilities: [
            {
                type: ABILITY_RESPONSE,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_DECK],
                                        filter: {
                                            isEvent: true,
                                            traits: [TRAIT_ATTACK, TRAIT_THWART],
                                        },
                                        title: 'Busca un Evento de Ataque o Intervención',
                                    },
                                },
                                {
                                    type: EFFECT_MOVE_TO_HAND,
                                    params: {
                                        target: TARGET_SOURCE,
                                        source: 'selectedCards',
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

const acrobaticManeuver = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Movimiento acrobático',
        set: gamoraSet,
        image: 'heroes/gamora/18003.png',
        traits: [TRAIT_ATTACK],
        cost: 0,
        resources: [RESOURCE_ENERGY],
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
                            damage: 2,
                        },
                    },
                },
            },
        ],
    },
};

const returnTheBlow = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Devolver el golpe',
        set: gamoraSet,
        image: 'heroes/gamora/18004.png',
        traits: [TRAIT_ATTACK, TRAIT_DEFENSE, TRAIT_THWART],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    labels: [LABEL_ATTACK, LABEL_DEFENSE, LABEL_THWART],
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_YOUR_SUPERHERO,
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_PREVENT_DAMAGE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        damage: 3,
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ENEMY,
                                        damage: 1,
                                    },
                                },
                                {
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        target: TARGET_SCHEME,
                                        threat: 1,
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

const setThePace = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Marcar el ritmo',
        set: gamoraSet,
        image: 'heroes/gamora/18005.png',
        traits: [TRAIT_THWART],
        cost: 0,
        resources: [RESOURCE_PHYSICAL],
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
                            threat: 1,
                        },
                    },
                },
            },
        ],
    },
};

const decisiveBlow = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Golpe decisivo',
        set: gamoraSet,
        image: 'heroes/gamora/18006.png',
        traits: [TRAIT_ATTACK],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'player.playedEventsThisTurn.*.traits': TRAIT_THWART,
                            },
                            effect: {
                                type: EFFECT_DEAL_DAMAGE,
                                params: {
                                    target: TARGET_ENEMY,
                                    damage: 7,
                                },
                            },
                            effectNot: {
                                type: EFFECT_DEAL_DAMAGE,
                                params: {
                                    target: TARGET_ENEMY,
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

const momentum = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Ímpetu',
        set: gamoraSet,
        image: 'heroes/gamora/18007.png',
        traits: [TRAIT_THWART],
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
                                'player.playedEventsThisTurn.*.traits': TRAIT_ATTACK,
                            },
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

const trainingArea = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Sala de ejercicio',
        set: gamoraSet,
        image: 'heroes/gamora/18008.png',
        traits: [TRAIT_LOCATION],
        cost: 1,
        resources: [RESOURCE_MENTAL],
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
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_DISCARD_PILE],
                                        filter: {
                                            isEvent: true,
                                            traits: [TRAIT_ATTACK, TRAIT_THWART],
                                        },
                                        firstMatch: true,
                                        reverseLocations: [PLACE_DISCARD_PILE],
                                        title: 'Elige un Evento de Ataque o Intervención',
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
                                    type: EFFECT_HEAL,
                                    params: {
                                        target: TARGET_ALL_FRIENDLY_CHARACTERS,
                                        condition: {
                                            name: 'Gamora',
                                        },
                                        damage: 1,
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

const heightenedSenses = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Instinto agudizado',
        set: gamoraSet,
        image: 'heroes/gamora/18009.png',
        traits: [TRAIT_SKILL],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_RESOURCE,
                params: {
                    resource: RESOURCE_WILD,
                    condition: {
                        'cardToPay.isEvent': true,
                        'cardToPay.traits': [TRAIT_ATTACK, TRAIT_THWART],
                    },
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

const gamoraSword = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Espada de Gamora',
        set: gamoraSet,
        image: 'heroes/gamora/18010.png',
        traits: [TRAIT_WEAPON],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        keywords: {
            restricted: true,
        },
        abilities: [
            {
                type: ABILITY_RESPONSE,
                params: {
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {
                        'effect.card.isEvent': true,
                        'effect.card.traits': TRAIT_ATTACK,
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

const unfinishedDestiny = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Destino inconcluso',
        set: gamoraSet,
        image: 'heroes/gamora/18024.png',
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Adoptar la identidad de tu Alter ego',
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
                    name: 'Resolver la Obligación',
                    trigger: TRIGGER_INSTANT,
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Agota tu Alter ego → retira del juego Destino inconcluso',
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
                                        name: 'Elige 2 Eventos de tu mano y descártalos. Descarta esta Obligación.',
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_SELECT_DISCARD_CARD,
                                                        params: {
                                                            target: TARGET_YOU,
                                                            count: 2,
                                                            filter: {
                                                                isEvent: true,
                                                            },
                                                            title: 'Elige 2 Eventos de tu mano para descartarlos',
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

const sisterRivalry = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Rivalidad entre hermanas',
        set: gamoraSet,
        image: 'heroes/gamora/18025.png',
        startingThreat: 4,
        boost: 3,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    validation: {
                        type: EFFECT_CANNOT_TARGET,
                        params: {
                            effectCategories: [EFFECT_CATEGORY_THREAT_REMOVAL],
                            effectCondition: {
                                not: {'effect.ability.actor.mainName': 'Gamora'},
                                sourceTarget: {
                                    operator: 'eq',
                                    path: 'targetCard',
                                },
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_VILLAIN_PHASE_START,
                    effect: {
                        type: EFFECT_DEAL_ENCOUNTER,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            condition: {
                                'superhero.mainName': 'Gamora',
                            },
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

const nebulaNemesis = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Nébula',
        set: gamoraSet,
        image: 'heroes/gamora/18026.png',
        unique: true,
        traits: [TRAIT_ELITE, TRAIT_OUTLAW],
        attack: 2,
        scheme: 1,
        hitPoints: 5,
        keywords: {
            retaliate: 2,
        },
        boost: 3,
        nemesis: true,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    workBeforeEnterPlay: true,
                    triggerParams: {
                        cardCondition: {
                            isMinion: true,
                            name: 'Nébula',
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {
                            target: TARGET_ALL_ALLIES,
                            condition: {
                                isAlly: true,
                                name: 'Nébula',
                            },
                        },
                    },
                },
            },
        ],
    },
};

const againstTheRopes = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Contra las cuerdas',
        set: gamoraSet,
        image: 'heroes/gamora/18027.png',
        traits: [TRAIT_ARMOR, TRAIT_TECH],
        attach: {
            target: TARGET_SOURCE,
            source: 'match.players.*.superhero',
            condition: {mainName: 'Gamora'},
        },
        boost: 1,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_BLANK_TEXT,
                        params: {
                            target: TARGET_ATTACHED,
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
                                    type: EFFECT_SELECT_DISCARD_CARD,
                                    params: {
                                        target: TARGET_YOU,
                                        count: 1,
                                        filter: {
                                            isEvent: true,
                                            traits: TRAIT_ATTACK,
                                        },
                                        title: 'Elige y descarta 1 Evento de Ataque de tu mano',
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ATTACHED,
                                        damage: 1,
                                    },
                                },
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
};

const attackedBySurprise = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Atacada a traición',
        set: gamoraSet,
        image: 'heroes/gamora/18028.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    condition: [
                        {
                            'reveal.match.players': {
                                some: {
                                    'superhero.mainName': 'Gamora',
                                    'superhero.isStunned': true,
                                },
                            },
                        },
                        {
                            'reveal.match.players': {
                                some: {
                                    'superhero.mainName': 'Gamora',
                                    'superhero.isConfused': true,
                                },
                            },
                        },
                    ],
                    effect: {
                        type: EFFECT_SURGE,
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_STUN,
                                    params: {
                                        target: TARGET_ALL_SUPERHEROES,
                                        condition: {
                                            mainName: 'Gamora',
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_CONFUSE,
                                    params: {
                                        target: TARGET_ALL_SUPERHEROES,
                                        condition: {
                                            mainName: 'Gamora',
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
    _id: 'gamora',
    order: 18,
    name: 'Gamora',
    folder: 'gamora',
    config: {
        aspectMarkerRules: {
            activateOn: TRIGGER_YOU_PLAY_CARD,
            deactivateOn: TRIGGER_PHASE_ENDS,
            eventsOnly: true,
            markersByTrait: {
                [TRAIT_ATTACK]: TRAIT_ATTACK,
                [TRAIT_THWART]: TRAIT_THWART,
            },
        },
        deckBuildingRules: {
            offAspectCards: {
                maxCount: 6,
                types: [CARD_TYPE_EVENT],
                traits: [TRAIT_ATTACK, TRAIT_THWART],
            },
        },
        sides: [gamoraAlterEgo, gamoraHero],
        cards: [
            {count: 1, card: nebulaAlly},
            {count: 2, card: acrobaticManeuver},
            {count: 2, card: returnTheBlow},
            {count: 2, card: setThePace},
            {count: 2, card: decisiveBlow},
            {count: 2, card: momentum},
            {count: 1, card: trainingArea},
            {count: 2, card: heightenedSenses},
            {count: 1, card: gamoraSword},
        ],
        precon: [
            {
                aspect: CLASSIFICATION_AGGRESSION,
                cardRefs: [
                    {id: 'aggression-gancho', count: 2},
                    {id: 'aggression-entrenamiento-de-combate', count: 2},
                    {id: 'aggression-angela', count: 1},
                    {id: 'aggression-vapuleo', count: 3},
                    {id: 'aggression-plan-de-ataque', count: 3},
                    {id: 'aggression-matadioses', count: 1},
                ],
            },
            {
                aspect: CLASSIFICATION_PROTECTION,
                cardRefs: [
                    {id: 'protection-primer-impacto', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_JUSTICE,
                cardRefs: [
                    {id: 'justice-cortar-el-paso', count: 3},
                ],
            },
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-drax', count: 1},
                    {id: 'basic-ataque-relampago', count: 3},
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: unfinishedDestiny,
        },
        nemesis: [
            {count: 1, card: sisterRivalry},
            {count: 1, card: nebulaNemesis},
            {count: 1, card: againstTheRopes},
            {count: 2, card: attackedBySurprise},
        ],
    },
};
