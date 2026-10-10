import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    CARD_TYPE_ANY,
    CARD_TYPE_ALLY,
    CARD_TYPE_SUPPORT,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_LASTING,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_MAX_ALLIES,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ANY_PLAYER,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_PHASE,
    TARGET_PLAYER,
    TIME_PHASE,
    TRAIT_AVENGER,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_PHASE_ENDS,
    TRIGGER_PLAY_CARD,
    TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-avengers-mansion',
        'aspect': 'basic',
        'order': 0,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Mansión de los Vengadores',
                'set': 'basic',
                'image': 'aspect/basic/supports/b91-copy-2.webp',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_LOCATION
                ],
                'cost': 4,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_CARD
                                }
                            },
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'target': TARGET_ANY_PLAYER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-avengers-tower',
        'aspect': 'basic',
        'order': 20,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Torre de los Vengadores',
                'set': 'basic',
                'image': 'aspect/basic/supports/03024.png',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_LOCATION
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES,
                            'condition': {
                                'player.allies': {
                                    'every': {
                                        'traits': TRAIT_AVENGER
                                    }
                                }
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_MAX_ALLIES,
                                'params': {
                                    'count': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_CARD
                                }
                            },
                            'effect': {
                                'type': EFFECT_LASTING,
                                'params': {
                                    'target': TARGET_PLAYER,
                                    'until': TIME_PHASE,
                                    'triggerType': TRIGGER_PLAY_CARD,
                                    'limit': {
                                        'count': 1,
                                        'target': TARGET_PHASE
                                    },
                                    'condition': {
                                        'effect.card.isAlly': true,
                                        'effect.card.traits': TRAIT_AVENGER
                                    },
                                    'hideDialog': true,
                                    'effect': {
                                        'type': EFFECT_MODIFY_COST,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'cardType': CARD_TYPE_ALLY,
                                            'count': -1
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
        '_id': 'basic-helicarrier',
        'aspect': 'basic',
        'order': 1,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Helitransporte',
                'set': 'basic',
                'image': 'aspect/basic/supports/b92-copy-2.webp',
                'traits': [
                    TRAIT_SHIELD,
                    TRAIT_LOCATION
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_CARD
                                }
                            },
                            'effect': {
                                'type': EFFECT_LASTING,
                                'params': {
                                    'target': TARGET_PLAYER,
                                    'until': [
                                        TRIGGER_END_PLAY_CARD,
                                        TRIGGER_PHASE_ENDS
                                    ],
                                    'triggerType': TRIGGER_PLAY_CARD,
                                    'hideDialog': true,
                                    'effect': {
                                        'type': EFFECT_MODIFY_COST,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'cardType': CARD_TYPE_ANY,
                                            'count': -1
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
];
