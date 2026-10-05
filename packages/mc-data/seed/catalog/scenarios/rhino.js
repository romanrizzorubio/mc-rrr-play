import {
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_HEAL,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_PLACE_DAMAGE,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_SURGE,
    EFFECT_TOUGH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_PHYSICAL,
    TARGET_ALL_HEROES,
    TARGET_ALL_PLAYERS,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TRAIT_ARMOR,
    TRAIT_BRUTE,
    TRAIT_CRIMINAL,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_WEAPON,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
    TRIGGER_VILLAIN_ATTACKS
} from 'mc-shared';

export default {
    '_id': 'rhino',
    'order': 0,
    'name': 'Rino',
    'folder': 'rhino',
    'config': {
        'name': 'rhino',
        'villains': [
            {
                'type': CARD_TYPE_VILLAIN,
                'params': {
                    'name': 'Rino',
                    'set': 'rhino',
                    'image': 'scenarios/rhino/rhino1.webp',
                    'traits': [
                        TRAIT_BRUTE,
                        TRAIT_CRIMINAL
                    ],
                    'unique': true,
                    'stage': 1,
                    'scheme': 1,
                    'attack': 2,
                    'hitPoints': [
                        1,
                        true
                    ]
                }
            },
            {
                'type': CARD_TYPE_VILLAIN,
                'params': {
                    'name': 'Rino',
                    'set': 'rhino',
                    'image': 'scenarios/rhino/rhino2.webp',
                    'traits': [
                        TRAIT_BRUTE,
                        TRAIT_CRIMINAL
                    ],
                    'unique': true,
                    'stage': 2,
                    'scheme': 1,
                    'attack': 3,
                    'hitPoints': [
                        1,
                        true
                    ],
                    'abilities': [
                        {
                            'type': ABILITY_WHEN_REVEALED,
                            'params': {
                                'effect': {
                                    'type': EFFECT_SEARCH_CARD_REVEAL,
                                    'params': {
                                        'condition': {
                                            'name': 'Arramblar con todo'
                                        },
                                        'places': [
                                            PLACE_ENCOUNTER_DECK_CARDS,
                                            PLACE_ENCOUNTER_DISCARD
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            },
            {
                'type': CARD_TYPE_VILLAIN,
                'params': {
                    'name': 'Rino',
                    'set': 'rhino',
                    'image': 'scenarios/rhino/rhino3.webp',
                    'traits': [
                        TRAIT_BRUTE,
                        TRAIT_CRIMINAL
                    ],
                    'unique': true,
                    'stage': 3,
                    'scheme': 1,
                    'attack': 4,
                    'hitPoints': [
                        16,
                        true
                    ],
                    'keywords': {
                        'toughness': true
                    },
                    'abilities': [
                        {
                            'type': ABILITY_WHEN_REVEALED,
                            'params': {
                                'effect': {
                                    'type': EFFECT_STUN,
                                    'params': {
                                        'target': TARGET_ALL_PLAYERS
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ],
        'mainSchemes': [
            [
                {
                    'type': CARD_TYPE_MAIN_SCHEME_A_CARD,
                    'params': {
                        'name': '¡Allanamiento!',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino4a.webp',
                        'stage': 1,
                        'content': {
                            'villains': [
                                1,
                                2
                            ],
                            'villainsExpert': [
                                2,
                                3
                            ]
                        }
                    }
                },
                {
                    'type': CARD_TYPE_MAIN_SCHEME_B_CARD,
                    'params': {
                        'name': '¡Allanamiento!',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino4b.webp',
                        'stage': 1,
                        'value': [
                            7,
                            true
                        ],
                        'startingThreat': 0,
                        'acceleration': [
                            1,
                            true
                        ],
                        'final': true
                    }
                }
            ]
        ],
        'sets': [
            'standard'
        ],
        'defaultSets': [
            'bomb-scare'
        ],
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Piel blindada del Rino',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino5.webp',
                        'traits': [
                            TRAIT_ARMOR
                        ],
                        'attach': TARGET_VILLAIN,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_INTERRUPT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
                                    'effect': {
                                        'type': EFFECT_PREVENT_PLACE_DAMAGE,
                                        'params': {
                                            'target': TARGET_ATTACHED,
                                            'thenEffect': {
                                                'type': EFFECT_DO_IF,
                                                'params': {
                                                    'target': TARGET_CARD,
                                                    'condition': {
                                                        'card.damage': '>4'
                                                    },
                                                    'effect': {
                                                        'type': EFFECT_DISCARD_GAME,
                                                        'params': {
                                                            'target': TARGET_CARD
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Embestida',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino6.webp',
                        'attach': TARGET_VILLAIN,
                        'attack': 3,
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_VILLAIN_ATTACKS,
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'effects': [
                                                {
                                                    'type': EFFECT_MODIFY_ATTACK,
                                                    'params': {
                                                        'target': TARGET_EFFECT,
                                                        'modify': {
                                                            'overkill': true
                                                        }
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DELAYED,
                                                    'params': {
                                                        'target': TARGET_EFFECT,
                                                        'effect': {
                                                            'type': EFFECT_DISCARD_GAME,
                                                            'params': {
                                                                'target': TARGET_CARD
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Cuerno de marfil mejorado',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino8.webp',
                        'traits': [
                            TRAIT_WEAPON
                        ],
                        'attach': TARGET_VILLAIN,
                        'attack': 1,
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_CARD
                                        }
                                    },
                                    'arrow': {
                                        'type': EFFECT_SPEND,
                                        'params': {
                                            'resources': [
                                                RESOURCE_PHYSICAL,
                                                RESOURCE_PHYSICAL,
                                                RESOURCE_PHYSICAL
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
                        'name': 'Mercenario de Hydra',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino9.webp',
                        'traits': [
                            TRAIT_HYDRA
                        ],
                        'boost': 1,
                        'scheme': 0,
                        'attack': 1,
                        'hitPoints': 3,
                        'keywords': {
                            'guard': true
                        }
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Hombre de Arena',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino11.webp',
                        'traits': [
                            TRAIT_CRIMINAL,
                            TRAIT_ELITE
                        ],
                        'unique': true,
                        'boost': 2,
                        'scheme': 2,
                        'attack': 3,
                        'hitPoints': 4,
                        'keywords': {
                            'toughness': true
                        }
                    }
                }
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Conmocionador',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino12.webp',
                        'traits': [
                            TRAIT_CRIMINAL
                        ],
                        'unique': true,
                        'scheme': 1,
                        'attack': 2,
                        'boost': 2,
                        'hitPoints': 3,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_ALL_HEROES,
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Difícil de tumbar',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino13.webp',
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_HEAL,
                                        'params': {
                                            'damage': 4,
                                            'target': TARGET_VILLAIN
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
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': '¡Soy Duro!',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino15.webp',
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_TOUGH,
                                        'params': {
                                            'target': TARGET_VILLAIN
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
            },
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Estampida',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino17.webp',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED_ALTEREGO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_SURGE,
                                        'params': {}
                                    }
                                }
                            },
                            {
                                'type': ABILITY_WHEN_REVEALED_HERO,
                                'params': {
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
                                                    'type': EFFECT_DO_IF_TAKE_DAMAGE,
                                                    'params': {
                                                        'source': 'effects.0',
                                                        'target': TARGET_YOUR_HERO,
                                                        'effect': {
                                                            'type': EFFECT_STUN,
                                                            'params': {
                                                                'target': TARGET_YOUR_HERO
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Arramblar con todo',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino20.webp',
                        'boost': 2,
                        'icons': {
                            'hazard': 1
                        },
                        'startingThreat': 2,
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
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Control de multitudes',
                        'set': 'rhino',
                        'image': 'scenarios/rhino/rhino21.webp',
                        'boost': 2,
                        'icons': {
                            'crisis': true
                        },
                        'startingThreat': [
                            2,
                            true
                        ]
                    }
                }
            }
        ]
    }
};
