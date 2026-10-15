import {
    ABILITY_FORCED_RESPONSE,
    ABILITY_CONSTANT,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CALC_COUNT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_HEAL,
    EFFECT_MODIFY_COST,
    EFFECT_SIMULTANEOUS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_MINION,
    TARGET_THIS,
    TRAIT_ASGARD,
    TRAIT_AVENGER,
    TRAIT_GAMMA,
    TRAIT_OLYMPUS,
    TRIGGER_PLAY_CARD,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_THIS_DEFEAT_MINION
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-hulk',
        'aspect': 'aggression',
        'order': 0,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Hulk',
                'set': 'aggression',
                'image': 'aspect/aggression/allies/a50.webp',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_GAMMA
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'subtitle': 'Bruce Banner',
                'thwart': null,
                'attack': 3,
                'thwartConsequential': null,
                'attackConsequential': 1,
                'hitPoints': 5,
                'abilities': [
                    {
                        'type': ABILITY_FORCED_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_ATTACK,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_DISCARD_FROM_DECK
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'p'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 2
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'e'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ALL_CHARACTERS,
                                                        'damage': 1
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'm'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_DISCARD_GAME,
                                                    'params': {
                                                        'target': TARGET_THIS
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'w'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_SIMULTANEOUS,
                                                    'params': {
                                                        'effects': [
                                                            {
                                                                'type': EFFECT_DEAL_DAMAGE,
                                                                'params': {
                                                                    'target': TARGET_ENEMY,
                                                                    'damage': 2
                                                                }
                                                            },
                                                            {
                                                                'type': EFFECT_DEAL_DAMAGE,
                                                                'params': {
                                                                    'target': TARGET_ALL_CHARACTERS,
                                                                    'damage': 1
                                                                }
                                                            },
                                                            {
                                                                'type': EFFECT_DISCARD_GAME,
                                                                'params': {
                                                                    'target': TARGET_THIS
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
        '_id': 'aggression-tigra',
        'aspect': 'aggression',
        'order': 1,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Tigra',
                'set': 'aggression',
                'image': 'aspect/aggression/allies/a51.webp',
                'traits': [
                    TRAIT_AVENGER
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'subtitle': 'Greer Grant Nelson',
                'thwart': 1,
                'attack': 2,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_DEFEAT_MINION,
                            'effect': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'target': TARGET_THIS,
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
        '_id': 'aggression-hercules',
        'aspect': 'aggression',
        'order': 60,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Hércules',
                'set': 'aggression',
                'image': 'aspect/aggression/allies/06011.png',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_OLYMPUS
                ],
                'unique': true,
                'cost': 6,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'thwart': 1,
                'attack': 3,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 4,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'workInHand': true,
                            'trigger': TRIGGER_PLAY_CARD,
                            'condition': {
                                'card.name': 'Hércules'
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_COST,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 0,
                                    'paramsCalc': {
                                        'target': 'player.minions',
                                        'formula': CALC_COUNT,
                                        'multiply': -1
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
        '_id': 'aggression-valquiria',
        'aspect': 'aggression',
        'order': 61,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Valquiria',
                'set': 'aggression',
                'image': 'aspect/aggression/allies/06012.png',
                'traits': [
                    TRAIT_ASGARD,
                    TRAIT_AVENGER
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'thwart': 1,
                'attack': 2,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_ENERGY
                                    ],
                                    'target': TARGET_MINION,
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 3
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 2
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
