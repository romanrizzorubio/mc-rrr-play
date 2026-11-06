import {
    CLASSIFICATION_PROTECTION,
    ABILITY_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESPONSE,
    ABILITY_RESPONSE,
    CALC_ALL,
    CALC_ATTACK,
    CARD_TYPE_EVENT,
    CHARACTER_VILLAIN,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CANCEL_BOOST_ICONS,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_HEAL,
    EFFECT_ENEMY_ATTACK,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_STUN,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_ATTACKER,
    TARGET_ENEMY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_HERO,
    TARGET_MAIN_SCHEME,
    TARGET_PLAYER,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TARGET_VILLAIN,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_DEFENSE,
    TRAIT_TACTIC,
    TRIGGER_BOOST_REVEALED,
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';

export default [
    {
        '_id': 'protection-contragolpe',
        'aspect': 'protection',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Contragolpe',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/01077.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'name': 'Contragolpe',
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'trigger': TRIGGER_ENEMY_ATTACKS_YOU,
                            'condition': {
                                'effect.isDefended': true,
                                'effect.defender.isHero': true
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ATTACKER,
                                    'paramsCalc': {
                                        'target': 'player.superhero.currentSide',
                                        'formula': CALC_ATTACK
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
        '_id': 'protection-poneos-detras-de-mi',
        'aspect': 'protection',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Poneos detrás de mí!',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/01078.png',
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'name': '¡Poneos detrás de mí!',
                            'trigger': TRIGGER_TREACHERY_REVEAL,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_CANCEL_ENCOUNTER,
                                            'params': {
                                                'target': TARGET_EFFECT
                                            }
                                        },
                                        {
                                            'type': EFFECT_ENEMY_ATTACK,
                                            'params': {
                                                'enemyType': CHARACTER_VILLAIN,
                                                'target': TARGET_PLAYER
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
        '_id': 'protection-defensa-habil',
        'aspect': 'protection',
        'order': 20,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Defensa hábil',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/03033.png',
                'traits': [
                    TRAIT_DEFENSE
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'name': 'Defensa hábil',
                            'labels': [
                                LABEL_DEFENSE
                            ],
                            'trigger': TRIGGER_HERO_DEFENDS_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                'params': {
                                    'requiresPrePlayConfirmation': true,
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
        '_id': 'protection-ataque-preventivo',
        'aspect': 'protection',
        'order': 30,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Ataque preventivo',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/05014.png',
                'traits': [
                    TRAIT_DEFENSE
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [
                                LABEL_DEFENSE
                            ],
                            'trigger': TRIGGER_BOOST_REVEALED,
                            'condition': {
                                'effect.enemyActivation.enemy.isVillain': true,
                                'effect.enemyActivation.isAttack': true,
                                'effect.hasCancelableBoostIcons': true
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_CANCEL_BOOST_ICONS,
                                            'params': {
                                                'requiresPrePlayConfirmation': true,
                                                'target': TARGET_YOU
                                            }
                                        },
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_VILLAIN,
                                                'paramsCalc': {
                                                    'target': 'cancelledBoostIcons',
                                                    'formula': CALC_ALL
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
        '_id': 'protection-arremetida',
        'aspect': 'protection',
        'order': 31,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Arremetida',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/05015.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_STUN,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'thenEffect': {
                                        'type': EFFECT_DO_IF_HAS_PAID,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'resources': [
                                                RESOURCE_PHYSICAL
                                            ],
                                            'effect': {
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
                        }
                    }
                ]
            }
        }
    },
{
        '_id': 'protection-fuerzas-de-flaqueza',
        'aspect': 'protection',
        'order': 60,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Fuerzas de flaqueza',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/06033.png',
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_MENTAL
                                    ],
                                    'target': TARGET_HERO,
                                    'effect': {
                                        'type': EFFECT_HEAL,
                                        'params': {
                                            'target': TARGET_HERO,
                                            'damage': 5
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_HEAL,
                                        'params': {
                                            'target': TARGET_HERO,
                                            'damage': 4
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
        '_id': 'protection-defensa-desesperada',
        'aspect': 'protection',
        'order': 90,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Defensa desesperada',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/09015.png',
                'traits': [
                    TRAIT_DEFENSE
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [
                                LABEL_DEFENSE
                            ],
                            'trigger': TRIGGER_HERO_DEFENDS_ATTACK,
                            'condition': {
                                'effect.defender.isHero': true
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'count': 2
                                            }
                                        },
                                        {
                                            'type': EFFECT_DELAYED,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'effect': {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effect.activation.takenDamage': 0
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_READY,
                                                            'params': {
                                                                'target': TARGET_YOUR_HERO
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
        '_id': 'protection-invertir-las-tornas',
        'aspect': 'protection',
        'order': 91,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Invertir las tornas',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/09016.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'arrow': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'target': TARGET_YOUR_SUPERHERO,
                                    'damage': 2
                                }
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'damage': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'protection-armarse-de-valor',
        'aspect': 'protection',
        'order': 120,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Armarse de valor',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/12032.png',
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': CLASSIFICATION_PROTECTION,
                'paramsToPlay': {
                    'superhero.traits': TRAIT_AVENGER
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'name': 'Armarse de valor',
                            'effect': {
                                'type': EFFECT_TOUGH,
                                'params': {
                                    'target': TARGET_FRIENDLY_CHARACTER,
                                    'multipleTarget': true,
                                    'selectUpTo': true,
                                    'targetCountCalc': {
                                        'target': 'match.villain.stage',
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
        '_id': 'protection-perseverancia',
        'aspect': 'protection',
        'order': 130,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Perseverancia',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/13033.png',
                'traits': [
                    TRAIT_TACTIC
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOUR_SUPERHERO_FLIPS,
                            'effect': {
                                'type': EFFECT_TOUGH,
                                'params': {
                                    'target': TARGET_YOUR_HERO
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'protection-ni-un-paso-atras',
        'aspect': 'protection',
        'order': 140,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Ni un paso atrás',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/14014.png',
                'traits': [TRAIT_DEFENSE],
                'cost': 1,
                'resources': [RESOURCE_PHYSICAL],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [LABEL_DEFENSE],
                            'trigger': TRIGGER_HERO_DEFENDS_ATTACK,
                            'condition': {
                                'effect.defender.isHero': true,
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'count': 2,
                                            },
                                        },
                                        {
                                            'type': EFFECT_DELAYED,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'effect': {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effect.activation.takenDamage': 0,
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_STUN,
                                                            'params': {
                                                                'target': TARGET_ATTACKER,
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
                    },
                ],
            },
        },
    },
    {
        '_id': 'protection-esquiva-lateral',
        'aspect': 'protection',
        'order': 141,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Esquiva lateral',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/14015.png',
                'traits': [TRAIT_DEFENSE],
                'cost': 1,
                'resources': [RESOURCE_MENTAL],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [LABEL_DEFENSE],
                            'trigger': TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                            'triggerParams': {
                                'target': TARGET_YOUR_SUPERHERO,
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_PREVENT_DAMAGE,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'damage': 3,
                                            },
                                        },
                                        {
                                            'type': EFFECT_DO_IF_HAS_PAID,
                                            'params': {
                                                'resources': [RESOURCE_ENERGY],
                                                'target': TARGET_ENEMY,
                                                'effect': {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 1,
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
        '_id': 'protection-maniobra-enganosa',
        'aspect': 'protection',
        'order': 150,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Maniobra engañosa',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/15030.png',
                'cost': 1,
                'resources': [RESOURCE_ENERGY],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'name': 'Maniobra engañosa',
                            'labels': [LABEL_THWART],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_ENEMY_ATTACK,
                                            'params': {
                                                'enemyType': CHARACTER_VILLAIN,
                                                'target': TARGET_YOU
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_THREAT,
                                            'params': {
                                                'target': TARGET_MAIN_SCHEME,
                                                'threat': 4
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
];
