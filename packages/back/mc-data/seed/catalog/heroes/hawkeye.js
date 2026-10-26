import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_OPTION,
    ABILITY_HERO_ACTION,
    ABILITY_INTERRUPT,
    ABILITY_RESOURCE,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_IF,
    CLASSIFICATION_HERO,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_THREAT,
    EFFECT_REMOVE_CARD,
    EFFECT_READY,
    EFFECT_RETURN_HAND,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TUCK_UNDER,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
    PLACE_IN_PLAY,
    RESOURCE_MENTAL,
    RESOURCE_ANY,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ACTIVATION,
    TARGET_ANY_PLAYER,
    TARGET_ALL_PLAYERS,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_PHASE,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_YOU,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ARROW,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_ITEM,
    TRAIT_MERCENARY,
    TRAIT_SHIELD,
    TRAIT_SKILL,
    TRAIT_THWART,
    TRAIT_WEAPON,
    TRIGGER_YOU_ATTACK,
    TRIGGER_THIS_ATTACK,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_INSTANT,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_YOUR_HERO_GET_ATTACK, RESOURCE_ENERGY,
} from 'mc-shared';

const hawkeyeSet = 'Hawkeye';
const hawkeyeBowName = 'Arco de Ojo de Halcón';
const hawkeyeQuiverName = 'Carcaj de Ojo de Halcón';

const hawkeyeBowCard = {
    'type': CARD_TYPE_UPGRADE,
    'params': {
        'name': hawkeyeBowName,
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04002.png',
        'traits': [
            TRAIT_WEAPON,
        ],
        'unique': true,
        'cost': 0,
        'resources': [
            RESOURCE_WILD,
        ],
        'classification': CLASSIFICATION_HERO,
        'keywords': {
            'restricted': true,
        },
        'abilities': [
            {
                'type': ABILITY_CONSTANT,
                'params': {
                    'hideDialog': true,
                    'trigger': TRIGGER_YOUR_HERO_GET_ATTACK,
                    'effect': {
                        'type': EFFECT_MODIFY_ATTACK_VALUE,
                        'params': {
                            'target': TARGET_EFFECT,
                            'count': 1,
                        },
                    },
                },
            },
            {
                'type': ABILITY_CONSTANT,
                'params': {
                    'hideDialog': true,
                    'trigger': TRIGGER_YOU_ATTACK,
                    'condition': {
                        'effect.ability.card.traits': TRAIT_ARROW,
                    },
                    'effect': {
                        'type': EFFECT_MODIFY_ATTACK,
                        'params': {
                            'target': TARGET_EFFECT,
                            'modify': {
                                'keywords': {
                                    'ranged': true,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const hawkeyeQuiverCard = {
    'type': CARD_TYPE_UPGRADE,
    'params': {
        'name': hawkeyeQuiverName,
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04003.png',
        'traits': [
            TRAIT_ITEM,
        ],
        'unique': true,
        'cost': 1,
        'resources': [
            RESOURCE_MENTAL,
        ],
        'classification': CLASSIFICATION_HERO,
        'playTuckedCardsCondition': {
            'isEvent': true,
            'traits': TRAIT_ARROW,
        },
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'name': 'Buscar un Evento Flecha entre las 5 primeras cartas de tu mazo',
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_THIS,
                        },
                    },
                    'effect': {
                        'type': EFFECT_CHAINED,
                        'params': {
                            'target': TARGET_THIS,
                            'effects': [
                                {
                                    'type': EFFECT_SEARCH_CARDS,
                                    'params': {
                                        'locations': [
                                            PLACE_DECK,
                                        ],
                                        'topCount': 5,
                                        'filter': {
                                            'isEvent': true,
                                            'traits': TRAIT_ARROW,
                                        },
                                        'title': 'Elige un Evento Flecha para meter debajo del Carcaj',
                                    },
                                },
                                {
                                    'type': EFFECT_TUCK_UNDER,
                                    'params': {
                                        'target': TARGET_THIS,
                                        'cards': 'selectedCards',
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

const mockingbirdCard = {
    'type': CARD_TYPE_ALLY,
    'params': {
        'name': 'Pájaro Burlón',
        'subtitle': 'Bobbi Morse',
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04004.png',
        'traits': [
            TRAIT_AVENGER,
            TRAIT_SHIELD,
        ],
        'unique': true,
        'cost': 3,
        'resources': [
            RESOURCE_WILD,
        ],
        'classification': CLASSIFICATION_HERO,
        'thwart': 2,
        'attack': 2,
        'thwartConsequential': 1,
        'attackConsequential': 1,
        'hitPoints': 3,
        'abilities': [
            {
                'type': ABILITY_INTERRUPT,
                'params': {
                    'trigger': TRIGGER_VILLAIN_ATTACKS_YOU,
                    'arrow': {
                        'type': EFFECT_SIMULTANEOUS,
                        'params': {
                            'effects': [
                                {
                                    'type': EFFECT_SPEND,
                                    'params': {
                                        'target': TARGET_YOU,
                                        'resources': [
                                            RESOURCE_ANY,
                                        ],
                                    },
                                },
                                {
                                    'type': EFFECT_RETURN_HAND,
                                    'params': {
                                        'target': TARGET_THIS,
                                    },
                                },
                            ],
                        },
                    },
                    'effect': {
                        'type': EFFECT_PREVENT_DAMAGE,
                        'params': {
                            'target': TARGET_YOU,
                        },
                    },
                },
            },
        ],
    },
};

const sonicArrowCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Flecha sónica',
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04005.png',
        'traits': [
            TRAIT_ARROW,
            TRAIT_ATTACK,
        ],
        'cost': 2,
        'resources': [
            RESOURCE_MENTAL,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'labels': [
                        LABEL_ATTACK,
                    ],
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_UPGRADE_YOU_CONTROL,
                            'condition': {
                                'name': hawkeyeBowName,
                            },
                        },
                    },
                    'effect': {
                        'type': EFFECT_SIMULTANEOUS,
                        'params': {
                            'target': TARGET_ENEMY,
                            'effects': [
                                {
                                    'type': EFFECT_DEAL_DAMAGE,
                                    'params': {
                                        'target': TARGET_ENEMY,
                                        'paramsCalc': {
                                            'target': 'effect.selectedTarget.isConfused',
                                            'formula': CALC_IF,
                                            'ifTrue': 5,
                                            'ifFalse': 3,
                                        },
                                    },
                                },
                                {
                                    'type': EFFECT_CONFUSE,
                                    'params': {
                                        'target': TARGET_ENEMY,
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

const explosiveArrowCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Flecha explosiva',
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04006.png',
        'traits': [
            TRAIT_ARROW,
        ],
        'cost': 1,
        'resources': [
            RESOURCE_PHYSICAL,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_UPGRADE_YOU_CONTROL,
                            'condition': {
                                'name': hawkeyeBowName,
                            },
                        },
                    },
                    'effect': {
                        'type': EFFECT_SIMULTANEOUS,
                        'params': {
                            'target': TARGET_ANY_PLAYER,
                            'effects': [
                                {
                                    'type': EFFECT_DEAL_DAMAGE,
                                    'params': {
                                        'target': TARGET_VILLAIN,
                                        'damage': 3,
                                    },
                                },
                                {
                                    'type': EFFECT_DEAL_DAMAGE,
                                    'params': {
                                        'target': TARGET_SOURCE,
                                        'source': 'targetPlayer.minions',
                                        'multipleTarget': true,
                                        'damage': 3,
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

const electricArrowCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Flecha eléctrica',
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04007.png',
        'traits': [
            TRAIT_ARROW,
            TRAIT_THWART,
        ],
        'cost': 2,
        'resources': [
            RESOURCE_ENERGY,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'labels': [
                        LABEL_ATTACK,
                    ],
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_UPGRADE_YOU_CONTROL,
                            'condition': {
                                'name': hawkeyeBowName,
                            },
                        },
                    },
                    'effect': {
                        'type': EFFECT_SIMULTANEOUS,
                        'params': {
                            'target': TARGET_ENEMY,
                            'effects': [
                                {
                                    'type': EFFECT_DEAL_DAMAGE,
                                    'params': {
                                        'target': TARGET_ENEMY,
                                        'paramsCalc': {
                                            'target': 'effect.selectedTarget.isStunned',
                                            'formula': CALC_IF,
                                            'ifTrue': 5,
                                            'ifFalse': 3,
                                        },
                                    },
                                },
                                {
                                    'type': EFFECT_STUN,
                                    'params': {
                                        'target': TARGET_ENEMY,
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

const cableArrowCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Flecha con cable',
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04008.png',
        'traits': [
            TRAIT_ARROW,
            TRAIT_THWART,
        ],
        'cost': 1,
        'resources': [
            RESOURCE_PHYSICAL,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'labels': [
                        LABEL_THWART,
                    ],
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_UPGRADE_YOU_CONTROL,
                            'condition': {
                                'name': hawkeyeBowName,
                            },
                        },
                    },
                    'effect': {
                        'type': EFFECT_REMOVE_THREAT,
                        'params': {
                            'target': TARGET_SCHEME,
                            'threat': 3,
                            'ignoreCrisis': true,
                        },
                    },
                },
            },
        ],
    },
};

const vibraniumArrowCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Flecha de vibránium',
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04009.png',
        'traits': [
            TRAIT_ARROW,
            TRAIT_ATTACK,
        ],
        'cost': 2,
        'resources': [
            RESOURCE_ENERGY,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'labels': [
                        LABEL_ATTACK,
                    ],
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_UPGRADE_YOU_CONTROL,
                            'condition': {
                                'name': hawkeyeBowName,
                            },
                        },
                    },
                    'effect': {
                        'type': EFFECT_DEAL_DAMAGE,
                        'params': {
                            'target': TARGET_ENEMY,
                            'damage': 6,
                            'keywords': {
                                'piercing': true,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const expertMarksmanCard = {
    'type': CARD_TYPE_UPGRADE,
    'params': {
        'name': 'Tirador experto',
        'set': hawkeyeSet,
        'image': 'heroes/hawkeye/04010.png',
        'traits': [
            TRAIT_SKILL,
        ],
        'cost': 1,
        'resources': [
            RESOURCE_WILD,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_RESOURCE,
                'params': {
                    'resource': RESOURCE_WILD,
                    'condition': {
                        'cardToPay.isEvent': true,
                        'cardToPay.traits': TRAIT_ARROW,
                    },
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

export default {
    '_id': 'hawkeye',
    'order': 7,
    'name': 'Ojo de Halcón',
    'folder': 'hawkeye',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Clint Barton',
                    'set': hawkeyeSet,
                    'image': 'heroes/hawkeye/04001b.png',
                    'traits': [
                        TRAIT_SHIELD,
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 3,
                    'handSize': 6,
                    'hitPoints': 9,
                    'abilities': [
                        {
                            'type': ABILITY_ALTEREGO_ACTION,
                            'params': {
                                'name': 'Arma predilecta',
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_PHASE,
                                },
                                'arrow': {
                                    'type': EFFECT_SPEND,
                                    'params': {
                                        'resources': [
                                            RESOURCE_ANY,
                                        ],
                                    },
                                },
                                'effect': {
                                    'type': EFFECT_CHAINED,
                                    'params': {
                                        'effects': [
                                            {
                                                'type': EFFECT_SEARCH_CARDS,
                                                'params': {
                                                    'locations': [
                                                        PLACE_DECK,
                                                        PLACE_DISCARD_PILE,
                                                    ],
                                                    'filter': {
                                                        'name': hawkeyeBowName,
                                                    },
                                                },
                                            },
                                            {
                                                'type': EFFECT_MOVE_TO_HAND,
                                                'params': {
                                                    'target': TARGET_SOURCE,
                                                    'source': 'selectedCards',
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
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Ojo de Halcón',
                    'set': hawkeyeSet,
                    'image': 'heroes/hawkeye/04001a.png',
                    'traits': [
                        TRAIT_AVENGER,
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 1,
                    'attack': 2,
                    'defense': 1,
                    'handSize': 5,
                    'hitPoints': 9,
                    'abilities': [
                        {
                            'type': ABILITY_ACTION,
                            'params': {
                                'name': 'Desefundado rápido',
                                'arrow': {
                                    'type': EFFECT_EXHAUST,
                                    'params': {
                                        'target': TARGET_YOUR_SUPERHERO,
                                    },
                                },
                                'effect': {
                                    'type': EFFECT_READY,
                                    'params': {
                                        'target': TARGET_UPGRADE_YOU_CONTROL,
                                        'condition': {
                                            'name': hawkeyeBowName,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        ],
        'cards': [
            {
                'count': 1,
                'card': hawkeyeBowCard,
            },
            {
                'count': 1,
                'card': hawkeyeQuiverCard,
            },
            {
                'count': 1,
                'card': mockingbirdCard,
            },
            {
                'count': 2,
                'card': sonicArrowCard,
            },
            {
                'count': 2,
                'card': explosiveArrowCard,
            },
            {
                'count': 2,
                'card': electricArrowCard,
            },
            {
                'count': 2,
                'card': cableArrowCard,
            },
            {
                'count': 2,
                'card': vibraniumArrowCard,
            },
            {
                'count': 2,
                'card': expertMarksmanCard,
            },
        ],
        'precon': [
            {
                'aspect': 'leadership',
                'cardRefs': [
                    {'id': 'leadership-liderar-en-vanguardia', 'count': 2},
                    {'id': 'leadership-el-poder-del-liderazgo', 'count': 2},
                    {'id': 'leadership-ojo-de-halcon-kate-bishop', 'count': 1},
                    {'id': 'leadership-caballero-negro', 'count': 1},
                    {'id': 'leadership-goliat', 'count': 1},
                    {'id': 'leadership-usagente', 'count': 1},
                    {'id': 'leadership-aeromoto', 'count': 3},
                    {'id': 'leadership-entrenamiento-en-equipo', 'count': 3},
                    {'id': 'leadership-listo-para-la-accion', 'count': 3},
                ],
            },
            {
                'classification': 'basic',
                'cardRefs': [
                    {'id': 'basic-avengers-tower', 'count': 1},
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-genius', 'count': 1},
                    {'id': 'basic-maquina-de-guerra', 'count': 1},
                    {'id': 'basic-los-heroes-mas-poderosos', 'count': 3},
                ],
            },
        ],
        'obligation': {
            'count': 1,
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'Pasado criminal',
                    'image': 'heroes/hawkeye/04026.png',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Adoptar la identidad de alter ego',
                                'effect': {
                                    'type': EFFECT_MAY,
                                    'params': {
                                        'effect': {
                                            'type': EFFECT_FLIP,
                                            'params': {
                                                'target': TARGET_YOUR_SUPERHERO,
                                                'formTarget': TARGET_ALTEREGO_SIDE,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Resolver la obligación',
                                'effect': {
                                    'type': EFFECT_CHOOSE_ABILITY,
                                    'params': {
                                        'options': [
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Agotar a Clint Barton para retirar del juego Pasado criminal',
                                                    'arrow': {
                                                        'type': EFFECT_EXHAUST,
                                                        'params': {
                                                            'target': TARGET_ALTEREGO,
                                                        },
                                                    },
                                                    'effect': {
                                                        'type': EFFECT_REMOVE_CARD,
                                                        'params': {
                                                            'target': TARGET_CARD,
                                                        },
                                                    },
                                                },
                                            },
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Descartar del juego el Arco de Ojo de Halcón y esta Obligación',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_DISCARD_GAME,
                                                                    'params': {
                                                                        'target': TARGET_UPGRADE_YOU_CONTROL,
                                                                        'condition': {
                                                                            'name': hawkeyeBowName,
                                                                        },
                                                                    },
                                                                },
                                                                {
                                                                    'type': EFFECT_DISCARD_GAME,
                                                                    'params': {
                                                                        'target': TARGET_CARD,
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
        'nemesis': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Fuego Cruzado',
                        'set': hawkeyeSet,
                        'image': 'heroes/hawkeye/04027.png',
                        'traits': [TRAIT_MERCENARY],
                        'unique': true,
                        'nemesis': true,
                        'attack': 2,
                        'scheme': 1,
                        'hitPoints': 4,
                        'keywords': {
                            'quickStrike': true,
                        },
                        'boost': 0,
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'condition': {
                                    'effect.enemyActivation.isAttack': true,
                                },
                                'effect': {
                                    'type': EFFECT_MODIFY_ATTACK,
                                    'params': {
                                        'target': TARGET_ACTIVATION,
                                        'modify': {
                                            'keywords': {
                                                'piercing': true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_THIS_ATTACK,
                                    'effect': {
                                        'type': EFFECT_MODIFY_ATTACK,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'modify': {
                                                'keywords': {
                                                    'piercing': true,
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
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'En el punto de mira',
                        'set': hawkeyeSet,
                        'image': 'heroes/hawkeye/04028.png',
                        'startingThreat': 5,
                        'icons': {
                            'acceleration': 1,
                        },
                        'boost': 3,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'effects': [
                                                {
                                                    'type': EFFECT_FOR_EACH,
                                                    'params': {
                                                        'target': TARGET_ALL_PLAYERS,
                                                        'condition': {
                                                            'superhero.sides.0.name': 'Clint Barton',
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_CHAINED,
                                                            'params': {
                                                                'target': TARGET_THIS,
                                                                'effects': [
                                                                    {
                                                                        'type': EFFECT_SEARCH_CARDS,
                                                                        'params': {
                                                                            'filter': {
                                                                                'name': 'Pájaro Burlón',
                                                                            },
                                                                            'locations': [
                                                                                PLACE_HAND,
                                                                                PLACE_DECK,
                                                                                PLACE_DISCARD_PILE,
                                                                                PLACE_IN_PLAY,
                                                                            ],
                                                                            'count': 1,
                                                                            'title': 'Busca a Pájaro Burlón',
                                                                        },
                                                                    },
                                                                    {
                                                                        'type': EFFECT_TUCK_UNDER,
                                                                        'params': {
                                                                            'target': TARGET_THIS,
                                                                            'cards': 'selectedCards',
                                                                        },
                                                                    },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_LASTING,
                                                    'params': {
                                                        'target': TARGET_SOURCE,
                                                        'source': 'ability.card.tuckedCards',
                                                        'until': TRIGGER_THIS_DEFEAT,
                                                        'endEffect': {
                                                            'type': EFFECT_MOVE_TO_HAND,
                                                            'params': {
                                                                'target': TARGET_SOURCE,
                                                                'source': 'card.tuckedCards',
                                                                'toOwner': true,
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Fusil de Fuego Cruzado',
                        'set': hawkeyeSet,
                        'image': 'heroes/hawkeye/04029.png',
                        'traits': [TRAIT_WEAPON],
                        'unique': true,
                        'boost': 2,
                        'attack': 2,
                        'attach': {
                            'target': TARGET_ENEMY,
                            'condition': {
                                'name': 'Fuego Cruzado',
                            },
                            'fallbackTarget': TARGET_VILLAIN,
                        },
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_THIS_ATTACK,
                                    'effect': {
                                        'type': EFFECT_MODIFY_ATTACK,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'modify': {
                                                'keywords': {
                                                    'ranged': true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'name': 'Descartar el Fusil de Fuego Cruzado',
                                    'arrow': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_SPEND,
                                                    'params': {
                                                        'resources': [RESOURCE_WILD],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    'effect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_CARD,
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
                        'name': 'Disparo de francotirador',
                        'set': hawkeyeSet,
                        'image': 'heroes/hawkeye/04030.png',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED_ALTEREGO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_MAIN_SCHEME,
                                            'threat': 3,
                                        },
                                    },
                                },
                            },
                            {
                                'type': ABILITY_WHEN_REVEALED_HERO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_TAKE_DAMAGE,
                                        'params': {
                                            'target': TARGET_YOUR_HERO,
                                            'damage': 3,
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
