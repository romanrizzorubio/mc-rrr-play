import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESOURCE,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CALC_ALL,
    CALC_COUNT,
    CALC_DIFFERENT_CARD_TYPES,
    CALC_TRAITS_COUNT,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_HERO,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_DO_IF_TARGET,
    EFFECT_DRAW_CARD,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_HEAL,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DEFEAT,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_RETURN_HAND,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND_X,
    EFFECT_STUN,
    EFFECT_MAY,
    EFFECT_FLIP,
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
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ATTACKED,
    TARGET_ACTIVATION,
    TARGET_BY_TITLE,
    TARGET_CARD,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TARGET_PHASE,
    TARGET_ROUND,
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_ASGARD,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_GIANT,
    TRAIT_LOCATION,
    TRAIT_SUPERPOWER,
    TRAIT_THWART,
    TRAIT_TITLE,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_INSTANT,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_HAND_SIZE,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS,
} from 'mc-shared';

export default {
    '_id': 'thor',
    'order': 8,
    'name': 'Thor',
    'folder': 'thor',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Odinson',
                    'set': 'Thor',
                    'image': 'heroes/thor/06001b.png',
                    'traits': [
                        TRAIT_ASGARD
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 4,
                    'handSize': 5,
                    'hitPoints': 14,
                    'abilities': [
                        {
                            'type': ABILITY_ALTEREGO_ACTION,
                            'params': {
                                'name': 'Digno',
                                'condition': [
                                    {
                                        'player.deck.cards.*.name': 'Mjolnir'
                                    },
                                    {
                                        'player.deck.discardPile.*.name': 'Mjolnir'
                                    }
                                ],
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_ROUND
                                },
                                'effect': {
                                    'type': EFFECT_CHAINED,
                                    'params': {
                                        'effects': [
                                            {
                                                'type': EFFECT_SEARCH_CARDS,
                                                'params': {
                                                    'locations': [
                                                        PLACE_DECK,
                                                        PLACE_DISCARD_PILE
                                                    ],
                                                    'filter': {
                                                        'name': 'Mjolnir'
                                                    },
                                                    'requireMatch': true
                                                }
                                            },
                                            {
                                                'type': EFFECT_MOVE_TO_HAND,
                                                'params': {
                                                    'target': TARGET_CARD
                                                }
                                            },
                                            {
                                                'type': EFFECT_SHUFFLE_DECK,
                                                'params': {
                                                    'target': TARGET_YOU
                                                }
                                            }
                                        ]
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
                    'name': 'Thor',
                    'set': 'Thor',
                    'image': 'heroes/thor/06001a.png',
                    'traits': [
                        TRAIT_ASGARD,
                        TRAIT_AVENGER
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 1,
                    'attack': 2,
                    'defense': 2,
                    'handSize': 4,
                    'hitPoints': 14,
                    'abilities': [
                        {
                            'type': ABILITY_RESPONSE,
                            'params': {
                                'name': '¡Defiéndete!',
                                'trigger': TRIGGER_ENGAGE_HERO,
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_PHASE
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
        ],
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ALLY,
                    'params': {
                        'name': 'Dama Sif',
                        'set': 'Thor',
                        'image': 'heroes/thor/06002.png',
                        'traits': [
                            TRAIT_ASGARD
                        ],
                        'unique': true,
                        'cost': 4,
                        'resources': [
                            RESOURCE_WILD
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'thwart': 2,
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
                                        'type': EFFECT_READY,
                                        'params': {
                                            'target': TARGET_ALL_FRIENDLY_CHARACTERS,
                                            'condition': {
                                                'mainName': 'Thor'
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
                'count': 3,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Defensor de los Nueve Reinos',
                        'set': 'Thor',
                        'image': 'heroes/thor/06003.png',
                        'traits': [
                            TRAIT_THWART
                        ],
                        'cost': 0,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'labels': [
                                        LABEL_THWART
                                    ],
                                    'arrow': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'outputParams': [
                                                'selectedCard'
                                            ],
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_UNTIL,
                                                    'params': {
                                                        'target': TARGET_ENCOUNTER_DECK,
                                                        'condition': {
                                                            'type': CARD_TYPE_MINION
                                                        },
                                                        'showDiscardedCards': true
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_ENGAGE,
                                                    'params': {
                                                        'target': TARGET_YOU
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DO_IF,
                                        'params': {
                                            'condition': {
                                                'selectedCard.type': CARD_TYPE_MINION
                                            },
                                            'effect': {
                                                'type': EFFECT_REMOVE_THREAT,
                                                'params': {
                                                    'target': TARGET_SCHEME,
                                                    'threat': 3
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': '¡Por Asgard!',
                        'set': 'Thor',
                        'image': 'heroes/thor/06004.png',
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
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
                                                            PLACE_DECK,
                                                            PLACE_DISCARD_PILE
                                                        ],
                                                        'filter': {
                                                            'traits': [
                                                                TRAIT_ASGARD
                                                            ]
                                                        },
                                                        'requireMatch': true
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_MOVE_TO_HAND,
                                                    'params': {
                                                        'target': TARGET_CARD
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_SHUFFLE_DECK,
                                                    'params': {
                                                        'target': TARGET_YOU
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
                        'name': 'Lanzamiento de martillo',
                        'set': 'Thor',
                        'image': 'heroes/thor/06005.png',
                        'traits': [
                            TRAIT_ATTACK,
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 3,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
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
                                            'target': TARGET_UPGRADE_YOU_CONTROL,
                                            'condition': {
                                                'name': 'Mjolnir'
                                            }
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 8,
                                                        'keywords': {
                                                            'overkill': true
                                                        }
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_RETURN_HAND,
                                                    'params': {
                                                        'target': TARGET_UPGRADE_YOU_CONTROL,
                                                        'condition': {
                                                            'name': 'Mjolnir'
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
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Relámpago',
                        'set': 'Thor',
                        'image': 'heroes/thor/06006.png',
                        'traits': [
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_SPEND_X,
                                        'params': {
                                            'resourceType': RESOURCE_ENERGY
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DO_IF_HAS_TRAITS,
                                        'params': {
                                            'target': TARGET_YOUR_HERO,
                                            'traits': [
                                                TRAIT_AERIAL
                                            ],
                                            'effect': {
                                                'type': EFFECT_DEAL_DAMAGE,
                                                'params': {
                                                    'target': [
                                                        TARGET_VILLAIN,
                                                        TARGET_ALL_ENGAGED_MINIONS
                                                    ],
                                                    'multipleTarget': true,
                                                    'damage': 0,
                                                    'paramsCalc': {
                                                        'target': 'effect.ability.arrow.cost.paid',
                                                        'formula': CALC_COUNT
                                                    },
                                                    'ignoreTough': true
                                                }
                                            },
                                            'effectNot': {
                                                'type': EFFECT_DEAL_DAMAGE,
                                                'params': {
                                                    'target': [
                                                        TARGET_VILLAIN,
                                                        TARGET_ALL_ENGAGED_MINIONS
                                                    ],
                                                    'multipleTarget': true,
                                                    'damage': 0,
                                                    'paramsCalc': {
                                                        'target': 'effect.ability.arrow.cost.paid',
                                                        'formula': CALC_COUNT
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SUPPORT,
                    'params': {
                        'name': 'Asgard',
                        'set': 'Thor',
                        'image': 'heroes/thor/06007.png',
                        'traits': [
                            TRAIT_ASGARD,
                            TRAIT_LOCATION
                        ],
                        'unique': true,
                        'cost': 3,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_YOUR_HERO_GET_HAND_SIZE,
                                    'effect': {
                                        'type': EFFECT_MODIFY_HAND_SIZE,
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
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Dios del Trueno',
                        'set': 'Thor',
                        'image': 'heroes/thor/06008.png',
                        'traits': [
                            TRAIT_ASGARD,
                            TRAIT_TITLE
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_RESOURCE,
                                'params': {
                                    'resource': RESOURCE_ENERGY,
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
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
                        'name': 'Mjolnir',
                        'set': 'Thor',
                        'image': 'heroes/thor/06009.png',
                        'traits': [
                            TRAIT_ASGARD,
                            TRAIT_WEAPON
                        ],
                        'unique': true,
                        'cost': 1,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'restricted': true,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_YOUR_HERO_GET_ATTACK,
                                    'effect': {
                                        'type': EFFECT_MODIFY_ATTACK_VALUE,
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
                                    'trigger': TRIGGER_CONDITION_GET_TRAITS,
                                    'triggerParams': {
                                        'conditionTrigger': {
                                            'name': 'Thor'
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
                        'name': 'Yelmo de Thor',
                        'set': 'Thor',
                        'image': 'heroes/thor/06010.png',
                        'traits': [
                            TRAIT_ASGARD,
                            TRAIT_ARMOR
                        ],
                        'unique': true,
                        'cost': 2,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_YOUR_HERO_GET_HIT_POINTS,
                                    'effect': {
                                        'type': EFFECT_MODIFY_HIT_POINTS,
                                        'params': {
                                            'target': TARGET_YOUR_SUPERHERO,
                                            'count': 5
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
                'aspect': 'aggression',
                'cardRefs': [
                    {'id': 'aggression-hercules', 'count': 1},
                    {'id': 'aggression-valquiria', 'count': 1},
                    {'id': 'aggression-a-por-ellos', 'count': 2},
                    {'id': 'aggression-the-power-of-aggression', 'count': 2},
                    {'id': 'aggression-ven-aqui', 'count': 3},
                    {'id': 'aggression-golpetazo', 'count': 3},
                    {'id': 'aggression-salon-de-los-heroes', 'count': 1},
                    {'id': 'aggression-furia-de-combate', 'count': 3},
                    {'id': 'aggression-jarnbjorn', 'count': 1}
                ]
            },
            {
                'aspect': 'basic',
                'cardRefs': [
                    {'id': 'basic-heimdall', 'count': 1},
                    {'id': 'basic-invulnerabilidad', 'count': 3},
                    {'id': 'basic-avengers-mansion', 'count': 1},
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-genius', 'count': 1}
                ]
            }
        ],
        'obligation': {
            'count': 1,
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'La ira de Odín',
                    'set': 'Thor',
                    'image': 'heroes/thor/06026.png',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Adoptar la identidad de Alter ego',
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
                                                    'name': 'Agota a Odinson para retirar La ira de Odín del juego',
                                                    'arrow': {
                                                        'type': EFFECT_EXHAUST,
                                                        'params': {
                                                            'target': TARGET_ALTEREGO
                                                        }
                                                    },
                                                    'effect': {
                                                        'type': EFFECT_REMOVE_CARD,
                                                        'params': {
                                                            'target': TARGET_CARD
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Descarta Mjolnir de tu mano o del juego; quedas aturdido',
                                                    'effect': {
                                                        'type': EFFECT_DO_IF_TARGET,
                                                        'params': {
                                                            'candidateTarget': TARGET_CONDITION_CARD,
                                                            'condition': {
                                                                'name': 'Mjolnir'
                                                            },
                                                            'effect': {
                                                                'type': EFFECT_DISCARD_GAME,
                                                                'params': {
                                                                    'target': TARGET_BY_TITLE,
                                                                    'title': 'Mjolnir',
                                                                    'locations': [
                                                                        PLACE_IN_PLAY
                                                                    ]
                                                                }
                                                            },
                                                            'effectNot': {
                                                                'type': EFFECT_DISCARD_CONDITION_HAND,
                                                                'params': {
                                                                    'target': TARGET_YOU,
                                                                    'condition': {
                                                                        'name': 'Mjolnir'
                                                                    }
                                                                }
                                                            },
                                                            'thenEffect': {
                                                                'type': EFFECT_CHAINED,
                                                                'params': {
                                                                    'effects': [
                                                                        {
                                                                            'type': EFFECT_STUN,
                                                                            'params': {
                                                                                'target': TARGET_YOUR_SUPERHERO
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
                        'name': 'Rencilla familiar',
                        'set': 'Thor',
                        'image': 'heroes/thor/06027.png',
                        'boost': 3,
                        'startingThreat': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'threat': 0,
                                            'paramsCalc': {
                                                'target': 'match.inPlayCards',
                                                'formula': CALC_TRAITS_COUNT,
                                                'trait': TRAIT_ASGARD
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
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Loki',
                        'set': 'Thor',
                        'image': 'heroes/thor/06028.png',
                        'traits': [
                            TRAIT_ASGARD
                        ],
                        'unique': true,
                        'nemesis': true,
                        'boost': 3,
                        'attack': 2,
                        'scheme': 2,
                        'hitPoints': 4,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
                                    'triggerParams': {
                                        'target': TARGET_THIS
                                    },
                                    'condition': {
                                        'effect.selectedTarget.name': 'Loki'
                                    },
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_FROM_DECK,
                                                    'params': {
                                                        'target': TARGET_ENCOUNTER_DECK,
                                                        'count': 1
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effects.0.cards.0.type': CARD_TYPE_TREACHERY
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_CHAINED,
                                                            'params': {
                                                                'effects': [
                                                                    {
                                                                        'type': EFFECT_PREVENT_DEFEAT,
                                                                        'params': {
                                                                            'target': TARGET_EFFECT
                                                                        }
                                                                    },
                                                                    {
                                                                        'type': EFFECT_HEAL,
                                                                        'params': {
                                                                            'target': TARGET_THIS,
                                                                            'damage': 0,
                                                                            'allowNoDamage': true,
                                                                            'paramsCalc': {
                                                                                'formula': CALC_ALL,
                                                                                'target': 'effect.selectedTarget'
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
                        ]
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Gigante de hielo',
                        'set': 'Thor',
                        'image': 'heroes/thor/06029.png',
                        'traits': [
                            TRAIT_GIANT
                        ],
                        'boost': 1,
                        'attack': 3,
                        'scheme': 1,
                        'hitPoints': 4,
                        'keywords': {
                            'toughness': true
                        },
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'condition': {
                                    'effect.enemyActivation.enemy.isVillain': true,
                                    'effect.enemyActivation.isAttack': true
                                },
                                'effect': {
                                    'type': EFFECT_DELAYED,
                                    'params': {
                                        'target': TARGET_ACTIVATION,
                                        'effect': {
                                            'type': EFFECT_DO_IF_TAKE_DAMAGE,
                                            'params': {
                                                'source': TARGET_EFFECT,
                                                'target': TARGET_ATTACKED,
                                                'effect': {
                                                    'type': EFFECT_STUN,
                                                    'params': {
                                                        'target': TARGET_ATTACKED
                                                    }
                                                }
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
                        'name': 'Embaucador',
                        'set': 'Thor',
                        'image': 'heroes/thor/06030.png',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_FROM_DECK,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                        'count': 3
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_PLACE_THREAT,
                                                    'params': {
                                                        'target': TARGET_MAIN_SCHEME,
                                                        'threat': 0,
                                                        'paramsCalc': {
                                                            'target': 'effects.0.cards',
                                                            'formula': CALC_DIFFERENT_CARD_TYPES
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
        ]
    }
};
