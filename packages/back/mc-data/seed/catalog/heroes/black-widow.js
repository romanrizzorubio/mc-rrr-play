import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_OPTION,
    ABILITY_RESOURCE,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_ALL,
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
    EFFECT_CANCEL_BOOST_ICONS,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_MODIFY_ACTIVATION,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_SCHEME_VALUE,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_SURGE,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ACTIVATION,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_PHASE,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TARGET_VILLAIN,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_LOCATION,
    TRAIT_PREPARATION,
    TRAIT_SHIELD,
    TRAIT_SKILL,
    TRAIT_SPY,
    TRAIT_TECH,
    TRAIT_THWART,
    TRIGGER_ABILITY_RESOLVED,
    TRIGGER_BOOST_REVEALED,
    TRIGGER_INSTANT,
    TRIGGER_MINION_ENTER_PLAY,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_THIS_GET_SCHEME,
    TRIGGER_THIS_PLAY_CARD,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
} from 'mc-shared';

import {hydraMercenary} from '../encounters/minions.js';
import {withCardSet} from '../with-card-set.js';

const blackWidowSet = 'Black Widow';
const preparationCount = {
    'target': 'player.upgrades',
    'formula': CALC_COUNT,
    'conditions': {
        'traits': TRAIT_PREPARATION
    },
    'multiply': -1
};

export default {
    '_id': 'black-widow',
    'order': 10,
    'name': 'Viuda Negra',
    'folder': 'black-widow',
    'config': {
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Natasha Romanoff',
                    'set': blackWidowSet,
                    'image': 'heroes/black-widow/08001b.png',
                    'traits': [
                        TRAIT_SHIELD,
                        TRAIT_SPY
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 3,
                    'handSize': 6,
                    'hitPoints': 9,
                    'abilities': [
                        {
                            'type': ABILITY_RESPONSE,
                            'params': {
                                'name': 'Preparativos para la misión',
                                'trigger': TRIGGER_YOU_END_PLAY_CARD,
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_PHASE
                                },
                                'condition': {
                                    'effect.card.traits': TRAIT_PREPARATION
                                },
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
            },
            {
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Viuda Negra',
                    'set': blackWidowSet,
                    'image': 'heroes/black-widow/08001a.png',
                    'traits': [
                        TRAIT_AVENGER,
                        TRAIT_SPY
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 2,
                    'attack': 2,
                    'defense': 2,
                    'handSize': 5,
                    'hitPoints': 9,
                    'abilities': [
                        {
                            'type': ABILITY_HERO_RESPONSE,
                            'params': {
                                'name': 'Hacedora de viudas',
                                'trigger': TRIGGER_ABILITY_RESOLVED,
                                'condition': {
                                    'resolvedAbility.card.traits': TRAIT_PREPARATION
                                },
                                'effect': {
                                    'type': EFFECT_DEAL_DAMAGE,
                                    'params': {
                                        'target': TARGET_ENEMY,
                                        'damage': 1
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
                        'name': 'Soldado de Invierno',
                        'subtitle': 'Bucky Barnes',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08002.png',
                        'traits': [
                            TRAIT_AVENGER,
                            TRAIT_SPY
                        ],
                        'unique': true,
                        'cost': 4,
                        'resources': [
                            RESOURCE_WILD
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'attack': 2,
                        'thwart': 2,
                        'attackConsequential': 1,
                        'thwartConsequential': 1,
                        'hitPoints': 4,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'workInHand': true,
                                    'trigger': TRIGGER_THIS_PLAY_CARD,
                                    'effect': {
                                        'type': EFFECT_MODIFY_COST,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'paramsCalc': preparationCount
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
                        'name': 'Operación encubierta',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08003.png',
                        'traits': [
                            TRAIT_THWART
                        ],
                        'cost': 3,
                        'resources': [
                            RESOURCE_MENTAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_ACTION,
                                'params': {
                                    'labels': [
                                        LABEL_THWART
                                    ],
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_REMOVE_THREAT,
                                                    'params': {
                                                        'target': TARGET_SCHEME,
                                                        'threat': 4
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_CONFUSE,
                                                    'params': {
                                                        'target': TARGET_VILLAIN
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
                        'name': 'Danza mortal',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08004.png',
                        'traits': [
                            TRAIT_ATTACK
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
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 1,
                                                        'isAttack': true
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 2,
                                                        'isAttack': true
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 3,
                                                        'isAttack': true
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
                        'name': 'Piso franco n.º 29',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08005.png',
                        'traits': [
                            TRAIT_LOCATION,
                            TRAIT_SHIELD
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
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
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
                                                        'filter': {
                                                            'traits': [
                                                                TRAIT_PREPARATION
                                                            ]
                                                        },
                                                        'title': 'Elige una carta de PLANIFICACIÓN en tu pila de descartes',
                                                        'requireMatch': true
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
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Combate acrobático',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08006.png',
                        'traits': [
                            TRAIT_ATTACK,
                            TRAIT_PREPARATION,
                            TRAIT_SKILL
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_INTERRUPT,
                                'params': {
                                    'labels': [
                                        LABEL_ATTACK
                                    ],
                                    'trigger': TRIGGER_BOOST_REVEALED,
                                    'arrow': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_CANCEL_BOOST_ICONS,
                                                    'params': {
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Brazaletes de la Viuda Negra',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08007.png',
                        'traits': [
                            TRAIT_TECH
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_PHYSICAL
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_RESOURCE,
                                'params': {
                                    'resource': RESOURCE_WILD,
                                    'condition': {
                                        'cardToPay.traits': TRAIT_PREPARATION
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_UPGRADE,
                    'params': {
                        'name': 'Gancho de escalada',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08008.png',
                        'traits': [
                            TRAIT_PREPARATION,
                            TRAIT_TECH
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
                                    'trigger': TRIGGER_TREACHERY_REVEAL,
                                    'arrow': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_CANCEL_ENCOUNTER,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'type': CARD_TYPE_TREACHERY,
                                            'full': true
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
                        'name': 'Traje sintético',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08009.png',
                        'traits': [
                            TRAIT_ARMOR,
                            TRAIT_TECH
                        ],
                        'unique': true,
                        'cost': 3,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_YOUR_HERO_GET_DEFENSE,
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
                                'type': ABILITY_HERO_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_ABILITY_RESOLVED,
                                    'condition': {
                                        'resolvedAbility.card.traits': TRAIT_PREPARATION
                                    },
                                    'arrow': {
                                        'type': EFFECT_EXHAUST,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_READY,
                                        'params': {
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
                        'name': 'Picadura de Viuda',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08010.png',
                        'traits': [
                            TRAIT_PREPARATION,
                            TRAIT_TECH
                        ],
                        'cost': 1,
                        'resources': [
                            RESOURCE_ENERGY
                        ],
                        'classification': CLASSIFICATION_HERO,
                        'abilities': [
                            {
                                'type': ABILITY_HERO_RESPONSE,
                                'params': {
                                    'labels': [
                                        LABEL_ATTACK
                                    ],
                                    'trigger': TRIGGER_MINION_ENTER_PLAY,
                                    'arrow': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    },
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_TRIGGERED_CARD,
                                                        'damage': 2
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_STUN,
                                                    'params': {
                                                        'target': TARGET_TRIGGERED_CARD
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
        ],
        'precon': [
            {
                'aspect': 'basic',
                'cardRefs': [
                    {'id': 'basic-nick-fury', 'count': 1},
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-genius', 'count': 1},
                    {'id': 'basic-quintransporte', 'count': 1},
                    {'id': 'basic-objetivo-fijado', 'count': 3}
                ]
            },
            {
                'aspect': 'justice',
                'cardRefs': [
                    {'id': 'justice-agente-coulson', 'count': 1},
                    {'id': 'justice-temblor', 'count': 1},
                    {'id': 'justice-ataque-sigiloso', 'count': 3},
                    {'id': 'justice-the-power-of-justice', 'count': 2},
                    {'id': 'justice-interrogation-room', 'count': 2},
                    {'id': 'justice-surveillance-team', 'count': 2},
                    {'id': 'justice-contraespionaje', 'count': 3},
                    {'id': 'justice-tacticas-de-infiltracion', 'count': 3}
                ]
            }
        ],
        'obligation': {
            'count': 1,
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'En la lista negra',
                    'set': blackWidowSet,
                    'image': 'heroes/black-widow/08025.png',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Adopta la identidad de alter ego',
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
                                'name': 'Resuelve la obligación',
                                'effect': {
                                    'type': EFFECT_CHOOSE_ABILITY,
                                    'params': {
                                        'options': [
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Agota a Natasha Romanoff y retira esta obligación del juego',
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
                                                    'name': 'Descarta una carta de <PLANIFICACIÓN> con el coste más alto que controles',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_DISCARD_GAME,
                                                                    'params': {
                                                                        'target': TARGET_UPGRADE_YOU_CONTROL,
                                                                        'condition': {
                                                                            'traits': TRAIT_PREPARATION,
                                                                            'cost': {
                                                                                'operator': 'max',
                                                                                'defaultValue': 0
                                                                            }
                                                                        },
                                                                        'refreshTarget': true
                                                                    }
                                                                },
                                                                {
                                                                    'type': EFFECT_DO_IF,
                                                                    'params': {
                                                                        'condition': {
                                                                            'effects.0.resolved': false
                                                                        },
                                                                        'effect': {
                                                                            'type': EFFECT_SURGE
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
                        'name': 'Supervisor',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08026.png',
                        'traits': [
                            TRAIT_HYDRA,
                            TRAIT_ELITE
                        ],
                        'unique': true,
                        'nemesis': true,
                        'boost': 0,
                        'attack': 0,
                        'scheme': 0,
                        'hitPoints': 4,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_THIS_GET_ATTACK,
                                    'effect': {
                                        'type': EFFECT_MODIFY_ATTACK_VALUE,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'paramsCalc': {
                                                'target': 'player.upgrades',
                                                'formula': CALC_COUNT
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_THIS_GET_SCHEME,
                                    'effect': {
                                        'type': EFFECT_MODIFY_SCHEME_VALUE,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'paramsCalc': {
                                                'target': 'player.upgrades',
                                                'formula': CALC_COUNT
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'effect': {
                                    'type': EFFECT_MODIFY_ACTIVATION,
                                    'params': {
                                        'target': TARGET_ACTIVATION,
                                        'attack': true,
                                        'scheme': true,
                                        'paramsCalc': {
                                            'target': 'player.upgrades',
                                            'formula': CALC_COUNT
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
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Asesino de alquiler',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08027.png',
                        'boost': 3,
                        'icons': {
                            'acceleration': 1
                        },
                        'startingThreat': 3,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'threat': [1, true]
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
                'card': withCardSet(hydraMercenary, blackWidowSet)
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Disparo letal',
                        'set': blackWidowSet,
                        'image': 'heroes/black-widow/08029.png',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED_ALTEREGO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_GAME,
                                                    'params': {
                                                        'target': TARGET_UPGRADE_YOU_CONTROL
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_PLACE_THREAT,
                                                    'params': {
                                                        'target': TARGET_MAIN_SCHEME,
                                                        'threat': 1
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_WHEN_REVEALED_HERO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DISCARD_GAME,
                                                    'params': {
                                                        'target': TARGET_UPGRADE_YOU_CONTROL
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_YOUR_SUPERHERO,
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
            }
        ]
    }
};
