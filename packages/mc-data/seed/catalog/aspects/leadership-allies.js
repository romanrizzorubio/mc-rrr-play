import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SPEND,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_TRIGGERED_CARD,
    TARGET_THIS,
    TIME_PHASE,
    TIME_ROUND,
    TRAIT_AVENGER,
    TRAIT_DROID,
    TRAIT_SHIELD,
    TRIGGER_MINION_ENTER_PLAY,
    TRIGGER_THIS_ENTER_PLAY
} from 'mc-shared';

export default [
    {
        '_id': 'leadership-maria-hill',
        'aspect': 'leadership',
        'order': 0,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Maria Hill',
                'set': 'leadership',
                'image': 'aspect/leadership/allies/01067.png',
                'traits': [
                    TRAIT_SHIELD
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'leadership',
                'thwart': 2,
                'attack': 1,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 2,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'count': 1,
                                    'target': TARGET_ALL_PLAYERS
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'leadership-vision',
        'aspect': 'leadership',
        'order': 1,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Visión',
                'set': 'leadership',
                'image': 'aspect/leadership/allies/01068.png',
                'traits': [
                    TRAIT_DROID,
                    TRAIT_AVENGER
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'leadership',
                'thwart': 1,
                'attack': 2,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'Aumentar atributo',
                            'limit': {
                                'count': 1,
                                'time': TIME_ROUND
                            },
                            'arrow': {
                                'type': EFFECT_SPEND,
                                'params': {
                                    'resources': [
                                        RESOURCE_ENERGY
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_CHOOSE_ABILITY,
                                'params': {
                                    'options': [
                                        {
                                            'type': ABILITY_OPTION,
                                            'params': {
                                                'name': 'Recibe +2 de INT',
                                                'effect': {
                                                    'type': EFFECT_LASTING,
                                                    'params': {
                                                        'target': TARGET_THIS,
                                                        'until': TIME_PHASE,
                                                        'effect': {
                                                            'type': EFFECT_MODIFY_THWART_VALUE,
                                                            'params': {
                                                                'target': TARGET_THIS,
                                                                'count': 2
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            'type': ABILITY_OPTION,
                                            'params': {
                                                'name': 'Recibe +2 de ATQ',
                                                'effect': {
                                                    'type': EFFECT_LASTING,
                                                    'params': {
                                                        'target': TARGET_THIS,
                                                        'until': TIME_PHASE,
                                                        'effect': {
                                                            'type': EFFECT_MODIFY_ATTACK_VALUE,
                                                            'params': {
                                                                'target': TARGET_THIS,
                                                                'count': 2
                                                            }
                                                        }
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
        '_id': 'leadership-ojo-de-halcon',
        'aspect': 'leadership',
        'order': 2,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Ojo de Halcón',
                'subtitle': 'Clint Barton',
                'set': 'leadership',
                'image': 'aspect/leadership/allies/01066.png',
                'traits': [
                    TRAIT_AVENGER
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'leadership',
                'thwart': 1,
                'attack': 1,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_THIS_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_PLACE_COUNTERS,
                                'params': {
                                    'counters': 4,
                                    'target': TARGET_THIS
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_MINION_ENTER_PLAY,
                            'arrow': {
                                'type': EFFECT_REMOVE_COUNTER,
                                'params': {
                                    'count': 1,
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'damage': 2,
                                    'target': TARGET_TRIGGERED_CARD
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
