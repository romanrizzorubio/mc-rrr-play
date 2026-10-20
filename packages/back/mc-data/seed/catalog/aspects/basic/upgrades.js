import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_RESOURCE,
    ABILITY_HERO_RESPONSE,
    ABILITY_INTERRUPT,
    CARD_TYPE_UPGRADE,
    EFFECT_CHAINED,
    EFFECT_ADD_TRAIT,
    EFFECT_CANCEL_BOOST_ABILITY,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_MODIFY_RECOVERY_VALUE,
    EFFECT_REMOVE_COUNTER,
    EFFECT_READY,
    EFFECT_SPEND,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_ANY_PLAYER,
    TARGET_EFFECT,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_PLAYER,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TARGET_YOUR_HERO,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_PREPARATION,
    TRAIT_SKILL,
    TRAIT_SPY,
    TRAIT_TITLE,
    TRAIT_MYSTIC,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_BOOST_REVEALED,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS,
    TRIGGER_GET_HAND_SIZE,
    TRIGGER_YOUR_ALTEREGO_GET_RECOVERY,
    TRIGGER_SURGE,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-tenacity',
        'aspect': 'basic',
        'order': 10,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Tenacidad',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/b93-copy-2.webp',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_CARD,
                                    'effects': [
                                        {
                                            'type': EFFECT_SPEND,
                                            'params': {
                                                'resources': [
                                                    RESOURCE_PHYSICAL
                                                ]
                                            }
                                        },
                                        {
                                            'type': EFFECT_DISCARD_GAME,
                                            'params': {
                                                'target': TARGET_CARD
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_READY,
                                'params': {
                                    'target': TARGET_PLAYER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-honorary-avenger',
        'aspect': 'basic',
        'order': 20,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Vengador honorario',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/03025.png',
                'traits': [
                    TRAIT_TITLE
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'attach': TARGET_FRIENDLY_CHARACTER,
                'maxAttach': 1,
                'paramsToPlay': {
                    'traits': TRAIT_AVENGER
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_CHARACTER_GET_HIT_POINTS,
                            'effect': {
                                'type': EFFECT_MODIFY_HIT_POINTS,
                                'params': {
                                    'target': TARGET_ATTACHED,
                                    'count': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_CONDITION_GET_TRAITS,
                            'effect': {
                                'type': EFFECT_ADD_TRAIT,
                                'params': {
                                    'target': TARGET_ATTACHED,
                                    'trait': TRAIT_AVENGER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-enhanced-awareness',
        'aspect': 'basic',
        'order': 21,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Consciencia mejorada',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/03034.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESOURCE,
                        'params': {
                            'resource': RESOURCE_MENTAL,
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
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-aguante',
        'aspect': 'basic',
        'order': 30,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Aguante',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/05023.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'controllerTarget': TARGET_ANY_PLAYER,
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_YOUR_HERO_GET_HIT_POINTS,
                            'effect': {
                                'type': EFFECT_MODIFY_HIT_POINTS,
                                'params': {
                                    'target': TARGET_YOUR_SUPERHERO,
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
        '_id': 'basic-reflejos-mejorados',
        'aspect': 'basic',
        'order': 31,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Reflejos mejorados',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/05024.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESOURCE,
                        'params': {
                            'resource': RESOURCE_ENERGY,
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
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-tomarse-un-respiro',
        'aspect': 'basic',
        'order': 32,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Tomarse un respiro',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/05033.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'controllerTarget': TARGET_ANY_PLAYER,
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_YOUR_ALTEREGO_GET_RECOVERY,
                            'effect': {
                                'type': EFFECT_MODIFY_RECOVERY_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
{
        '_id': 'basic-vigor-mejorado',
        'aspect': 'basic',
        'order': 62,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Vigor mejorado',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/06034.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESOURCE,
                        'params': {
                            'resource': RESOURCE_PHYSICAL,
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
                            }
                        }
                    }
                ]
            }
        }
    },

    {
        '_id': 'basic-objetivo-fijado',
        'aspect': 'basic',
        'order': 63,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Objetivo fijado',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/08024.png',
                'traits': [
                    TRAIT_PREPARATION,
                    TRAIT_SKILL
                ],
                'cost': 1,
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
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_BOOST_REVEALED,
                            'condition': {
                                'effect.hasBoostAbility': true
                            },
                            'arrow': {
                                'type': EFFECT_DISCARD_GAME,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_CANCEL_BOOST_ABILITY,
                                'params': {
                                    'target': TARGET_EFFECT
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-espionaje',
        'aspect': 'basic',
        'order': 64,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Espionaje',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/08033.png',
                'traits': [
                    TRAIT_PREPARATION,
                    TRAIT_SKILL
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'paramsToPlay': {
                    'friends.*.traits': TRAIT_SPY
                },
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_SURGE,
                            'arrow': {
                                'type': EFFECT_DISCARD_GAME,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'target': TARGET_YOU,
                                    'count': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-el-hechicero-supremo',
        'aspect': 'basic',
        'order': 90,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'El Hechicero Supremo',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/09026.png',
                'unique': true,
                'traits': [
                    TRAIT_TITLE
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'paramsToPlay': {
                    'traits': TRAIT_MYSTIC
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_GET_HAND_SIZE,
                            'triggerParams': {
                                'target': TARGET_YOUR_HERO
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_HAND_SIZE,
                                'params': {
                                    'target': TARGET_YOUR_HERO,
                                    'count': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
