import {
    CLASSIFICATION_AGGRESSION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_RESOURCE,
    ABILITY_RESPONSE,
    CALC_ALL,
    CARD_TYPE_UPGRADE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_EXCESS_DAMAGE,
    EFFECT_READY,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    EFFECT_MODIFY_ATTACK_CONSEQUENCIAL,
    LABEL_ATTACK,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ANY_PLAYER,
    TARGET_ALLY,
    TARGET_ENEMY,
    TARGET_ATTACKER,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ASGARD,
    TRAIT_ATTACK,
    TRAIT_CONDITION,
    TRAIT_PREPARATION,
    TRAIT_SKILL,
    TRAIT_TACTIC,
    TRAIT_TECH,
    TRAIT_WEAPON,
    TRIGGER_ATTACHED_GET_ATTACK,
    TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_ATTACK,
    TRIGGER_YOU_WOULD_DEAL_EXCESS_DAMAGE,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
    TRIGGER_YOUR_HERO_GET_ATTACK
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-entrenamiento-de-combate',
        'aspect': 'aggression',
        'order': 7,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Entrenamiento de combate',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/01057.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
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
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-enfurecido',
        'aspect': 'aggression',
        'order': 20,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Enfurecido',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/03031.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'attach': TARGET_ALLY,
                'maxAttach': 1,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_ATTACHED_GET_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 2
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_CONSEQUENCIAL,
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
        '_id': 'aggression-furia-de-combate',
        'aspect': 'aggression',
        'order': 65,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Furia de combate',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/06018.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'controllerTarget': TARGET_ANY_PLAYER,
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
                            'condition': {
                                'effect.selectedTarget.isMinion': true
                            },
                            'arrow': {
                                'type': EFFECT_SIMULTANEOUS,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_TAKE_DAMAGE,
                                            'params': {
                                                'target': TARGET_YOUR_HERO,
                                                'damage': 1
                                            }
                                        },
                                        {
                                            'type': EFFECT_DISCARD_GAME,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_READY,
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
        '_id': 'aggression-jarnbjorn',
        'aspect': 'aggression',
        'order': 66,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Jarnbjorn',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/06019.png',
                'traits': [
                    TRAIT_ASGARD,
                    TRAIT_WEAPON
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'restricted': true,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOU_ATTACK,
                            'condition': {
                                'effect.activation.character.isHero': true
                            },
                            'arrow': {
                                'type': EFFECT_SPEND,
                                'params': {
                                    'resources': [
                                        RESOURCE_PHYSICAL
                                    ]
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
        '_id': 'aggression-contraataque',
        'aspect': 'aggression',
        'order': 67,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Contraataque',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/08030.png',
                'traits': [
                    TRAIT_PREPARATION,
                    TRAIT_TACTIC
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'trigger': TRIGGER_CHARACTER_TAKES_DAMAGE,
                            'triggerParams': {
                                'target': TARGET_YOUR_SUPERHERO
                            },
                            'condition': {
                                'effect.isAttack': true,
                                'effect.activation.character.isEnemy': true
                            },
                            'arrow': {
                                'type': EFFECT_DISCARD_GAME,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ATTACKER,
                                    'paramsCalc': {
                                        'target': 'triggeredTargetDamage',
                                        'formula': CALC_ALL
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
        '_id': 'aggression-destreza-marcial',
        'aspect': 'aggression',
        'order': 68,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Destreza marcial',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/10018.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'controllerTarget': TARGET_ANY_PLAYER,
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_RESOURCE,
                        'params': {
                            'resource': RESOURCE_PHYSICAL,
                            'condition': {
                                'cardToPay.isEvent': true,
                                'cardToPay.traits': TRAIT_ATTACK
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
        '_id': 'aggression-al-acecho',
        'aspect': 'aggression',
        'order': 13017,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Al acecho',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/13017.png',
                'traits': [
                    TRAIT_PREPARATION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': CLASSIFICATION_AGGRESSION,
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'trigger': TRIGGER_ENGAGE_HERO,
                            'condition': {
                                'triggeredCard.isMinion': true
                            },
                            'arrow': {
                                'type': EFFECT_DISCARD_GAME,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_TRIGGERED_CARD,
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
        '_id': 'aggression-fuerza-bruta',
        'aspect': 'aggression',
        'order': 14029,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Fuerza bruta',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/14029.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_AGGRESSION,
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
                            'trigger': TRIGGER_YOU_ATTACK,
                            'condition': {
                                'effect.ability.isBasic': true
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'modify': {
                                        'keywords': {
                                            'piercing': true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_FORCED_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOU_BASIC_ATTACK,
                            'effect': {
                                'type': EFFECT_DISCARD_GAME,
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
        '_id': 'aggression-ensanamiento',
        'aspect': CLASSIFICATION_AGGRESSION,
        'order': 16045,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Ensañamiento',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/16045.png',
                'traits': [TRAIT_SKILL],
                'cost': 2,
                'resources': [RESOURCE_MENTAL],
                'classification': CLASSIFICATION_AGGRESSION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_YOU_WOULD_DEAL_EXCESS_DAMAGE,
                            'condition': {
                                'effect.activation.excessDamage': '>0',
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_EXCESS_DAMAGE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 1,
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
    {
        '_id': 'aggression-pistolon',
        'aspect': CLASSIFICATION_AGGRESSION,
        'order': 16046,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Pistolón',
                'set': CLASSIFICATION_AGGRESSION,
                'image': 'aspect/aggression/upgrades/16046.png',
                'traits': [TRAIT_TECH, TRAIT_WEAPON],
                'cost': 2,
                'resources': [RESOURCE_PHYSICAL],
                'classification': CLASSIFICATION_AGGRESSION,
                'keywords': {
                    'restricted': true,
                    'uses': 3,
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_YOU_BASIC_ATTACK,
                            'condition': {
                                'effect.character.isHero': true,
                            },
                            'arrow': {
                                'type': EFFECT_SIMULTANEOUS,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS,
                                            },
                                        },
                                        {
                                            'type': EFFECT_REMOVE_COUNTER,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1,
                                            },
                                        },
                                    ],
                                },
                            },
                            'effect': {
                                'type': EFFECT_SIMULTANEOUS,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_MODIFY_ATTACK_VALUE,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'count': 2,
                                            },
                                        },
                                        {
                                            'type': EFFECT_MODIFY_ATTACK,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'modify': {
                                                    'keywords': {
                                                        'overkill': true,
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
];
