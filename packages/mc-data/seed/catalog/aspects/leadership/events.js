import {
    ABILITY_ACTION,
    ABILITY_HERO_ACTION,
    CALC_COUNT,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
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
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_PLAYERS,
    TARGET_ANY_PLAYER,
    TARGET_SELECTED_PLAYER_CHARACTERS,
    TARGET_ROUND,
    TARGET_YOU,
    TIME_PHASE,
    TRAIT_AVENGER,
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
                                                'title': 'Elige un Aliado de una pila de descartes',
                                                'requireMatch': true,
                                                'showCancel': true
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
    ,
    {
        '_id': 'leadership-avengers-assemble',
        'aspect': 'leadership',
        'order': 20,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Vengadores, reuníos!',
                'set': 'leadership',
                'image': 'aspect/leadership/events/03015.png',
                'cost': 4,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'maximum': {
                                'count': 1,
                                'target': TARGET_ROUND
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_READY,
                                            'params': {
                                                'target': TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                'condition': {
                                                    'traits': TRAIT_AVENGER
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_LASTING,
                                            'params': {
                                                'target': TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                'condition': {
                                                    'traits': TRAIT_AVENGER
                                                },
                                                'until': TIME_PHASE,
                                                'effect': {
                                                    'type': EFFECT_SIMULTANEOUS,
                                                    'params': {
                                                        'target': TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                        'effects': [
                                                            {
                                                                'type': EFFECT_MODIFY_THWART_VALUE,
                                                                'params': {
                                                                    'target': TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                                    'count': 1
                                                                }
                                                            },
                                                            {
                                                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                                                'params': {
                                                                    'target': TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                                    'count': 1
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
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
        '_id': 'leadership-superioridad-numerica',
        'aspect': 'leadership',
        'order': 21,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Superioridad numérica',
                'set': 'leadership',
                'image': 'aspect/leadership/events/03017.png',
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_ALL_ALLIES_YOU_CONTROL,
                                    'selectUpTo': true
                                }
                            },
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'target': TARGET_YOU,
                                    'count': 0,
                                    'paramsCalc': {
                                        'target': 'effect.ability.arrow.cost.selectedTarget',
                                        'formula': CALC_COUNT
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
