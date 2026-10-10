import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_TREACHERY,
    CALC_COUNT,
    EFFECT_ADD_ADDITIONAL_COST,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_REMOVE_THREAT,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SPEND,
    EFFECT_LOOK_AT_TOP_CARDS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_PLAYERS,
    TARGET_ENCOUNTER_DECK,
    TARGET_TRIGGERED_CARD,
    TARGET_THIS,
    TARGET_SCHEME,
    TARGET_YOU,
    TIME_PHASE,
    TARGET_ROUND,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_DROID,
    TRAIT_SHIELD,
    TRIGGER_MINION_ENTER_PLAY,
    TRIGGER_ABILITY_COST,
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
                                'target': TARGET_ROUND
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
    ,
    {
        '_id': 'leadership-falcon',
        'aspect': 'leadership',
        'order': 20,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Halcón',
                'subtitle': 'Sam Wilson',
                'set': 'leadership',
                'image': 'aspect/leadership/allies/03011.png',
                'traits': [
                    TRAIT_AERIAL,
                    TRAIT_AVENGER
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'leadership',
                'thwart': 2,
                'attack': 2,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_LOOK_AT_TOP_CARDS,
                                            'params': {
                                                'target': TARGET_ENCOUNTER_DECK,
                                                'count': 3,
                                                'filter': {
                                                    'type': CARD_TYPE_TREACHERY
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_THREAT,
                                            'params': {
                                                'target': TARGET_SCHEME,
                                                'threat': 0,
                                                'paramsCalc': {
                                                    'target': 'effects.0.matchingCards',
                                                    'formula': CALC_COUNT
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
        '_id': 'leadership-squirrel-girl',
        'aspect': 'leadership',
        'order': 21,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Chica Ardilla',
                'subtitle': 'Doreen Green',
                'set': 'leadership',
                'image': 'aspect/leadership/allies/03013.png',
                'traits': [
                    TRAIT_AVENGER
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'leadership',
                'thwart': 1,
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
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ALL_ENEMIES,
                                    'damage': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'leadership-wonder-man',
        'aspect': 'leadership',
        'order': 22,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Hombre Maravilla',
                'subtitle': 'Simon Williams',
                'set': 'leadership',
                'image': 'aspect/leadership/allies/03014.png',
                'traits': [
                    TRAIT_AVENGER
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'leadership',
                'thwart': 1,
                'attack': 3,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_ABILITY_COST,
                            'effect': {
                                'type': EFFECT_ADD_ADDITIONAL_COST,
                                'params': {
                                    'sourceCardOnly': true,
                                    'abilityCondition': {
                                        'isBasic': true,
                                        'isAttack': true
                                    },
                                    'cost': {
                                        'type': EFFECT_SELECT_DISCARD_CARD,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'count': 1,
                                            'title': 'Descarta una carta de tu mano'
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
];
