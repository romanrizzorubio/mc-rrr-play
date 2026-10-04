import {
    ABILITY_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
    CALC_IF,
    CALC_MULTIPLY_2,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_HERO,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_HEAL,
    EFFECT_MAY,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_TRAITS,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SPEND,
    EFFECT_SPEND_X,
    EFFECT_STUN,
    EFFECT_SURGE,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ACTIVATION,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ANY_PLAYER,
    TARGET_CARD,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TIME_ROUND,
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_ELITE,
    TRAIT_KREE,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRAIT_SOLDIER,
    TRAIT_SPY,
    TRAIT_SUPERPOWER,
    TRAIT_TECH,
    TRAIT_THWART,
    TRIGGER_CONDITION_GET_DEFENSE,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_INSTANT,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_YOU_WOULD_TAKE_DAMAGE
} from 'mc-shared';

export default {
    '_id': 'captain-marvel',
    'order': 0,
    'name': 'Capitana Marvel',
    'folder': 'captain-marvel',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Carol Danvers',
                    'set': 'Captain Marvel',
                    'image': 'heroes/captain-marvel/carol0a.webp',
                    'traits': [
                        TRAIT_SHIELD,
                        TRAIT_SOLDIER
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 4,
                    'handSize': 6,
                    'hitPoints': 12,
                    'abilities': [
                        {
                            'type': ABILITY_ACTION,
                            'params': {
                                'name': 'Comandante',
                                'limit': {
                                    'count': 1,
                                    'time': TIME_ROUND
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
            },
            {
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Capitana Marvel',
                    'set': 'Captain Marvel',
                    'image': 'heroes/captain-marvel/carol0b.webp',
                    'traits': [
                        TRAIT_AVENGER,
                        TRAIT_SOLDIER
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 2,
                    'attack': 2,
                    'defense': 1,
                    'handSize': 5,
                    'hitPoints': 12,
                    'abilities': [
                        {
                            'type': ABILITY_ACTION,
                            'params': {
                                'name': 'Redirigir energía',
                                'limit': {
                                    'count': 1,
                                    'time': TIME_ROUND
                                },
                                'arrow': {
                                    'type': EFFECT_CHAINED,
                                    'params': {
                                        'effects': [
                                            {
                                                'type': EFFECT_SPEND,
                                                'params': {
                                                    'resources': [
                                                        RESOURCE_ENERGY
                                                    ]
                                                }
                                            },
                                            {
                                                'type': EFFECT_HEAL,
                                                'params': {
                                                    'damage': 1,
                                                    'target': TARGET_YOU
                                                }
                                            }
                                        ]
                                    }
                                },
                                'effect': {
                                    'type': EFFECT_DRAW_CARD,
                                    'params': {
                                        'target': TARGET_YOU
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ],
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ALLY,
                    'params': {
                        'name': 'Spider Woman',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol1.webp',
                        'traits': [
                            TRAIT_AVENGER,
                            TRAIT_SPY
                        ],
                        'unique': true,
                        'cost': 3,
                        'resources': [
                            RESOURCE_WILD
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'subtitle': 'Jessica Drew',
                        'thwart': 2,
                        'attack': 2,
                        'thwartConsequencial': 1,
                        'attackConsequencial': 1,
                        'hitPoints': 2,
                        'abilities': [
                            {
                                'type': ABILITY_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_THIS_ENTER_PLAY,
                                    'effect': {
                                        'type': EFFECT_CONFUSE,
                                        'params': {
                                            'target': TARGET_VILLAIN
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Evitar una crisis',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol2.webp',
                        'traits': [
                            TRAIT_THWART
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'labels': [
                                        LABEL_THWART
                                    ],
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_SCHEME,
                                            'effects': [
                                                {
                                                    'type': EFFECT_REMOVE_THREAT,
                                                    'params': {
                                                        'threat': 2,
                                                        'target': TARGET_SCHEME,
                                                        'thenEffect': {
                                                            'type': EFFECT_DO_IF_HAS_TRAITS,
                                                            'params': {
                                                                'target': TARGET_YOUR_HERO,
                                                                'traits': [
                                                                    TRAIT_AERIAL
                                                                ],
                                                                'effect': {
                                                                    'type': EFFECT_REMOVE_THREAT,
                                                                    'params': {
                                                                        'threat': 2,
                                                                        'target': TARGET_SCHEME,
                                                                        'excludeTarget': 'effects.0.selectedTarget'
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
                'count': 3,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Rayo fotónico',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol5.webp',
                        'traits': [
                            TRAIT_ATTACK,
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 3,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
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
                                                        'damage': 5,
                                                        'target': TARGET_ENEMY
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DO_IF_HAS_PAID,
                                                    'params': {
                                                        'resources': [
                                                            RESOURCE_ENERGY
                                                        ],
                                                        'effect': {
                                                            'type': EFFECT_DRAW_CARD,
                                                            'params': {
                                                                'target': TARGET_YOU
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_RESOURCE,
                    'params': {
                        'name': 'Absorción de Energía',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol8.webp',
                        'resources': [
                            RESOURCE_ENERGY,
                            RESOURCE_ENERGY,
                            RESOURCE_ENERGY
                        ],
                        'classification': 'Captain Marvel'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SUPPORT,
                    'params': {
                        'name': 'Base orbital de Alpha Flight',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol10.webp',
                        'traits': [
                            TRAIT_LOCATION,
                            TRAIT_SHIELD
                        ],
                        'unique': true,
                        'cost': 1,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_CARD,
                                                        'title': 'Agotar la Base'
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_SELECT_DISCARD_CARD,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                        'title': 'Descartar una carta'
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DRAW_CARD,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'paramsCalc': {
                                                'target': 'player.isAlterEgo',
                                                'formula': CALC_IF,
                                                'ifTrue': 2,
                                                'ifFalse': 1
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Casco de la Capitana Marvel',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol11.webp',
                        'traits': [
                            TRAIT_ARMOR,
                            TRAIT_TECH
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'unique': true,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_CONDITION_GET_DEFENSE,
                                    'triggerParams': {
                                        'conditionTrigger': {
                                            'name': 'Capitana Marvel'
                                        },
                                        'conditionSource': 'effect.selectedTarget'
                                    },
                                    'effect': {
                                        'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'count': 1
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_CONDITION_GET_DEFENSE,
                                    'triggerParams': {
                                        'conditionTrigger': {
                                            'name': 'Capitana Marvel'
                                        },
                                        'conditionSource': 'effect.selectedTarget'
                                    },
                                    'effect': {
                                        'type': EFFECT_DO_IF_HAS_TRAITS,
                                        'params': {
                                            'target': TARGET_YOUR_HERO,
                                            'traits': [
                                                TRAIT_AERIAL
                                            ],
                                            'effect': {
                                                'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                                'params': {
                                                    'target': TARGET_EFFECT,
                                                    'characterTarget': TARGET_YOUR_HERO,
                                                    'count': 1
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Vuelo cósmico',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol12.webp',
                        'traits': [
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_CONDITION_GET_TRAITS,
                                    'triggerParams': {
                                        'conditionTrigger': {
                                            'name': 'Capitana Marvel'
                                        },
                                        'conditionSource': 'effect.selectedTarget'
                                    },
                                    'effect': {
                                        'type': EFFECT_MODIFY_TRAITS,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'traits': [
                                                TRAIT_AERIAL
                                            ]
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_HERO_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_YOU_WOULD_TAKE_DAMAGE,
                                    'labels': [
                                        LABEL_DEFENSE
                                    ],
                                    'arrow': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_CARD
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_PREVENT_DAMAGE,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'damage': 3
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Canalizar energía',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/carol14.webp',
                        'traits': [
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 0,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'maximum': {
                            'count': 1
                        },
                        'abilities': [
                            {
                                'type': ABILITY_ACTION,
                                'params': {
                                    'name': 'Cargar',
                                    'arrow': {
                                        'type': EFFECT_SPEND_X,
                                        'params': {
                                            'resourceType': RESOURCE_ENERGY
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_PLACE_COUNTERS,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'paramsCalc': {
                                                'target': 'effect.ability.arrow.cost.paid',
                                                'formula': CALC_COUNT
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'name': 'Disparar',
                                    'labels': [
                                        LABEL_ATTACK
                                    ],
                                    'arrow': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'saveData': [
                                                'counters'
                                            ]
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'paramsCalc': {
                                                'target': 'effect.ability.arrow.cost.savedData.counters',
                                                'formula': CALC_MULTIPLY_2,
                                                'max': 10
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ],
        'precon': [
            {
                'aspect': 'basic',
                'cardRefs': [
                    {'id': 'basic-mockingbird', 'count': 1},
                    {'id': 'basic-nick-fury', 'count': 1},
                    {'id': 'basic-emergency', 'count': 1},
                    {'id': 'basic-first-aid', 'count': 1},
                    {'id': 'basic-haymaker', 'count': 1},
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-genius', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-avengers-mansion', 'count': 1},
                    {'id': 'basic-helicarrier', 'count': 1},
                    {'id': 'basic-tenacity', 'count': 1},
                ],
            },
            {
                'aspect': 'aggression',
                'cardRefs': [
                    {
                        'id': 'aggression-hulk',
                        'count': 1
                    },
                    {
                        'id': 'aggression-tigra',
                        'count': 1
                    },
                    {
                        'id': 'aggression-a-por-ellos',
                        'count': 2
                    },
                    {
                        'id': 'aggression-asalto-implacable',
                        'count': 2
                    },
                    {
                        'id': 'aggression-gancho',
                        'count': 2
                    },
                    {
                        'id': 'aggression-the-power-of-aggression',
                        'count': 2
                    },
                    {
                        'id': 'aggression-tac-team',
                        'count': 2
                    },
                    {
                        'id': 'aggression-entrenamiento-de-combate',
                        'count': 2
                    }
                ]
            },
        ],
        'obligation': {
            'count': 1,
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'Emergencia familiar',
                    'set': 'Captain Marvel',
                    'image': 'heroes/captain-marvel/caroln0.webp',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Convertirte en Carol Danvers',
                                'effect': {
                                    'type': EFFECT_MAY,
                                    'params': {
                                        'effect': {
                                            'type': EFFECT_FLIP,
                                            'params': {
                                                'target': TARGET_YOUR_SUPERHERO,
                                                'formTarget': TARGET_ALTEREGO_SIDE
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Resolver la obligación',
                                'effect': {
                                    'type': EFFECT_CHOOSE_ABILITY,
                                    'params': {
                                        'options': [
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Agotar a Carol Danvers para retirar la Obligación',
                                                    'effect': {
                                                        'type': EFFECT_REMOVE_CARD,
                                                        'params': {
                                                            'target': TARGET_CARD
                                                        }
                                                    },
                                                    'arrow': {
                                                        'type': EFFECT_EXHAUST,
                                                        'params': {
                                                            'target': TARGET_ALTEREGO
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Quedar aturdido y Oleada para descartar la Obligación',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_STUN,
                                                                    'params': {
                                                                        'target': TARGET_YOU
                                                                    }
                                                                },
                                                                {
                                                                    'type': EFFECT_SURGE
                                                                },
                                                                {
                                                                    'type': EFFECT_DISCARD_GAME,
                                                                    'params': {
                                                                        'target': TARGET_CARD
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
        'nemesis': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'El psicomagnetrón',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/caroln1.webp',
                        'boost': 3,
                        'icons': {
                            'hazard': 1
                        },
                        'startingThreat': 3,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'threat': [
                                                1,
                                                true
                                            ],
                                            'target': TARGET_CARD
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Yon-Rogg',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/caroln2.webp',
                        'boost': 2,
                        'hitPoints': 5,
                        'attack': 3,
                        'scheme': 2,
                        'unique': true,
                        'traits': [
                            TRAIT_ELITE,
                            TRAIT_KREE
                        ],
                        'nemesis': true,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_THIS_ATTACK,
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'threat': 1,
                                            'target': TARGET_CONDITION_CARD,
                                            'condition': {
                                                'name': 'El psicomagnetrón'
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Manipulador kree',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/caroln3.webp',
                        'keywords': {
                            'surge': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_MAIN_SCHEME,
                                            'threat': 1
                                        }
                                    }
                                }
                            }
                        ],
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'effect': {
                                    'type': EFFECT_DO_IF,
                                    'params': {
                                        'target': TARGET_ACTIVATION,
                                        'condition': {
                                            'activation.isAttack': true,
                                            'activation.character.isVillain': true,
                                            'activation.isDefended': false
                                        },
                                        'effect': {
                                            'type': EFFECT_PLACE_THREAT,
                                            'params': {
                                                'target': TARGET_MAIN_SCHEME,
                                                'threat': 1
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'La traición de Yon-Rogg',
                        'set': 'Captain Marvel',
                        'image': 'heroes/captain-marvel/caroln5.webp',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DISCARD_CONDITION_HAND,
                                        'params': {
                                            'condition': {
                                                'resources': [
                                                    RESOURCE_ENERGY
                                                ]
                                            }
                                        }
                                    },
                                    'ifNot': {
                                        'type': EFFECT_SURGE,
                                        'params': {}
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]
    }
};
