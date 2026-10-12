import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESOURCE,
    ABILITY_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
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
    EFFECT_BLANK_TEXT,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CANNOT_TARGET,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF_TARGET,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_EFFECT_VALUE,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_MAY,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_RETURN_HAND,
    EFFECT_SEARCH_CARDS,
    EFFECT_SPEND,
    EFFECT_SURGE,
    EFFECT_TUCK_UNDER,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    DECK_POSITION_BOTTOM,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SUPPORTS,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_PHASE,
    TARGET_PLAYER,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TIME_PHASE,
    TRAIT_ATTACK,
    TRAIT_ARMOR,
    TRAIT_BIRD,
    TRAIT_CHAMPION,
    TRAIT_DEFENSE,
    TRAIT_GENIUS,
    TRAIT_PERSONA,
    TRAIT_INHUMAN,
    TRAIT_ROBOT,
    TRAIT_SKILL,
    TRAIT_SUPERPOWER,
    TRAIT_THWART,
    TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_INSTANT,
    TRIGGER_PLAY_CARD,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';

const msMarvelSet = 'Ms. Marvel';

export default {
    '_id': 'ms-marvel',
    'order': 6,
    'name': 'Ms. Marvel',
    'folder': 'ms-marvel',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Kamala Khan',
                    'set': msMarvelSet,
                    'image': 'heroes/ms-marvel/05001b.png',
                    'traits': [
                        TRAIT_INHUMAN
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 5,
                    'handSize': 6,
                    'hitPoints': 10,
                    'abilities': [
                        {
                            'type': ABILITY_ALTEREGO_ACTION,
                            'params': {
                                'name': 'Fervor adolescente',
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_ROUND
                                },
                                'effect': {
                                    'type': EFFECT_CHAINED,
                                    'params': {
                                        'target': TARGET_YOU,
                                        'effects': [
                                            {
                                                'type': EFFECT_DISCARD_UNTIL,
                                                'params': {
                                                    'condition': {
                                                        'set': msMarvelSet
                                                    },
                                                    'showDiscardedCards': true
                                                }
                                            },
                                            {
                                                'type': EFFECT_MOVE_TO_HAND,
                                                'params': {
                                                    'target': TARGET_SOURCE,
                                                    'source': 'selectedCards'
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
                    'name': 'Ms. Marvel',
                    'set': msMarvelSet,
                    'image': 'heroes/ms-marvel/05001a.png',
                    'traits': [
                        TRAIT_CHAMPION,
                        TRAIT_INHUMAN
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 1,
                    'attack': 1,
                    'defense': 1,
                    'handSize': 5,
                    'hitPoints': 10,
                    'abilities': [
                        {
                            'type': ABILITY_RESPONSE,
                            'params': {
                                'name': 'Morfogenética',
                                'trigger': TRIGGER_END_PLAY_CARD,
                                'condition': {
                                    'effect.card.isEvent': true,
                                    'effect.card.traits': [
                                        TRAIT_ATTACK,
                                        TRAIT_THWART,
                                        TRAIT_DEFENSE
                                    ]
                                },
                                'arrow': {
                                    'type': EFFECT_EXHAUST,
                                    'params': {
                                        'target': TARGET_YOUR_SUPERHERO
                                    }
                                },
                                'effect': {
                                    'type': EFFECT_RETURN_HAND,
                                    'params': {
                                        'target': TARGET_TRIGGERED_CARD
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
                        'name': 'Puñal Rojo',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05002.png',
                        'traits': [
                            TRAIT_CHAMPION
                        ],
                        'unique': true,
                        'cost': 3,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'thwart': 2,
                        'attack': 2,
                        'thwartConsequential': 1,
                        'attackConsequential': 1,
                        'hitPoints': 3,
                        'abilities': [
                            {
                                'type': ABILITY_INTERRUPT,
                                'params': {
                                    'name': 'Puñal Rojo',
                                    'trigger': TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
                                    'triggerParams': {
                                        'target': TARGET_THIS
                                    },
                                    'arrow': {
                                        'type': EFFECT_SPEND,
                                        'params': {
                                            'resources': [
                                                RESOURCE_ANY,
                                                RESOURCE_ANY
                                            ],
                                            'differentTypes': true
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_CHAINED,
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
                                                    'type': EFFECT_RETURN_HAND,
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
            },
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Manos grandes',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05003.png',
                        'traits': [
                            TRAIT_ATTACK,
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 2,
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
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'damage': 4
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
                        'name': 'Escabullirse',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05004.png',
                        'traits': [
                            TRAIT_SKILL,
                            TRAIT_THWART
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_MENTAL
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
                                        'type': EFFECT_REMOVE_THREAT,
                                        'params': {
                                            'target': TARGET_SCHEME,
                                            'threat': 3
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
                        'name': 'Flexibilidad',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05005.png',
                        'traits': [
                            TRAIT_DEFENSE,
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 0,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_INTERRUPT,
                                'params': {
                                    'labels': [
                                        LABEL_DEFENSE
                                    ],
                                    'trigger': TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                                    'triggerParams': {
                                        'target': TARGET_YOUR_SUPERHERO
                                    },
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_PREVENT_DAMAGE,
                                                    'params': {
                                                        'requiresPrePlayConfirmation': true,
                                                        'target': TARGET_EFFECT,
                                                        'damage': 3
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
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SUPPORT,
                    'params': {
                        'name': 'Aamir Khan',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05006.png',
                        'traits': [
                            TRAIT_PERSONA
                        ],
                        'unique': true,
                        'cost': 1,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_ALTEREGO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_CARD
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'effects': [
                                                {
                                                    'type': EFFECT_SEARCH_CARDS,
                                                    'params': {
                                                        'locations': [
                                                            PLACE_DISCARD_PILE
                                                        ],
                                                        'title': 'Elige una carta para poner en la parte inferior de tu mazo',
                                                        'requireMatch': true
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_MOVE_TO_DECK,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                        'position': DECK_POSITION_BOTTOM
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
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SUPPORT,
                    'params': {
                        'name': 'Bruno Carrelli',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05007.png',
                        'traits': [
                            TRAIT_PERSONA
                        ],
                        'unique': true,
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_ALTEREGO_ACTION,
                                'params': {
                                    'name': 'Meter una carta de tu mano debajo de Bruno',
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'effects': [
                                                {
                                                    'type': EFFECT_SEARCH_CARDS,
                                                    'params': {
                                                        'locations': [
                                                            PLACE_HAND
                                                        ],
                                                        'count': 1,
                                                        'requireMatch': true,
                                                        'title': 'Elige una carta de tu mano para meter debajo de Bruno'
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_TUCK_UNDER,
                                                    'params': {
                                                        'target': TARGET_THIS,
                                                        'cards': 'selectedCards'
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_ACTION,
                                'params': {
                                    'name': 'Recuperar hasta 3 cartas metidas debajo de Bruno',
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_MOVE_TO_HAND,
                                        'params': {
                                            'target': TARGET_SOURCE,
                                            'source': 'ability.card.tuckedCards',
                                            'selectCount': 3,
                                            'selectUpTo': true,
                                            'multipleTarget': true
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
                        'name': 'Nakia Bahadir',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05008.png',
                        'traits': [
                            TRAIT_PERSONA
                        ],
                        'unique': true,
                        'cost': 1,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_ALTEREGO_ACTION,
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
                                            'triggerType': TRIGGER_YOU_PLAY_CARD,
                                            'limit': {
                                                'count': 1,
                                                'target': TARGET_PHASE
                                            },
                                            'hideDialog': true,
                                            'effect': {
                                                'type': EFFECT_MODIFY_COST,
                                                'params': {
                                                    'target': TARGET_EFFECT,
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Traje de polímero biocinético',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05009.png',
                        'traits': [
                            TRAIT_ARMOR
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_RESOURCE,
                                'params': {
                                    'resource': RESOURCE_WILD,
                                    'condition': {
                                        'cardToPay.isEvent': true
                                    },
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
                        'name': '¡Agrandar!',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05010.png',
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
                                'type': ABILITY_HERO_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_PLAY_CARD,
                                    'condition': {
                                        'effect.card.isEvent': true,
                                        'effect.card.traits': TRAIT_ATTACK
                                    },
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_MODIFY_EFFECT_VALUE,
                                        'params': {
                                            'target': TARGET_TRIGGERED_CARD,
                                            'effectTypes': [
                                                EFFECT_DEAL_DAMAGE
                                            ],
                                            'property': 'damageModifier',
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Encoger',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05011.png',
                        'traits': [
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_PLAY_CARD,
                                    'condition': {
                                        'effect.card.isEvent': true,
                                        'effect.card.traits': TRAIT_THWART
                                    },
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_MODIFY_EFFECT_VALUE,
                                        'params': {
                                            'target': TARGET_TRIGGERED_CARD,
                                            'effectTypes': [
                                                EFFECT_REMOVE_THREAT
                                            ],
                                            'property': 'threatModifier',
                                            'count': 2
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
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-genius', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-avengers-mansion', 'count': 1},
                    {'id': 'basic-mandibulas', 'count': 1},
                    {'id': 'basic-aguante', 'count': 3},
                    {'id': 'basic-reflejos-mejorados', 'count': 3},
                ]
            },
            {
                'aspect': 'protection',
                'cardRefs': [
                    {'id': 'protection-nova', 'count': 1},
                    {'id': 'protection-poneos-detras-de-mi', 'count': 2},
                    {'id': 'protection-ataque-preventivo', 'count': 3},
                    {'id': 'protection-arremetida', 'count': 3},
                    {'id': 'protection-el-poder-de-la-proteccion', 'count': 2},
                    {'id': 'protection-barrera-de-energia', 'count': 3},
                ]
            }
        ],
        'obligation': {
            'count': 1,
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'En casa de madrugada',
                    'set': msMarvelSet,
                    'image': 'heroes/ms-marvel/05025.png',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Volver a casa',
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
                                                    'name': 'Agotar a Kamala Khan para retirar la Obligación del juego',
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
                                                    'name': 'Descartar un Apoyo con el rasgo Individuo para descartar la Obligación',
                                                    'effect': {
                                                        'type': EFFECT_DO_IF_TARGET,
                                                        'params': {
                                                            'candidateTarget': TARGET_SUPPORT_YOU_CONTROL,
                                                            'condition': {
                                                                'traits': TRAIT_PERSONA
                                                            },
                                                            'effect': {
                                                                'type': EFFECT_CHAINED,
                                                                'params': {
                                                                    'effects': [
                                                                        {
                                                                            'type': EFFECT_DISCARD_GAME,
                                                                            'params': {
                                                                                'target': TARGET_SUPPORT_YOU_CONTROL,
                                                                                'condition': {
                                                                                    'traits': TRAIT_PERSONA
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
                                                            },
                                                            'effectNot': {
                                                                'type': EFFECT_CHAINED,
                                                                'params': {
                                                                    'effects': [
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
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Thomas Edison',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05027.png',
                        'boost': 2,
                        'traits': [
                            TRAIT_BIRD,
                            TRAIT_GENIUS
                        ],
                        'unique': true,
                        'nemesis': true,
                        'attack': 1,
                        'scheme': 3,
                        'hitPoints': 3,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'validation': {
                                        'type': EFFECT_CANNOT_TARGET,
                                        'params': {
                                            'effectCategories': [
                                                EFFECT_CATEGORY_DAMAGE
                                            ],
                                            'condition': {
                                                'isMinion': true
                                            },
                                            'conditionTargetMatch': 'engaged'
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
                        'name': 'Robot gigante de Edison',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05028.png',
                        'boost': 1,
                        'traits': [
                            TRAIT_ROBOT
                        ],
                        'attack': 2,
                        'scheme': 1,
                        'hitPoints': 8,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'validation': {
                                        'type': EFFECT_CANNOT_TARGET,
                                        'params': {
                                            'effectCategories': [
                                                EFFECT_CATEGORY_DAMAGE
                                            ]
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_SPEND,
                                        'params': {
                                            'resources': [
                                                RESOURCE_MENTAL
                                            ]
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_LASTING,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'until': TIME_PHASE,
                                            'effect': {
                                                'type': EFFECT_BLANK_TEXT,
                                                'params': {
                                                    'target': TARGET_THIS
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
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Generación "¿Por qué?"',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05026.jpeg',
                        'boost': 3,
                        'startingThreat': [
                            2,
                            true
                        ],
                        'icons': {
                            'hazard': 1
                        },
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DISCARD_FROM_DECK,
                                        'params': {
                                            'players': TARGET_ALL_PLAYERS,
                                            'paramsCalc': {
                                                'target': 'player.match.players.*.gameZone.cards',
                                                'formula': CALC_COUNT,
                                                'conditions': [
                                                    {
                                                        'isAlly': true
                                                    },
                                                    {
                                                        'isSupport': true,
                                                        'traits': TRAIT_PERSONA
                                                    }
                                                ]
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
                        'name': 'Cosecha',
                        'set': msMarvelSet,
                        'image': 'heroes/ms-marvel/05029.png',
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DO_IF_TARGET,
                                        'params': {
                                            'candidateTarget': TARGET_ALL_SUPPORTS,
                                            'condition': {
                                                'traits': TRAIT_PERSONA,
                                                'exhausted': false
                                            },
                                            'effect': {
                                                'type': EFFECT_CHAINED,
                                                'params': {
                                                    'effects': [
                                                        {
                                                            'type': EFFECT_FOR_EACH,
                                                            'params': {
                                                                'target': TARGET_ALL_SUPPORTS,
                                                                'condition': {
                                                                    'traits': TRAIT_PERSONA,
                                                                    'exhausted': false
                                                                },
                                                                'effect': {
                                                                    'type': EFFECT_EXHAUST,
                                                                    'params': {
                                                                        'target': TARGET_ALL_SUPPORTS
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        {
                                                            'type': EFFECT_HEAL,
                                                            'params': {
                                                                'target': TARGET_VILLAIN,
                                                                'allowNoDamage': true,
                                                                'paramsCalc': {
                                                                    'target': 'effects.0.results',
                                                                    'formula': CALC_COUNT
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            'effectNot': {
                                                'type': EFFECT_SURGE
                                            }
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
