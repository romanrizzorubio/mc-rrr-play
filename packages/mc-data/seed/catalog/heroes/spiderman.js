import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESOURCE,
    ABILITY_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESOURCE,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    CALC_DIFFERENT_RESOURCE_TYPE,
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
    EFFECT_CANCEL_ATTACK,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_DRAW,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FACEDOWN,
    EFFECT_FLIP,
    EFFECT_HEAL,
    EFFECT_MAY,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_RANDOM_CARD,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_REMOVE_USE,
    EFFECT_RETURN_FACEDOWN,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_SURGE,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ACTIVATION,
    TARGET_ALL_CARDS,
    TARGET_ALL_PLAYERS,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ANY,
    TARGET_ATTACHED,
    TARGET_ATTACKED,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_MINION,
    TARGET_PLAYER,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TIME_ROUND,
    TRAIT_AERIAL,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_CRIMINAL,
    TRAIT_DEFENSE,
    TRAIT_GENIUS,
    TRAIT_HEROFORHIRE,
    TRAIT_INDIVIDUAL,
    TRAIT_ITEM,
    TRAIT_SKILL,
    TRAIT_SUPERPOWER,
    TRAIT_TECH,
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_ATTACHED_WOULD_ATTACK,
    TRIGGER_INSTANT,
    TRIGGER_THIS_END_PLAY_CARD,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_YOU_WOULD_TAKE_DAMAGE
} from 'mc-shared';

export default {
    '_id': 'spiderman',
    'order': 2,
    'name': 'Spiderman',
    'folder': 'spiderman',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Peter Parker',
                    'set': 'Spiderman',
                    'image': 'heroes/spiderman/peter0a.webp',
                    'traits': [
                        TRAIT_GENIUS
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 3,
                    'handSize': 6,
                    'hitPoints': 10,
                    'abilities': [
                        {
                            'type': ABILITY_RESOURCE,
                            'params': {
                                'name': 'Científico',
                                'limit': {
                                    'count': 1,
                                    'time': TIME_ROUND
                                },
                                'resource': RESOURCE_MENTAL
                            }
                        }
                    ]
                }
            },
            {
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Spiderman',
                    'set': 'Spiderman',
                    'image': 'heroes/spiderman/peter0b.webp',
                    'traits': [
                        TRAIT_AVENGER
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 1,
                    'attack': 2,
                    'defense': 3,
                    'handSize': 5,
                    'hitPoints': 10,
                    'abilities': [
                        {
                            'type': ABILITY_INTERRUPT,
                            'params': {
                                'name': 'Sentido arácnido',
                                'trigger': TRIGGER_VILLAIN_ATTACKS_YOU,
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
                        'name': 'Gata Negra',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter1.webp',
                        'traits': [
                            TRAIT_HEROFORHIRE
                        ],
                        'unique': true,
                        'cost': 2,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'subtitle': 'Felicia Hardy',
                        'thwart': 1,
                        'attack': 1,
                        'thwartConsequencial': 1,
                        'attackConsequencial': 0,
                        'hitPoints': 2,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_THIS_END_PLAY_CARD,
                                    'effect': {
                                        'type': EFFECT_DISCARD_DRAW,
                                        'params': {
                                            'count': 2,
                                            'condition': {
                                                'card.resources': 'm'
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
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Voltereta hacia atrás',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter2.webp',
                        'traits': [
                            TRAIT_DEFENSE,
                            TRAIT_SKILL
                        ],
                        'cost': 0,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_YOU_WOULD_TAKE_DAMAGE,
                                    'labels': [
                                        LABEL_DEFENSE
                                    ],
                                    'condition': {
                                        'effect.isAttack': true
                                    },
                                    'effect': {
                                        'type': EFFECT_PREVENT_DAMAGE,
                                        'params': {
                                            'target': TARGET_YOU
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
                        'name': 'Sentido Arácnido Mejorado',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter4.webp',
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
                                'type': ABILITY_HERO_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_TREACHERY_REVEAL,
                                    'effect': {
                                        'type': EFFECT_CANCEL_ENCOUNTER,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'revealer': 'player',
                                            'type': CARD_TYPE_TREACHERY,
                                            'full': false
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
                        'name': 'Balanceo con patada',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter6.webp',
                        'traits': [
                            TRAIT_AERIAL,
                            TRAIT_ATTACK,
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 3,
                        'resources': [
                            RESOURCE_MENTAL
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
                                            'damage': 8,
                                            'target': TARGET_ENEMY
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
                        'name': 'Tía May',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter9.webp',
                        'traits': [
                            TRAIT_INDIVIDUAL
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
                                        'type': EFFECT_HEAL,
                                        'params': {
                                            'damage': 4,
                                            'target': TARGET_YOUR_SUPERHERO
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
                        'name': 'Rastreador Arácnido',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter10.webp',
                        'traits': [
                            TRAIT_ITEM,
                            TRAIT_TECH
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'attach': TARGET_MINION,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_ATTACHED_DEFEAT,
                                    'target': TARGET_ATTACHED,
                                    'effect': {
                                        'type': EFFECT_REMOVE_THREAT,
                                        'params': {
                                            'threat': 3,
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Lanzarredes',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter12.webp',
                        'traits': [
                            TRAIT_ITEM,
                            TRAIT_TECH
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'keywords': {
                            'uses': 3
                        },
                        'abilities': [
                            {
                                'type': ABILITY_HERO_RESOURCE,
                                'params': {
                                    'resource': RESOURCE_WILD,
                                    'target': TARGET_ANY,
                                    'arrow': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_CARD,
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_CARD
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_REMOVE_USE,
                                                    'params': {
                                                        'target': TARGET_CARD,
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Envuelto en telaraña',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/peter14.webp',
                        'traits': [
                            TRAIT_CONDITION
                        ],
                        'cost': 4,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'attach': TARGET_ENEMY,
                        'maxAttach': 1,
                        'paramsToPlay': {
                            'superhero.isHero': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_ATTACHED_WOULD_ATTACK,
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_ATTACHED,
                                            'effects': [
                                                {
                                                    'type': EFFECT_SIMULTANEOUS,
                                                    'params': {
                                                        'effects': [
                                                            {
                                                                'type': EFFECT_CANCEL_ATTACK,
                                                                'params': {
                                                                    'target': TARGET_EFFECT
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
                                            ],
                                            'thenEffect': {
                                                'type': EFFECT_STUN,
                                                'params': {
                                                    'target': TARGET_ATTACHED
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
                'aspect': 'justice',
                'cardRefs': [
                    {
                        'id': 'justice-daredevil',
                        'count': 1
                    },
                    {
                        'id': 'justice-jessica-jones',
                        'count': 1
                    },
                    {
                        'id': 'justice-for-justice',
                        'count': 2
                    },
                    {
                        'id': 'justice-great-responsability',
                        'count': 2
                    },
                    {
                        'id': 'justice-the-power-of-justice',
                        'count': 2
                    },
                    {
                        'id': 'justice-interrogation-room',
                        'count': 2
                    },
                    {
                        'id': 'justice-surveillance-team',
                        'count': 2
                    },
                    {
                        'id': 'justice-intuicion-heroica',
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
                    'name': 'Aviso de desahucio',
                    'set': 'Spiderman',
                    'image': 'heroes/spiderman/petern0.webp',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Convertirte en Peter Parker',
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
                                                    'name': 'Agotar a Peter Parker para retirar la Obligación',
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
                                                    'name': 'Descartar carta aleatoria y Oleada para descartar la Obligación',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_DISCARD_RANDOM,
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
                        'name': 'Ladrón Alado',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/petern1.webp',
                        'boost': 3,
                        'icons': {
                            'acceleration': 1
                        },
                        'startingThreat': [
                            3,
                            true
                        ],
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_ALL_PLAYERS,
                                            'effects': [
                                                {
                                                    'type': EFFECT_RANDOM_CARD,
                                                    'params': {
                                                        'target': TARGET_PLAYER
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_FACEDOWN,
                                                    'params': {
                                                        'target': TARGET_CARD,
                                                        'cardsTarget': TARGET_SOURCE,
                                                        'source': 'effects.0.cards'
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_WHEN_DEFEATED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_RETURN_FACEDOWN,
                                        'params': {
                                            'target': TARGET_CARD,
                                            'faceDownTarget': TARGET_ALL_CARDS
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
                        'name': 'Buitre',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/petern2.webp',
                        'boost': 2,
                        'hitPoints': 4,
                        'attack': 3,
                        'scheme': 1,
                        'unique': true,
                        'traits': [
                            TRAIT_CRIMINAL
                        ],
                        'keywords': {
                            'quickStrike': true
                        },
                        'nemesis': true
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Picado arrollador',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/petern3.webp',
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_STUN,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DO_IF_CARD_GAME,
                                                    'params': {
                                                        'condition': {
                                                            'name': 'Vulture'
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_SURGE
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'effect': {
                                    'type': EFFECT_DELAYED,
                                    'params': {
                                        'target': TARGET_ACTIVATION,
                                        'effect': {
                                            'type': EFFECT_DO_IF_TAKE_DAMAGE,
                                            'params': {
                                                'source': TARGET_EFFECT,
                                                'condition': {
                                                    'isFriendly': true
                                                },
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
                        'name': 'Los Planes del Buitre',
                        'set': 'Spiderman',
                        'image': 'heroes/spiderman/petern5.webp',
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_RANDOM,
                                                    'params': {
                                                        'target': TARGET_ALL_PLAYERS
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_PLACE_THREAT,
                                                    'params': {
                                                        'target': TARGET_MAIN_SCHEME,
                                                        'paramsCalc': {
                                                            'target': 'effects.0.cards',
                                                            'formula': CALC_DIFFERENT_RESOURCE_TYPE
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
