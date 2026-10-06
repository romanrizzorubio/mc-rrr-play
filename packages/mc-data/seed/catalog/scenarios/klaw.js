import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_BOOST,
    EFFECT_DELAYED,
    EFFECT_DISCARD_GAME,
    EFFECT_ENEMY_ATTACK,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_HEAL,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_PLACE_THREAT,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_SURGE,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ACTIVATION,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ATTACKED,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_INITIAL_PLAYER,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TRAIT_CONDITION,
    TRAIT_MASTERS_OF_EVIL,
    TRAIT_MERCENARY,
    TRAIT_WEAPON,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';

const klawAttackInterrupt = () => ({
    type: ABILITY_FORCED_INTERRUPT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS,
        effect: {
            type: EFFECT_DEAL_BOOST,
            params: {},
        },
    },
});

const discardUntilMinion = () => ({
    type: EFFECT_CHAINED,
    params: {
        effects: [
            {
                type: EFFECT_DISCARD_UNTIL,
                params: {
                    target: TARGET_ENCOUNTER_DECK,
                    condition: {
                        isMinion: true,
                    },
                },
            },
            {
                type: EFFECT_ENGAGE,
                params: {
                    target: TARGET_INITIAL_PLAYER,
                },
            },
        ],
    },
});

export default {
    '_id': 'klaw',
    'order': 1,
    'name': 'Klaw',
    'folder': 'klaw',
    'config': {
        'name': 'klaw',
        'villains': [
            {
                'type': CARD_TYPE_VILLAIN,
                'params': {
                    'name': 'Klaw',
                    'set': 'klaw',
                    'image': 'scenarios/klaw/01113.png',
                    'traits': [
                        TRAIT_MASTERS_OF_EVIL,
                    ],
                    'unique': true,
                    'stage': 1,
                    'scheme': 2,
                    'attack': 0,
                    'hitPoints': [12, true],
                    'abilities': [
                        klawAttackInterrupt(),
                    ],
                },
            },
            {
                'type': CARD_TYPE_VILLAIN,
                'params': {
                    'name': 'Klaw',
                    'set': 'klaw',
                    'image': 'scenarios/klaw/01114.png',
                    'traits': [
                        TRAIT_MASTERS_OF_EVIL,
                    ],
                    'unique': true,
                    'stage': 2,
                    'scheme': 2,
                    'attack': 1,
                    'hitPoints': [18, true],
                    'abilities': [
                        {
                            'type': ABILITY_WHEN_REVEALED,
                            'params': {
                                'effect': {
                                    'type': EFFECT_CHAINED,
                                    'params': {
                                        'effects': [
                                            {
                                                'type': EFFECT_SEARCH_CARD_REVEAL,
                                                'params': {
                                                    'condition': {
                                                        'name': 'Klaw "el inmortal"',
                                                    },
                                                    'places': [
                                                        PLACE_ENCOUNTER_DECK_CARDS,
                                                        PLACE_ENCOUNTER_DISCARD,
                                                    ],
                                                },
                                            },
                                            {
                                                'type': EFFECT_SHUFFLE_DECK,
                                                'params': {
                                                    'target': TARGET_SCENARIO,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                        klawAttackInterrupt(),
                    ],
                },
            },
            {
                'type': CARD_TYPE_VILLAIN,
                'params': {
                    'name': 'Klaw',
                    'set': 'klaw',
                    'image': 'scenarios/klaw/01115.png',
                    'traits': [
                        TRAIT_MASTERS_OF_EVIL,
                    ],
                    'unique': true,
                    'stage': 3,
                    'scheme': 3,
                    'attack': 2,
                    'hitPoints': [22, true],
                    'keywords': {
                        'toughness': true,
                    },
                    'abilities': [
                        klawAttackInterrupt(),
                    ],
                },
            },
        ],
        'mainSchemes': [
            [
                {
                    'type': CARD_TYPE_MAIN_SCHEME_A_CARD,
                    'params': {
                        'name': 'Distribución clandestina',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01116b.png',
                        'stage': 1,
                        'content': {
                            'villains': [1, 2],
                            'villainsExpert': [2, 3],
                        },
                        'abilities': [
                            {
                                'type': ABILITY_SETUP,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_SEARCH_CARD_REVEAL,
                                                    'params': {
                                                        'condition': {
                                                            'name': 'Red de defensa',
                                                        },
                                                        'places': [
                                                            PLACE_ENCOUNTER_DECK_CARDS,
                                                        ],
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_SHUFFLE_DECK,
                                                    'params': {
                                                        'target': TARGET_SCENARIO,
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
                    'type': CARD_TYPE_MAIN_SCHEME_B_CARD,
                    'params': {
                        'name': 'Distribución clandestina',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01116.png',
                        'stage': 1,
                        'value': [6, true],
                        'startingThreat': 0,
                        'acceleration': [1, true],
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': discardUntilMinion(),
                                },
                            },
                        ],
                    },
                },
            ],
            [
                {
                    'type': CARD_TYPE_MAIN_SCHEME_A_CARD,
                    'params': {
                        'name': 'Reunión secreta',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01117b.png',
                        'stage': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': discardUntilMinion(),
                                },
                            },
                        ],
                    },
                },
                {
                    'type': CARD_TYPE_MAIN_SCHEME_B_CARD,
                    'params': {
                        'name': 'Reunión secreta',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01117.png',
                        'stage': 2,
                        'value': [8, true],
                        'final': true,
                        'startingThreat': 0,
                        'acceleration': [1, true],
                    },
                },
            ],
        ],
        'sets': [
            'standard',
        ],
        'defaultSets': [
            'masters-of-evil',
        ],
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Transformador sónico',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01118.png',
                        'unique': true,
                        'traits': [
                            TRAIT_WEAPON,
                        ],
                        'attach': TARGET_VILLAIN,
                        'attack': 1,
                        'boost': 3,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_VILLAIN_ATTACKS_YOU,
                                    'effect': {
                                        'type': EFFECT_DO_IF_TAKE_DAMAGE,
                                        'params': {
                                            'source': TARGET_EFFECT,
                                            'target': TARGET_ATTACKED,
                                            'effect': {
                                                'type': EFFECT_STUN,
                                                'params': {
                                                    'target': TARGET_ATTACKED,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_SPEND,
                                        'params': {
                                            'resources': [
                                                RESOURCE_ENERGY,
                                                RESOURCE_PHYSICAL,
                                                RESOURCE_MENTAL,
                                            ],
                                        },
                                    },
                                    'effect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Cuerpo de sonido sólido',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01119.png',
                        'traits': [
                            TRAIT_CONDITION,
                        ],
                        'attach': TARGET_VILLAIN,
                        'keywords': {
                            'retaliate': 1,
                        },
                        'boost': 3,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_SPEND,
                                        'params': {
                                            'resources': [
                                                RESOURCE_ENERGY,
                                                RESOURCE_PHYSICAL,
                                                RESOURCE_MENTAL,
                                            ],
                                        },
                                    },
                                    'effect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Guardia acorazado',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01120.png',
                        'traits': [
                            TRAIT_MERCENARY,
                        ],
                        'boost': 1,
                        'scheme': 0,
                        'attack': 1,
                        'hitPoints': 3,
                        'keywords': {
                            'guard': true,
                            'toughness': true,
                        },
                    },
                },
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Traficante de armas',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01121.png',
                        'traits': [
                            TRAIT_MERCENARY,
                        ],
                        'scheme': 1,
                        'attack': 1,
                        'hitPoints': 2,
                        'keywords': {
                            'surge': true,
                        },
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'effect': {
                                    'type': EFFECT_ENGAGE,
                                    'params': {
                                        'target': TARGET_YOU,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'La venganza de Klaw',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01122.png',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED_ALTEREGO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DISCARD_RANDOM,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'count': 1,
                                        },
                                    },
                                },
                            },
                            {
                                'type': ABILITY_WHEN_REVEALED_HERO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_ENEMY_ATTACK,
                                                    'params': {
                                                        'enemyType': CHARACTER_VILLAIN,
                                                        'target': TARGET_YOU,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_DO_IF_TAKE_DAMAGE,
                                                    'params': {
                                                        'source': 'effects.0',
                                                        'effect': {
                                                            'type': EFFECT_PLACE_THREAT,
                                                            'params': {
                                                                'target': TARGET_MAIN_SCHEME,
                                                                'threat': 1,
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
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Estallido sónico',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01123.png',
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHOOSE,
                                        'params': {
                                            'options': [
                                                {
                                                    'type': EFFECT_SPEND,
                                                    'params': {
                                                        'title': 'Gasta un recurso de cada tipo (Energía, Mental y Físico)',
                                                        'resources': [
                                                            RESOURCE_ENERGY,
                                                            RESOURCE_MENTAL,
                                                            RESOURCE_PHYSICAL,
                                                        ],
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'title': 'Agota todos los personajes que controlas',
                                                        'target': TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'effect': {
                                    'type': EFFECT_DELAYED,
                                    'params': {
                                        'target': TARGET_ACTIVATION,
                                        'effect': {
                                            'type': EFFECT_DO_IF_TAKE_DAMAGE,
                                            'params': {
                                                'source': TARGET_EFFECT,
                                                'target': TARGET_YOUR_HERO,
                                                'effect': {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
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
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Manipulación del sonido',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01124.png',
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED_ALTEREGO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_HEAL,
                                        'params': {
                                            'target': TARGET_VILLAIN,
                                            'damage': 4,
                                        },
                                    },
                                    'ifNot': {
                                        'type': EFFECT_SURGE,
                                        'params': {},
                                    },
                                },
                            },
                            {
                                'type': ABILITY_WHEN_REVEALED_HERO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_TAKE_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                        'damage': 2,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_HEAL,
                                                    'params': {
                                                        'target': TARGET_VILLAIN,
                                                        'damage': 2,
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Red de defensa',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01125.png',
                        'boost': 2,
                        'icons': {
                            'crisis': true,
                        },
                        'startingThreat': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_CARD,
                                            'threat': [1, true],
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Fábrica de armamento ilegal',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01126.png',
                        'boost': 2,
                        'icons': {
                            'hazard': 1,
                        },
                        'startingThreat': 3,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_CARD,
                                            'threat': [1, true],
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Klaw "el inmortal"',
                        'set': 'klaw',
                        'image': 'scenarios/klaw/01127.png',
                        'icons': {
                            'acceleration': 1,
                        },
                        'startingThreat': [3, true],
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_CHARACTER_GET_HIT_POINTS,
                                    'effect': {
                                        'type': EFFECT_MODIFY_HIT_POINTS,
                                        'params': {
                                            'target': TARGET_VILLAIN,
                                            'count': 10,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};
