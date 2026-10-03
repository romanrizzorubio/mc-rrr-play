import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_OPTION,
    ABILITY_RESOURCE,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
    CALC_RESOURCES,
    CALC_TRAITS_COUNT,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_HERO,
    EFFECT_ADD_TRAIT,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_GENERATE_RESOURCES_FROM_CARD,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SELECT_FROM_TOP_DECK,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_SCHEMES,
    TARGET_ALL_PLAYERS,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ATTACK_UNDEFENDED,
    TARGET_BY_TITLE,
    TARGET_CARD,
    TARGET_HERO,
    TARGET_PLAYER_DISCARD,
    TARGET_SCHEME,
    TARGET_TOP_CARD,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TIME_PHASE,
    TIME_ROUND,
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_CRIMINAL,
    TRAIT_GENIUS,
    TRAIT_INDIVIDUAL,
    TRAIT_ITEM,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRAIT_SOLDIER,
    TRAIT_SUPERPOWER,
    TRAIT_TECH,
    TRIGGER_INSTANT,
    TRIGGER_YOUR_HERO_GET_HAND_SIZE,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS, TARGET_ENEMY
} from 'mc-shared';

export default {
    '_id': 'ironman',
    'order': 3,
    'name': 'Ironman',
    'folder': 'ironman',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Tony Stark',
                    'traits': [
                        TRAIT_GENIUS
                    ],
                    'abilities': [
                        {
                            'type': ABILITY_ALTEREGO_ACTION,
                            'params': {
                                'name': 'Visión de futuro',
                                'limit': {
                                    'count': 1,
                                    'time': TIME_ROUND
                                },
                                'effect': {
                                    'type': EFFECT_SELECT_FROM_TOP_DECK,
                                    'params': {
                                        'count': 3,
                                        'selectCount': 1,
                                        'title': 'Elige 1 carta para añadir a tu mano'
                                    }
                                }
                            }
                        }
                    ],
                    'handSize': 6,
                    'hitPoints': 9,
                    'recovery': 3,
                    'image': 'heroes/iron-man/01029b.png'
                }
            },
            {
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Iron Man',
                    'traits': [
                        TRAIT_AVENGER
                    ],
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_YOUR_HERO_GET_HAND_SIZE,
                                'effect': {
                                    'type': EFFECT_MODIFY_HAND_SIZE,
                                    'params': {
                                        'target': TARGET_HERO,
                                        'paramsCalc': {
                                            'formula': CALC_TRAITS_COUNT,
                                            'target': 'player.gameZone.cards',
                                            'trait': TRAIT_TECH,
                                            'max': 7
                                        }
                                    }
                                }
                            }
                        }
                    ],
                    'handSize': 1,
                    'hitPoints': 9,
                    'thwart': 2,
                    'attack': 1,
                    'defense': 1,
                    'image': 'heroes/iron-man/01029a.png'
                }
            }
        ],
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ALLY,
                    'params': {
                        'name': 'Máquina de Guerra',
                        'subtitle': 'James Rhodes',
                        'unique': true,
                        'traits': [
                            TRAIT_SHIELD,
                            TRAIT_SOLDIER
                        ],
                        'cost': 4,
                        'resources': [
                            RESOURCE_WILD
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'thwart': 1,
                        'thwartConsequencial': 1,
                        'attack': 2,
                        'attackConsequencial': 2,
                        'hitPoints': 4,
                        'abilities': [
                            {
                                'type': ABILITY_ACTION,
                                'params': {
                                    'name': 'Acción de Máquina de Guerra',
                                    'arrow': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_THIS
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_TAKE_DAMAGE,
                                                    'params': {
                                                        'damage': 2,
                                                        'target': TARGET_THIS
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'damage': 1,
                                            'target': TARGET_ALL_ENEMIES
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01030.png'
                    }
                }
            },
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Rayo repulsor',
                        'traits': [
                            TRAIT_ATTACK,
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
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
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_FROM_DECK,
                                                    'count': 5,
                                                    'target': TARGET_YOUR_SUPERHERO
                                                },
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'damage': 1,
                                                    'target': TARGET_ENEMY,
                                                    'paramsCalc': {
                                                        'formula': CALC_RESOURCES,
                                                        'resourceType': RESOURCE_ENERGY,
                                                        'strict': true,
                                                        'target': 'effects.0.cards',
                                                        'multiply': 2,
                                                        'plus': 1
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01031.png'
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Puñetazo supersónico',
                        'traits': [
                            TRAIT_ATTACK
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'labels': [
                                        LABEL_ATTACK
                                    ],
                                    'effect': {
                                        'type': EFFECT_DO_IF_HAS_TRAITS,
                                        'params': {
                                            'traits': [
                                                TRAIT_AERIAL
                                            ],
                                            'target': TARGET_HERO,
                                            'effect': {
                                                'type': EFFECT_DEAL_DAMAGE,
                                                'damage': 8,
                                                'target': TARGET_ENEMY
                                            },
                                            'effectNot': {
                                                'type': EFFECT_DEAL_DAMAGE,
                                                'damage': 4,
                                                'target': TARGET_ENEMY
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01032.png'
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Guanteletes potenciados',
                        'traits': [
                            TRAIT_ARMOR,
                            TRAIT_TECH
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'labels': [
                                        LABEL_ATTACK
                                    ],
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DO_IF_HAS_TRAITS,
                                        'params': {
                                            'traits': [
                                                TRAIT_AERIAL
                                            ],
                                            'target': TARGET_HERO,
                                            'effect': {
                                                'type': EFFECT_DEAL_DAMAGE,
                                                'damage': 2,
                                                'target': TARGET_ENEMY
                                            },
                                            'effectNot': {
                                                'type': EFFECT_DEAL_DAMAGE,
                                                'damage': 1,
                                                'target': TARGET_ENEMY
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01038.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Reactor ARK',
                        'unique': true,
                        'traits': [
                            TRAIT_ITEM,
                            TRAIT_TECH
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_READY,
                                        'params': {
                                            'target': TARGET_BY_TITLE,
                                            'title': 'Iron Man'
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01035.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Armadura Mark V',
                        'unique': true,
                        'traits': [
                            TRAIT_ARMOR,
                            TRAIT_TECH
                        ],
                        'cost': 3,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_YOUR_HERO_GET_HIT_POINTS,
                                    'effect': {
                                        'type': EFFECT_MODIFY_HIT_POINTS,
                                        'params': {
                                            'count': 6,
                                            'target': TARGET_YOUR_SUPERHERO
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01036.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Casco Mark V',
                        'unique': true,
                        'traits': [
                            TRAIT_ARMOR,
                            TRAIT_TECH
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'labels': [
                                        LABEL_THWART
                                    ],
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DO_IF_HAS_TRAITS,
                                        'params': {
                                            'traits': [
                                                TRAIT_AERIAL
                                            ],
                                            'target': TARGET_HERO,
                                            'effect': {
                                                'type': EFFECT_REMOVE_THREAT,
                                                'threat': 1,
                                                'target': TARGET_ALL_SCHEMES
                                            },
                                            'effectNot': {
                                                'type': EFFECT_REMOVE_THREAT,
                                                'threat': 1,
                                                'target': TARGET_SCHEME
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01037.png'
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Botas propulsoras',
                        'traits': [
                            TRAIT_ARMOR,
                            TRAIT_TECH
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_YOUR_HERO_GET_HIT_POINTS,
                                    'effect': {
                                        'type': EFFECT_MODIFY_HIT_POINTS,
                                        'params': {
                                            'count': 1,
                                            'target': TARGET_YOUR_SUPERHERO
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_THIS
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_SPEND,
                                                    'resources': [
                                                        RESOURCE_MENTAL
                                                    ]
                                                }
                                            ]
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_LASTING,
                                        'params': {
                                            'target': TARGET_HERO,
                                            'until': TIME_PHASE,
                                            'effect': {
                                                'type': EFFECT_ADD_TRAIT,
                                                'params': {
                                                    'trait': TRAIT_AERIAL,
                                                    'target': TARGET_HERO
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01039.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SUPPORT,
                    'params': {
                        'name': 'Torre Stark',
                        'unique': true,
                        'traits': [
                            TRAIT_LOCATION
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_ALTEREGO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_SEARCH_CARDS,
                                                    'params': {
                                                        'locations': [
                                                            PLACE_DISCARD_PILE
                                                        ],
                                                        'firstMatch': true,
                                                        'filter': {
                                                            'type': CARD_TYPE_UPGRADE,
                                                            'traits': TRAIT_TECH
                                                        }
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_MOVE_TO_HAND
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01034.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SUPPORT,
                    'params': {
                        'name': 'Pepper Potts',
                        'unique': true,
                        'traits': [
                            TRAIT_INDIVIDUAL
                        ],
                        'cost': 3,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_RESOURCE,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_CARD
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_GENERATE_RESOURCES_FROM_CARD,
                                        'params': {
                                            'target': TARGET_PLAYER_DISCARD,
                                            'position': TARGET_TOP_CARD
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01033.png'
                    }
                }
            }
        ],
        'precon': [
            {
                'aspect': 'leadership',
                'cardRefs': [
                    {
                        'id': 'leadership-maria-hill',
                        'count': 10
                    },
                    {
                        'id': 'leadership-vision',
                        'count': 10
                    },
                    {
                        'id': 'leadership-ojo-de-halcon',
                        'count': 10
                    },
                    {
                        'id': 'leadership-hacer-la-llamada',
                        'count': 2
                    },
                    {
                        'id': 'leadership-liderar-en-vanguardia',
                        'count': 2
                    },
                    {
                        'id': 'leadership-preparacion',
                        'count': 2
                    },
                    {
                        'id': 'leadership-el-poder-del-liderazgo',
                        'count': 2
                    },
                    {
                        'id': 'leadership-el-triskelion',
                        'count': 10
                    },
                    {
                        'id': 'leadership-inspiracion',
                        'count': 2
                    }
                ]
            },
            {
                'aspect': 'basic',
                'cardRefs': [
                    {'id': 'basic-avengers-mansion', 'count': 1},
                    {'id': 'basic-helicarrier', 'count': 1},
                    {'id': 'basic-haymaker', 'count': 1},
                    {'id': 'basic-emergency', 'count': 1},
                    {'id': 'basic-first-aid', 'count': 1},
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-genius', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-mockingbird', 'count': 10},
                    {'id': 'basic-nick-fury', 'count': 10},
                ],
            },
        ],
        'obligation': {
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'Problemas de negocios',
                    'traits': [
                        TRAIT_CONDITION
                    ],
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Convertirte en Tony Stark',
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
                                                    'name': 'Agotar a Tony Stark para retirar la Obligación',
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
                                                    'name': 'Agotar todas las Mejoras que controles para descartar la Obligación',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_EXHAUST,
                                                                    'params': {
                                                                        'filter': {
                                                                            'type': CARD_TYPE_UPGRADE,
                                                                            'control': TARGET_YOU
                                                                        },
                                                                        'matchAll': true
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
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    'image': 'heroes/iron-man/01170.png'
                }
            },
            'count': 1
        },
        'nemesis': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Sobrecarga inminente',
                        'boost': 3,
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
                        ],
                        'image': 'heroes/iron-man/01171.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Latigazo',
                        'unique': true,
                        'traits': [
                            TRAIT_CRIMINAL
                        ],
                        'boost': 2,
                        'hitPoints': 4,
                        'attack': 3,
                        'scheme': 2,
                        'keywords': {
                            'retaliate': 1
                        },
                        'image': 'heroes/iron-man/01172.png'
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Azote de electrolátigo',
                        'traits': [],
                        'boost': 0,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'name': 'Azote de electrolátigo',
                                    'effect': {
                                        'type': EFFECT_CHOOSE_ABILITY,
                                        'params': {
                                            'options': [
                                                {
                                                    'type': ABILITY_OPTION,
                                                    'params': {
                                                        'name': 'Recibir daño por cada Mejora controlada',
                                                        'effect': {
                                                            'type': EFFECT_DEAL_DAMAGE,
                                                            'params': {
                                                                'target': TARGET_HERO,
                                                                'damage': 0,
                                                                'paramsCalc': {
                                                                    'formula': CALC_COUNT,
                                                                    'target': 'cards',
                                                                    'filter': {
                                                                        'type': CARD_TYPE_UPGRADE,
                                                                        'control': TARGET_YOU
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                {
                                                    'type': ABILITY_OPTION,
                                                    'params': {
                                                        'name': 'Elegir y descartar una Mejora controlada',
                                                        'effect': {
                                                            'type': EFFECT_SELECT_DISCARD_CARD,
                                                            'params': {
                                                                'filter': {
                                                                    'type': CARD_TYPE_UPGRADE,
                                                                    'control': TARGET_YOU
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
                        ],
                        'boostEffect': {
                            'type': EFFECT_DO_IF,
                            'params': {
                                'condition': {
                                    'target': TARGET_ATTACK_UNDEFENDED
                                },
                                'effect': {
                                    'type': EFFECT_SELECT_DISCARD_CARD,
                                    'params': {
                                        'filter': {
                                            'type': CARD_TYPE_UPGRADE,
                                            'control': TARGET_YOU
                                        }
                                    }
                                }
                            }
                        },
                        'image': 'heroes/iron-man/01173.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Descarga electromagnética',
                        'traits': [],
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'name': 'Descarga electromagnética',
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_ALL_PLAYERS,
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_FROM_DECK,
                                                    'params': {
                                                        'count': 5
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_TAKE_DAMAGE,
                                                    'params': {
                                                        'damage': 0,
                                                        'paramsCalc': {
                                                            'formula': CALC_RESOURCES,
                                                            'resourceType': RESOURCE_ENERGY,
                                                            'target': 'effects.0.cards'
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/iron-man/01174.png'
                    }
                }
            }
        ]
    }
};
