import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_SPECIAL,
    ABILITY_WHEN_REVEALED,
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
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_MOVE_DAMAGE,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_RESOLVE_SPECIAL_ABILITY,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SIMULTANEOUS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_IN_PLAY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ANY_PLAYER,
    TARGET_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ARMOR,
    TRAIT_ASSASSIN,
    TRAIT_AVENGER,
    TRAIT_BLACK_PANTHER,
    TRAIT_ELITE,
    TRAIT_GENIUS,
    TRAIT_INDIVIDUAL,
    TRAIT_KING,
    TRAIT_LOCATION,
    TRAIT_MERCENARY,
    TRAIT_SKILL,
    TRAIT_TACTIC,
    TRAIT_WAKANDA,
    TRAIT_WEAPON,
    TRIGGER_INSTANT,
    TRIGGER_THIS_ENTER_PLAY
} from 'mc-shared';

const wakandaForeverCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': '¡Wakanda por siempre!',
        'traits': [
            TRAIT_TACTIC
        ],
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'name': '¡Wakanda por siempre!',
                    'effect': {
                        'type': EFFECT_RESOLVE_SPECIAL_ABILITY,
                        'params': {
                            'locations': [
                                PLACE_IN_PLAY
                            ],
                            'filter': {
                                'traits': [
                                    TRAIT_BLACK_PANTHER
                                ],
                                'type': CARD_TYPE_UPGRADE
                            },
                            'resolveAll': true,
                        }
                    }
                }
            }
        ],
        'cost': 1,
        'image': 'heroes/black-panther/01043a.png'
    }
};
const wakandaForeverWithResource = (resource, count = 1) => ({
    'count': count,
    'card': {
        ...wakandaForeverCard,
        'params': {
            ...wakandaForeverCard.params,
            'resources': [
                resource
            ]
        }
    }
});

export default {
    '_id': 'blackpanther',
    'order': 4,
    'name': 'Pantera Negra',
    'folder': 'blackpanther',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': "T'Challa",
                    'traits': [
                        TRAIT_WAKANDA,
                        TRAIT_KING
                    ],
                    'abilities': [
                        {
                            'type': ABILITY_SETUP,
                            'params': {
                                'name': 'Previsión',
                                'effect': {
                                    'type': EFFECT_CHAINED,
                                    'params': {
                                        'effects': [
                                            {
                                                'type': EFFECT_SEARCH_CARDS,
                                                'params': {
                                                    'locations': [
                                                        PLACE_DECK
                                                    ],
                                                    'filter': {
                                                        'type': CARD_TYPE_UPGRADE,
                                                        'traits': [
                                                            TRAIT_BLACK_PANTHER
                                                        ]
                                                    },
                                                    'title': 'Busca una Mejora PANTERA NEGRA'
                                                }
                                            },
                                            {
                                                'type': EFFECT_MOVE_TO_HAND
                                            },
                                            {
                                                'type': EFFECT_SHUFFLE_DECK
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    'handSize': 6,
                    'hitPoints': 11,
                    'recovery': 4,
                    'image': 'heroes/black-panther/01040b.png'
                }
            },
            {
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Pantera Negra',
                    'traits': [
                        TRAIT_AVENGER,
                        TRAIT_WAKANDA
                    ],
                    'keywords': {
                        'retaliate': 1
                    },
                    'abilities': [],
                    'handSize': 5,
                    'hitPoints': 11,
                    'thwart': 2,
                    'attack': 2,
                    'defense': 2,
                    'image': 'heroes/black-panther/01040a.png'
                }
            }
        ],
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ALLY,
                    'params': {
                        'name': 'Shuri',
                        'traits': [
                            TRAIT_GENIUS,
                            TRAIT_WAKANDA
                        ],
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
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
                                                    'type': EFFECT_SEARCH_CARDS,
                                                    'params': {
                                                        'locations': [
                                                            PLACE_DECK
                                                        ],
                                                        'filter': {
                                                            'type': CARD_TYPE_UPGRADE
                                                        },
                                                        'title': 'Busca una Mejora'
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_MOVE_TO_HAND
                                                },
                                                {
                                                    'type': EFFECT_SHUFFLE_DECK
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'cost': 2,
                        'hitPoints': 3,
                        'thwart': 1,
                        'thwartConsequencial': 1,
                        'attack': 1,
                        'attackConsequencial': 1,
                        'image': 'heroes/black-panther/01041.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Sabiduría ancestral',
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_ALTEREGO_ACTION,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_SEARCH_CARDS,
                                                    'params': {
                                                        'locations': [
                                                            PLACE_DISCARD_PILE
                                                        ],
                                                        'count': 3,
                                                        'upTo': true,
                                                        'distinctNames': true,
                                                        'title': 'Elige hasta 3 cartas de tu pila de descartes'
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_MOVE_TO_DECK
                                                },
                                                {
                                                    'type': EFFECT_SHUFFLE_DECK
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'cost': 1,
                        'image': 'heroes/black-panther/01042.png'
                    }
                }
            },
            wakandaForeverWithResource(RESOURCE_PHYSICAL, 1),
            wakandaForeverWithResource(RESOURCE_ENERGY, 1),
            wakandaForeverWithResource(RESOURCE_MENTAL, 1),
            wakandaForeverWithResource(RESOURCE_WILD, 2),
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_RESOURCE,
                    'params': {
                        'name': 'Vibránium',
                        'resources': [
                            RESOURCE_WILD,
                            RESOURCE_WILD
                        ],
                        'abilities': [],
                        'image': 'heroes/black-panther/01044.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SUPPORT,
                    'params': {
                        'name': 'La Ciudad Dorada',
                        'unique': true,
                        'traits': [
                            TRAIT_LOCATION,
                            TRAIT_WAKANDA
                        ],
                        'resources': [
                            RESOURCE_ENERGY
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
                                        'type': EFFECT_DRAW_CARD,
                                        'params': {
                                            'count': 2,
                                            'target': TARGET_YOU
                                        }
                                    }
                                }
                            }
                        ],
                        'cost': 2,
                        'image': 'heroes/black-panther/01045.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Dagas de energía',
                        'traits': [
                            TRAIT_BLACK_PANTHER,
                            TRAIT_WEAPON
                        ],
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_SPECIAL,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'target': TARGET_ANY_PLAYER,
                                            'effects': [
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'target': TARGET_VILLAIN,
                                                    'damage': 1,
                                                    'paramsLastStep': {
                                                        'damage': 2
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'target': TARGET_ALL_ENGAGED_MINIONS,
                                                    'damage': 1,
                                                    'paramsLastStep': {
                                                        'damage': 2
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'cost': 2,
                        'image': 'heroes/black-panther/01046.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Garras de pantera',
                        'traits': [
                            TRAIT_BLACK_PANTHER,
                            TRAIT_WEAPON
                        ],
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_SPECIAL,
                                'params': {
                                    'labels': [
                                        LABEL_ATTACK
                                    ],
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'damage': 2,
                                            'paramsLastStep': {
                                                'damage': 4
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'cost': 2,
                        'image': 'heroes/black-panther/01047.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Ingenio táctico',
                        'traits': [
                            TRAIT_BLACK_PANTHER,
                            TRAIT_SKILL
                        ],
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_SPECIAL,
                                'params': {
                                    'labels': [
                                        LABEL_THWART
                                    ],
                                    'effect': {
                                        'type': EFFECT_REMOVE_THREAT,
                                        'params': {
                                            'target': TARGET_SCHEME,
                                            'threat': 1,
                                            'paramsLastStep': {
                                                'threat': 2
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'cost': 2,
                        'image': 'heroes/black-panther/01048.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Traje de vibránium',
                        'traits': [
                            TRAIT_BLACK_PANTHER,
                            TRAIT_ARMOR
                        ],
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_SPECIAL,
                                'params': {
                                    'labels': [
                                        LABEL_ATTACK
                                    ],
                                    'effect': {
                                        'type': EFFECT_MOVE_DAMAGE,
                                        'params': {
                                            'fromTarget': TARGET_YOU,
                                            'target': TARGET_ENEMY,
                                            'damage': 1,
                                            'paramsLastStep': {
                                                'damage': 2
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'cost': 2,
                        'image': 'heroes/black-panther/01049.png'
                    }
                }
            }
        ],
        'precon': [
            {
                'aspect': 'protection',
                'cardRefs': [
                    {
                        'id': 'protection-viuda-negra',
                        'count': 1
                    },
                    {
                        'id': 'protection-luke-cage',
                        'count': 1
                    },
                    {
                        'id': 'protection-contragolpe',
                        'count': 2
                    },
                    {
                        'id': 'protection-poneos-detras-de-mi',
                        'count': 2
                    },
                    {
                        'id': 'protection-el-poder-de-la-proteccion',
                        'count': 2
                    },
                    {
                        'id': 'protection-equipo-medico',
                        'count': 2
                    },
                    {
                        'id': 'protection-chaleco-blindado',
                        'count': 2
                    },
                    {
                        'id': 'protection-indomito',
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
                    {'id': 'basic-mockingbird', 'count': 1},
                ],
            },
        ],
        'obligation': {
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'Asuntos de estado',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': "Convertirte en T'Challa",
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
                                                    'name': "Agotar a T'Challa para retirar la Obligación",
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
                                                    'name': 'Descartar una Mejora Pantera Negra para descartar la Obligación',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_SELECT_DISCARD_CARD,
                                                                    'params': {
                                                                        'filter': {
                                                                            'type': CARD_TYPE_UPGRADE,
                                                                            'traits': [
                                                                                TRAIT_BLACK_PANTHER
                                                                            ],
                                                                            'control': TARGET_YOU
                                                                        }
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
                    'image': 'heroes/black-panther/01155.png'
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
                        'name': 'Usurpar el trono',
                        'boost': 3,
                        'icons': {
                            'hazard': 1
                        },
                        'startingThreat': [
                            3,
                            true
                        ],
                        'image': 'heroes/black-panther/01156.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Killmonger',
                        'unique': true,
                        'nemesis': true,
                        'traits': [
                            TRAIT_ASSASSIN,
                            TRAIT_ELITE,
                            TRAIT_MERCENARY
                        ],
                        'boost': 2,
                        'hitPoints': 5,
                        'attack': 2,
                        'scheme': 2,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'name': 'Killmonger',
                                    'validation': {
                                        'type': EFFECT_PREVENT_DAMAGE,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'condition': {
                                                'source': {
                                                    'type': CARD_TYPE_UPGRADE,
                                                    'traits': [
                                                        TRAIT_BLACK_PANTHER
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'image': 'heroes/black-panther/01157.png'
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Hierba con forma de corazón',
                        'traits': [],
                        'boost': 1,
                        'keywords': {
                            'surge': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'name': 'Hierba con forma de corazón',
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_TOUGH,
                                                    'params': {
                                                        'target': TARGET_VILLAIN
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_TOUGH,
                                                    'params': {
                                                        'target': TARGET_ALL_ENGAGED_MINIONS
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'boostEffect': {
                            'type': EFFECT_TOUGH,
                            'params': {
                                'target': TARGET_VILLAIN
                            }
                        },
                        'image': 'heroes/black-panther/01158.png'
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Combate ritual',
                        'traits': [],
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'name': 'Combate ritual',
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_FROM_DECK,
                                                    'params': {
                                                        'target': TARGET_ENCOUNTER_DECK,
                                                        'count': 1,
                                                        'thenEffect': {
                                                            'type': EFFECT_CHOOSE_ABILITY,
                                                            'params': {
                                                                'options': [
                                                                    {
                                                                        'type': ABILITY_OPTION,
                                                                        'params': {
                                                                            'name': 'Recibir daño',
                                                                            'effect': {
                                                                                'type': EFFECT_DEAL_DAMAGE,
                                                                                'params': {
                                                                                    'target': TARGET_YOUR_SUPERHERO,
                                                                                    'damage': 0,
                                                                                    'paramsCalc': {
                                                                                        'damage': '1 + effects.0.card.boost'
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    },
                                                                    {
                                                                        'type': ABILITY_OPTION,
                                                                        'params': {
                                                                            'name': 'Añadir amenaza al Plan principal',
                                                                            'effect': {
                                                                                'type': EFFECT_PLACE_THREAT,
                                                                                'params': {
                                                                                    'target': TARGET_MAIN_SCHEME,
                                                                                    'threat': 0,
                                                                                    'paramsCalc': {
                                                                                        'threat': '1 + effects.0.card.boost'
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
                                }
                            }
                        ],
                        'image': 'heroes/black-panther/01159.png'
                    }
                }
            }
        ]
    }
};
