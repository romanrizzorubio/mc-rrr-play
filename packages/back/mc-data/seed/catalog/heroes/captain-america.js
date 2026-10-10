import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESOURCE,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
    CALC_HALF_ROUNDED_DOWN,
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
    EFFECT_ADD_KEYWORD,
    EFFECT_CANNOT,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DRAW_CARD,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_PREVENT_DEFEAT,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_RETURN_HAND,
    EFFECT_SEARCH_CARDS,
    EFFECT_SET_LIFE,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_PLAYERS,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_ENGAGED_HERO,
    TARGET_SCHEME,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TIME_PHASE,
    TARGET_ROUND,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_DEFENSE,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_ITEM,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRAIT_SOLDIER,
    TRAIT_SUPERPOWER,
    TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
    TRIGGER_CONDITION_GET_DEFENSE,
    TRIGGER_INSTANT,
    TRIGGER_PLAYER_CAN_THAWRT,
    TRIGGER_PLAY_CARD,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_YOU_WOULD_TAKE_DAMAGE,
} from 'mc-shared';

import {hydraSoldier} from '../encounters/minions.js';

export default {
    '_id': 'captain-america',
    'order': 5,
    'name': 'Capitán América',
    'folder': 'captain-america',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Steve Rogers',
                    'set': 'Captain America',
                    'image': 'heroes/captain-america/03001b.png',
                    'traits': [
                        TRAIT_SHIELD,
                        TRAIT_SOLDIER
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 3,
                    'handSize': 6,
                    'hitPoints': 11,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'name': 'Leyenda viviente',
                                'trigger': TRIGGER_PLAY_CARD,
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_ROUND
                                },
                                'condition': {
                                    'effect.card.isAlly': true
                                },
                                'effect': {
                                    'type': EFFECT_MODIFY_COST,
                                    'params': {
                                        'target': TARGET_EFFECT,
                                        'count': -1
                                    }
                                }
                            }
                        },
                        {
                            'type': ABILITY_SETUP,
                            'params': {
                                'name': 'Preparación',
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
                                                        'name': 'Escudo del Capitán América'
                                                    },
                                                    'requireMatch': true,
                                                    'title': 'Busca el Escudo del Capitán América'
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
                    ]
                }
            },
            {
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Capitán América',
                    'set': 'Captain America',
                    'image': 'heroes/captain-america/03001a.png',
                    'traits': [
                        TRAIT_AVENGER,
                        TRAIT_SOLDIER
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 2,
                    'attack': 2,
                    'defense': 2,
                    'handSize': 5,
                    'hitPoints': 11,
                    'abilities': [
                        {
                            'type': ABILITY_ACTION,
                            'params': {
                                'name': '¡Aguantaría todo el día!',
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_ROUND
                                },
                                'arrow': {
                                    'type': EFFECT_SELECT_DISCARD_CARD,
                                    'params': {
                                        'target': TARGET_YOU,
                                        'count': 1,
                                        'title': 'Descarta una carta de tu mano'
                                    }
                                },
                                'effect': {
                                    'type': EFFECT_READY,
                                    'params': {
                                        'target': TARGET_THIS
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
                        'name': 'Agente 13',
                        'subtitle': 'Sharon Carter',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03002.png',
                        'traits': [
                            TRAIT_SHIELD
                        ],
                        'unique': true,
                        'cost': 3,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'thwart': 2,
                        'attack': 1,
                        'thwartConsequencial': 1,
                        'attackConsequencial': 1,
                        'hitPoints': 3,
                        'abilities': [
                            {
                                'type': ABILITY_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_THIS_ENTER_PLAY,
                                    'effect': {
                                        'type': EFFECT_REMOVE_THREAT,
                                        'params': {
                                            'target': TARGET_SCHEME,
                                            'threat': 2
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
                        'name': 'Determinación audaz',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03003.png',
                        'traits': [
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 0,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_LASTING,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
                                                        'until': TIME_PHASE,
                                                        'effect': {
                                                            'type': EFFECT_MODIFY_THWART_VALUE,
                                                            'params': {
                                                                'target': TARGET_YOUR_HERO,
                                                                'count': 1
                                                            }
                                                        }
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
                'count': 3,
                'card': {
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Golpe heroico',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03004.png',
                        'traits': [
                            TRAIT_ATTACK
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
                                                        'target': TARGET_ENEMY,
                                                        'damage': 6
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DO_IF_HAS_PAID,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'resources': [
                                                            RESOURCE_PHYSICAL
                                                        ],
                                                        'effect': {
                                                            'type': EFFECT_STUN,
                                                            'params': {
                                                                'target': TARGET_ENEMY
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
                    'type': CARD_TYPE_EVENT,
                    'params': {
                        'name': 'Bloqueo de escudo',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03005.png',
                        'traits': [
                            TRAIT_DEFENSE
                        ],
                        'cost': 0,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_INTERRUPT,
                                'params': {
                                    'labels': [
                                        LABEL_DEFENSE
                                    ],
                                    'trigger': TRIGGER_YOU_WOULD_TAKE_DAMAGE,
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_UPGRADE_YOU_CONTROL,
                                            'condition': {
                                                'name': 'Escudo del Capitán América'
                                            }
                                        }
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
                        'name': 'Lanzamiento de escudo',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03006.png',
                        'traits': [
                            TRAIT_ATTACK,
                            TRAIT_SUPERPOWER
                        ],
                        'cost': 0,
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
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_SELECT_DISCARD_CARD,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                        'paramsCalc': {
                                                            'target': 'player.match.enemies',
                                                            'formula': CALC_COUNT
                                                        },
                                                        'upTo': true,
                                                        'minCount': 0,
                                                        'title': 'Descarta cualquier número de cartas de tu mano'
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_RETURN_HAND,
                                                    'params': {
                                                        'target': TARGET_UPGRADE_YOU_CONTROL,
                                                        'condition': {
                                                            'name': 'Escudo del Capitán América'
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'damage': 4,
                                            'multipleTarget': true,
                                            'targetCountCalc': {
                                                'target': 'effect.ability.arrow.cost.effects.0.cards',
                                                'formula': CALC_COUNT
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
                        'name': 'Apartamento de Steve',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03007.png',
                        'traits': [
                            TRAIT_LOCATION
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
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DRAW_CARD,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                        'count': 1
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_HEAL,
                                                    'params': {
                                                        'target': TARGET_ALTEREGO,
                                                        'damage': 1
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
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Casco del Capitán América',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03008.png',
                        'traits': [
                            TRAIT_ARMOR
                        ],
                        'unique': true,
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
                                    'condition': {
                                        'effect.selectedTarget.name': 'Capitán América'
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
                                                    'type': EFFECT_SET_LIFE,
                                                    'params': {
                                                        'target': TARGET_YOUR_SUPERHERO,
                                                        'life': 1
                                                    }
                                                }
                                            ],
                                            'thenEffect': {
                                                'type': EFFECT_DISCARD_GAME,
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
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Escudo del Capitán América',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03009.png',
                        'traits': [
                            TRAIT_ITEM
                        ],
                        'unique': true,
                        'cost': 1,
                        'resources': [
                            RESOURCE_WILD
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'keywords': {
                            'restricted': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_THIS_ENTER_PLAY,
                                    'effect': {
                                        'type': EFFECT_ADD_KEYWORD,
                                        'params': {
                                            'target': TARGET_ALL_CHARACTERS,
                                            'condition': {
                                                'name': 'Capitán América'
                                            },
                                            'keyword': {
                                                'retaliate': 1
                                            }
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
                                            'name': 'Capitán América'
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
                        'name': 'Suero de supersoldado',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03010.png',
                        'traits': [
                            TRAIT_ITEM
                        ],
                        'cost': 2,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_RESOURCE,
                                'params': {
                                    'resource': RESOURCE_PHYSICAL,
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
            }
        ],
        'precon': [
            {
                'aspect': 'basic',
                'cardRefs': [
                    {'id': 'basic-mockingbird', 'count': 1},
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-genius', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-avengers-tower', 'count': 1},
                    {'id': 'basic-honorary-avenger', 'count': 3},
                ]
            },
            {
                'aspect': 'leadership',
                'cardRefs': [
                    {'id': 'leadership-falcon', 'count': 1},
                    {'id': 'leadership-ojo-de-halcon', 'count': 1},
                    {'id': 'leadership-squirrel-girl', 'count': 1},
                    {'id': 'leadership-wonder-man', 'count': 1},
                    {'id': 'leadership-avengers-assemble', 'count': 3},
                    {'id': 'leadership-hacer-la-llamada', 'count': 2},
                    {'id': 'leadership-superioridad-numerica', 'count': 3},
                    {'id': 'leadership-el-poder-del-liderazgo', 'count': 2},
                    {'id': 'leadership-quinjet', 'count': 3},
                ]
            }
        ],
        'obligation': {
            'count': 1,
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'El hombre fuera del tiempo',
                    'set': 'Captain America',
                    'image': 'heroes/captain-america/03026.png',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Adoptar la identidad de alter ego',
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
                                                    'name': 'Agota a Steve Rogers y retira la obligación del juego',
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
                                                    'name': 'Descarta la mitad de tu mano y esta obligación',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_SELECT_DISCARD_CARD,
                                                                    'params': {
                                                                        'target': TARGET_YOU,
                                                                        'paramsCalc': {
                                                                            'target': 'player.hand.cards',
                                                                            'formula': CALC_HALF_ROUNDED_DOWN
                                                                        },
                                                                        'title': 'Descarta la mitad de tu mano'
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
                        'name': 'Escuadrón de la muerte',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03027.png',
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
                                        'type': EFFECT_FOR_EACH,
                                        'params': {
                                            'target': TARGET_ALL_PLAYERS,
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
                                                            'type': EFFECT_TAKE_DAMAGE,
                                                            'params': {
                                                                'target': TARGET_YOUR_SUPERHERO,
                                                                'damage': 0,
                                                                'paramsCalc': {
                                                                    'target': 'effects.0.cards.0.boost'
                                                                }
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
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Barón Zemo',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03028.png',
                        'traits': [
                            TRAIT_HYDRA,
                            TRAIT_ELITE
                        ],
                        'unique': true,
                        'nemesis': true,
                        'boost': 2,
                        'attack': 3,
                        'scheme': 1,
                        'hitPoints': 5,
                        'keywords': {
                            'quickStrike': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'hideDialog': true,
                                    'trigger': TRIGGER_PLAYER_CAN_THAWRT,
                                    'effect': {
                                        'type': EFFECT_CANNOT,
                                        'params': {
                                            'restriction': 'thwart',
                                            'sourceIn': 'player.minions',
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
                'card': hydraSoldier
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': '¡Hail Hydra!',
                        'set': 'Captain America',
                        'image': 'heroes/captain-america/03030.png',
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
                                                    'type': EFFECT_SEVERAL_ATTACKS,
                                                    'params': {
                                                        'enemiesType': TARGET_ALL_ENEMIES,
                                                        'enemiesCondition': {
                                                            'isMinion': true,
                                                            'traits': TRAIT_HYDRA
                                                        },
                                                        'attackTarget': TARGET_ENGAGED_HERO
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_FOR_EACH,
                                                    'params': {
                                                        'target': TARGET_ALL_PLAYERS,
                                                        'condition': {
                                                            'exclude': [
                                                                'effects.0.attacks.*.selectedTarget',
                                                                'effects.0.attacks.*.defender.owner'
                                                            ]
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_CHAINED,
                                                            'params': {
                                                                'effects': [
                                                                    {
                                                                        'type': EFFECT_SEARCH_CARDS,
                                                                        'params': {
                                                                            'locations': [
                                                                                PLACE_ENCOUNTER_DECK_CARDS,
                                                                                PLACE_ENCOUNTER_DISCARD
                                                                            ],
                                                                            'filter': {
                                                                                'type': CARD_TYPE_MINION,
                                                                                'traits': TRAIT_HYDRA
                                                                            },
                                                                            'title': 'Busca un Esbirro Hydra'
                                                                        }
                                                                    },
                                                                    {
                                                                        'type': EFFECT_ENGAGE,
                                                                        'params': {
                                                                            'target': TARGET_YOU
                                                                        }
                                                                    },
                                                                    {
                                                                        'type': EFFECT_DO_IF,
                                                                        'params': {
                                                                            'condition': {
                                                                                'effects.0.locations': PLACE_ENCOUNTER_DECK_CARDS
                                                                            },
                                                                            'effect': {
                                                                                'type': EFFECT_SHUFFLE_DECK,
                                                                                'params': {
                                                                                    'target': TARGET_SCENARIO
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
                        ]
                    }
                }
            }
        ]
    }
};
