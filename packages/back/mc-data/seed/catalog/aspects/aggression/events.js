import {
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_RESPONSE,
    CALC_STAGE,
    CARD_TYPE_EVENT,
    CLASSIFICATION_AGGRESSION,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_REMOVE_THREAT,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_ENEMY_ATTACK,
    EFFECT_HEAL,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_MINION,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ATTACK,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_SKILL,
    TRAIT_THWART,
    TRAIT_WEAPON,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-a-por-ellos',
        'aspect': 'aggression',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'A por ellos',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/01052.png',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'trigger': TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'threat': 2,
                                    'target': TARGET_SCHEME
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-asalto-implacable',
        'aspect': 'aggression',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Asalto implacable',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/01053.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_PHYSICAL
                                    ],
                                    'target': TARGET_MINION,
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 5,
                                            'keywords': {
                                                'overkill': true
                                            }
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 5
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
        '_id': 'aggression-gancho',
        'aspect': 'aggression',
        'order': 4,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Gancho',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/01054.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'damage': 5
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-aprovechar-la-ventaja',
        'aspect': 'aggression',
        'order': 40,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Aprovechar la ventaja',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/04043.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'damage': 2
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'condition': [
                                                    {
                                                        'effects.0.selectedTarget.isStunned': true
                                                    },
                                                    {
                                                        'effects.0.selectedTarget.isConfused': true
                                                    }
                                                ],
                                                'effect': {
                                                    'type': EFFECT_DRAW_CARD,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                        'count': 1
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
        '_id': 'aggression-golpe-imparable',
        'aspect': 'aggression',
        'order': 41,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Golpe imparable',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/04044.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'damage': 3,
                                    'keywords': {
                                        'piercing': true
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
        '_id': 'aggression-cuerpo-a-cuerpo',
        'aspect': 'aggression',
        'order': 30,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Cuerpo a cuerpo',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/05030.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'damage': 3
                                            }
                                        },
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'damage': 3,
                                                'excludeTarget': 'effects.0.selectedTarget'
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
        '_id': 'aggression-ven-aqui',
        'aspect': 'aggression',
        'order': 62,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Ven aquí!',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/06014.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_MINION,
                                                'damage': 1
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF_HAS_TRAITS,
                                            'params': {
                                                'target': TARGET_YOUR_HERO,
                                                'traits': [
                                                    TRAIT_AERIAL
                                                ],
                                                'effect': {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effects.0.selectedTarget.isInPlay': true
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_ENGAGE,
                                                            'params': {
                                                                'target': TARGET_YOU,
                                                                'cardSource': 'effects.0.selectedTarget'
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
        '_id': 'aggression-golpetazo',
        'aspect': 'aggression',
        'order': 63,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Golpetazo',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/06015.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_YOU_BASIC_ATTACK,
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO,
                                    'condition': {
                                        'traits': TRAIT_WEAPON
                                    }
                                }
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
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
        '_id': 'aggression-golpe-diestro',
        'aspect': 'aggression',
        'order': 90,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Golpe diestro',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/09037.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_YOU_BASIC_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
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
        '_id': 'aggression-patada-doble-voladora',
        'aspect': 'aggression',
        'order': 100,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Patada doble voladora',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/10014.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'damage': 4
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF_HAS_PAID,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'resources': [
                                                    RESOURCE_PHYSICAL
                                                ],
                                                'exclusive': true,
                                                'effect': {
                                                    'type': EFFECT_SIMULTANEOUS,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'effects': [
                                                            {
                                                                'type': EFFECT_STUN,
                                                                'params': {
                                                                    'target': TARGET_ENEMY
                                                                }
                                                            },
                                                            {
                                                                'type': EFFECT_DRAW_CARD,
                                                                'params': {
                                                                    'target': TARGET_YOU,
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
        '_id': 'aggression-cara-a-cara',
        'aspect': 'aggression',
        'order': 101,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Cara a cara',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/10015.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_ENEMY_ATTACK,
                                            'params': {
                                                'enemyType': TARGET_ENEMY,
                                                'target': TARGET_YOU,
                                                'enemyTargetEffect': 'effects.1',
                                            }
                                        },
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_SOURCE,
                                                'source': 'effects.0.enemyTargets',
                                                'condition': {
                                                    'isInPlay': true
                                                },
                                                'damage': 5,
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
        '_id': 'aggression-pagaras-por-eso',
        'aspect': 'aggression',
        'order': 102,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Pagarás por eso!',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/10016.png',
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'trigger': TRIGGER_CHARACTER_TAKES_DAMAGE,
                            'triggerParams': {
                                'target': TARGET_YOUR_SUPERHERO
                            },
                            'condition': {
                                'effect.isAttack': true,
                                'effect.activation.character.isVillain': true
                            },
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'target': TARGET_SCHEME,
                                    'threat': 0,
                                    'paramsCalc': {
                                        'target': 'triggeredTargetDamage',
                                        'max': 5
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
        '_id': 'aggression-momento-triunfal',
        'aspect': 'aggression',
        'order': 103,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Momento triunfal',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/12030.png',
                'cost': 0,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
                            'effect': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'target': TARGET_YOUR_HERO,
                                    'paramsCalc': {
                                        'target': 'attack.excessDamage'
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
        '_id': 'aggression-entrar-en-combate',
        'aspect': 'aggression',
        'order': 13013,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Entrar en combate',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/13013.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_MINION,
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_MINION,
                                                'damage': 6
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_THREAT,
                                            'params': {
                                                'target': TARGET_MAIN_SCHEME,
                                                'threat': 0,
                                                'paramsCalc': {
                                                    'target': 'effects.0.activation.excessDamage'
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
        '_id': 'aggression-ataque-sorpresa',
        'aspect': 'aggression',
        'order': 13014,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Ataque sorpresa',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/13014.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'trigger': TRIGGER_YOUR_SUPERHERO_FLIPS,
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_PHYSICAL
                                    ],
                                    'target': TARGET_ENEMY,
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'damage': 4
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'damage': 3
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
        '_id': 'aggression-amedrentar',
        'aspect': 'aggression',
        'order': 15028,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Amedrentar',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/15028.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'paramsToPlay': {
                    'superhero.traits': TRAIT_AVENGER
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_VILLAIN,
                                    'damage': 2,
                                    'additionalDamageCalc': {
                                        'target': TARGET_VILLAIN,
                                        'formula': CALC_STAGE,
                                        'max': 3
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
        '_id': 'aggression-buscando-problemas',
        'aspect': CLASSIFICATION_AGGRESSION,
        'order': 16043,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Buscando problemas',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/events/16043.png',
                'traits': [TRAIT_THWART],
                'cost': 0,
                'resources': [RESOURCE_PHYSICAL],
                'classification': CLASSIFICATION_AGGRESSION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [LABEL_THWART],
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_DISCARD_UNTIL,
                                            'params': {
                                                'target': TARGET_ENCOUNTER_DECK,
                                                'condition': {
                                                    'isMinion': true,
                                                },
                                                'showDiscardedCards': true,
                                            },
                                        },
                                        {
                                            'type': EFFECT_ENGAGE,
                                            'params': {
                                                'target': TARGET_YOU,
                                                'cardSource': 'selectedCard',
                                            },
                                        },
                                    ],
                                    'outputParams': ['selectedCard'],
                                },
                            },
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'target': TARGET_MAIN_SCHEME,
                                    'threat': 3,
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
];
