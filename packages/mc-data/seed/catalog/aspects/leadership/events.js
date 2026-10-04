import {
    ABILITY_ACTION,
    ABILITY_HERO_ACTION,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PAY_PRINTED_COST,
    EFFECT_PUT_PLAY,
    EFFECT_READY,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALLY,
    TARGET_ALL_PLAYERS,
    TARGET_ANY_PLAYER,
    TARGET_SELECTED_PLAYER_CHARACTERS,
    TIME_PHASE,
    TRAIT_TACTIC
} from 'mc-shared';

export default [
    {
        '_id': 'leadership-hacer-la-llamada',
        'aspect': 'leadership',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Hacer la llamada',
                'set': 'leadership',
                'image': 'aspect/leadership/events/01071.png',
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_PUT_PLAY,
                                'params': {}
                            },
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'matchAll': true,
                                    'outputParams': [
                                        'selectedCard'
                                    ],
                                    'effects': [
                                        {
                                            'type': EFFECT_SEARCH_CARDS,
                                            'params': {
                                                'locations': [
                                                    PLACE_DISCARD_PILE
                                                ],
                                                'players': TARGET_ALL_PLAYERS,
                                                'filter': {
                                                    'type': CARD_TYPE_ALLY
                                                },
                                                'title': 'Elige un Aliado de una pila de descartes'
                                            }
                                        },
                                        {
                                            'type': EFFECT_PAY_PRINTED_COST
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'leadership-liderar-en-vanguardia',
        'aspect': 'leadership',
        'order': 4,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Liderar en vanguardia',
                'set': 'leadership',
                'image': 'aspect/leadership/events/01070.png',
                'traits': [
                    TRAIT_TACTIC
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_LASTING,
                                'params': {
                                    'target': TARGET_ANY_PLAYER,
                                    'until': TIME_PHASE,
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'target': TARGET_ANY_PLAYER,
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_MODIFY_THWART_VALUE,
                                                    'params': {
                                                        'target': TARGET_SELECTED_PLAYER_CHARACTERS,
                                                        'count': 1,
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_MODIFY_ATTACK_VALUE,
                                                    'params': {
                                                        'target': TARGET_SELECTED_PLAYER_CHARACTERS,
                                                        'count': 1,
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'leadership-preparacion',
        'aspect': 'leadership',
        'order': 8,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Preparación',
                'set': 'leadership',
                'image': 'aspect/leadership/events/01069.png',
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_READY,
                                'params': {
                                    'target': TARGET_ALLY
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
