import {
    CLASSIFICATION_AGGRESSION,
    ABILITY_CONSTANT,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_ACTION,
    ABILITY_RESPONSE,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_REMOVE_COUNTER,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ANY_PLAYER,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_PLAYER,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_ASGARD,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_YOU_DEFEAT_MINION
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-tac-team',
        'aspect': 'aggression',
        'order': 6,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Unidad táctica',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/supports/01056.png',
                'traits': [
                    TRAIT_SHIELD
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_THIS,
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_COUNTER,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'threat': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
{
        '_id': 'aggression-salon-de-los-heroes',
        'aspect': 'aggression',
        'order': 64,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Salón de los Héroes',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/supports/06017.png',
                'traits': [
                    TRAIT_ASGARD,
                    TRAIT_LOCATION
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOU_DEFEAT_MINION,
                            'effect': {
                                'type': EFFECT_PLACE_COUNTERS,
                                'params': {
                                    'target': TARGET_THIS,
                                    'counters': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_ALTEREGO_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_THIS,
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_COUNTER,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 3
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'target': TARGET_YOU,
                                    'count': 3
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-centro-de-entrenamiento',
        'aspect': 'aggression',
        'order': 13016,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Centro de entrenamiento',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/supports/13016.png',
                'traits': [
                    TRAIT_LOCATION
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'controllerTarget': TARGET_ANY_PLAYER,
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_CHARACTER_GET_ATTACK,
                            'triggerParams': {
                                'target': TARGET_ALL_ALLIES_YOU_CONTROL
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },

];
