import {
    CLASSIFICATION_PROTECTION,
    ABILITY_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESPONSE,
    ABILITY_RESPONSE,
    CALC_ALL,
    CALC_ATTACK,
    CALC_THWART,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_EVENT,
    CHARACTER_VILLAIN,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CANCEL_BOOST_ICONS,
    EFFECT_CHAINED,
    EFFECT_COUNT_BOOST_ICONS,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_HEAL,
    EFFECT_ENEMY_ATTACK,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_ATTACKER,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_HERO,
    TARGET_MAIN_SCHEME,
    TARGET_PLAYER,
    TARGET_SCHEME,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TARGET_VILLAIN,
    TRAIT_AERIAL,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_DEFENSE,
    TRAIT_SKILL,
    TRAIT_TACTIC,
    TRIGGER_BOOST_REVEALED,
    TRIGGER_ENEMY_ATTACKS,
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_HERO_DEFENDED_ATTACK,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';

export default [
    {
        '_id': 'protection-contragolpe',
        'aspect': 'protection',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Contragolpe',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/01077.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'name': 'Contragolpe',
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'trigger': TRIGGER_ENEMY_ATTACKS_YOU,
                            'condition': {
                                'effect.isDefended': true,
                                'effect.defender.isHero': true
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ATTACKER,
                                    'paramsCalc': {
                                        'target': 'player.superhero.currentSide',
                                        'formula': CALC_ATTACK
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
        '_id': 'protection-poneos-detras-de-mi',
        'aspect': 'protection',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Poneos detrás de mí!',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/01078.png',
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'name': '¡Poneos detrás de mí!',
                            'trigger': TRIGGER_TREACHERY_REVEAL,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_CANCEL_ENCOUNTER,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'type': CARD_TYPE_TREACHERY
                                            }
                                        },
                                        {
                                            'type': EFFECT_ENEMY_ATTACK,
                                            'params': {
                                                'enemyType': CHARACTER_VILLAIN,
                                                'target': TARGET_PLAYER
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
        '_id': 'protection-defensa-habil',
        'aspect': 'protection',
        'order': 20,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Defensa hábil',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/03033.png',
                'traits': [
                    TRAIT_DEFENSE
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'name': 'Defensa hábil',
                            'labels': [
                                LABEL_DEFENSE
                            ],
                            'trigger': TRIGGER_HERO_DEFENDS_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                'params': {
                                    'requiresPrePlayConfirmation': true,
                                    'target': TARGET_EFFECT,
                                    'count': 3
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'protection-ataque-preventivo',
        'aspect': 'protection',
        'order': 30,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Ataque preventivo',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/05014.png',
                'traits': [
                    TRAIT_DEFENSE
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [
                                LABEL_DEFENSE
                            ],
                            'trigger': TRIGGER_BOOST_REVEALED,
                            'condition': {
                                'effect.enemyActivation.enemy.isVillain': true,
                                'effect.enemyActivation.isAttack': true,
                                'effect.hasCancelableBoostIcons': true
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_CANCEL_BOOST_ICONS,
                                            'params': {
                                                'requiresPrePlayConfirmation': true,
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
        '_id': 'protection-arremetida',
        'aspect': 'protection',
        'order': 31,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Arremetida',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/05015.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_STUN,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'thenEffect': {
                                        'type': EFFECT_DO_IF_HAS_PAID,
                                        'params': {
                                            'target': TARGET_ENEMY,
                                            'resources': [
                                                RESOURCE_PHYSICAL
                                            ],
                                            'effect': {
                                                'type': EFFECT_DEAL_DAMAGE,
                                                'params': {
                                                    'target': TARGET_ENEMY,
                                                    'damage': 3
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
        '_id': 'protection-fuerzas-de-flaqueza',
        'aspect': 'protection',
        'order': 60,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Fuerzas de flaqueza',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/06033.png',
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_MENTAL
                                    ],
                                    'target': TARGET_HERO,
                                    'effect': {
                                        'type': EFFECT_HEAL,
                                        'params': {
                                            'target': TARGET_HERO,
                                            'damage': 5
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_HEAL,
                                        'params': {
                                            'target': TARGET_HERO,
                                            'damage': 4
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
        '_id': 'protection-defensa-desesperada',
        'aspect': 'protection',
        'order': 90,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Defensa desesperada',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/09015.png',
                'traits': [
                    TRAIT_DEFENSE
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [
                                LABEL_DEFENSE
                            ],
                            'trigger': TRIGGER_HERO_DEFENDS_ATTACK,
                            'condition': {
                                'effect.defender.isHero': true
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'count': 2
                                            }
                                        },
                                        {
                                            'type': EFFECT_DELAYED,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'effect': {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effect.activation.takenDamage': 0
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_READY,
                                                            'params': {
                                                                'target': TARGET_YOUR_HERO
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
        '_id': 'protection-invertir-las-tornas',
        'aspect': 'protection',
        'order': 91,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Invertir las tornas',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/09016.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'arrow': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'target': TARGET_YOUR_SUPERHERO,
                                    'damage': 2
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
        '_id': 'protection-armarse-de-valor',
        'aspect': 'protection',
        'order': 120,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Armarse de valor',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/12032.png',
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': CLASSIFICATION_PROTECTION,
                'paramsToPlay': {
                    'superhero.traits': TRAIT_AVENGER
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'name': 'Armarse de valor',
                            'effect': {
                                'type': EFFECT_TOUGH,
                                'params': {
                                    'target': TARGET_FRIENDLY_CHARACTER,
                                    'multipleTarget': true,
                                    'selectUpTo': true,
                                    'targetCountCalc': {
                                        'target': 'match.villain.stage',
                                        'max': 3
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
        '_id': 'protection-perseverancia',
        'aspect': 'protection',
        'order': 130,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Perseverancia',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/13033.png',
                'traits': [
                    TRAIT_TACTIC
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOUR_SUPERHERO_FLIPS,
                            'effect': {
                                'type': EFFECT_TOUGH,
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
        '_id': 'protection-ni-un-paso-atras',
        'aspect': 'protection',
        'order': 140,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Ni un paso atrás',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/14014.png',
                'traits': [TRAIT_DEFENSE],
                'cost': 1,
                'resources': [RESOURCE_PHYSICAL],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [LABEL_DEFENSE],
                            'trigger': TRIGGER_HERO_DEFENDS_ATTACK,
                            'condition': {
                                'effect.defender.isHero': true,
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'count': 2,
                                            },
                                        },
                                        {
                                            'type': EFFECT_DELAYED,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'effect': {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effect.activation.takenDamage': 0,
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_STUN,
                                                            'params': {
                                                                'target': TARGET_ATTACKER,
                                                            },
                                                        },
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
    {
        '_id': 'protection-esquiva-lateral',
        'aspect': 'protection',
        'order': 141,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Esquiva lateral',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/14015.png',
                'traits': [TRAIT_DEFENSE],
                'cost': 1,
                'resources': [RESOURCE_MENTAL],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'labels': [LABEL_DEFENSE],
                            'trigger': TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                            'triggerParams': {
                                'target': TARGET_YOUR_SUPERHERO,
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_PREVENT_DAMAGE,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'damage': 3,
                                            },
                                        },
                                        {
                                            'type': EFFECT_DO_IF_HAS_PAID,
                                            'params': {
                                                'resources': [RESOURCE_ENERGY],
                                                'target': TARGET_ENEMY,
                                                'effect': {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 1,
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
    {
        '_id': 'protection-maniobra-enganosa',
        'aspect': 'protection',
        'order': 150,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Maniobra engañosa',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/15030.png',
                'cost': 1,
                'resources': [RESOURCE_ENERGY],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'name': 'Maniobra engañosa',
                            'labels': [LABEL_THWART],
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
                                            'type': EFFECT_REMOVE_THREAT,
                                            'params': {
                                                'target': TARGET_MAIN_SCHEME,
                                                'threat': 4
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
        '_id': 'protection-en-plena-forma',
        'aspect': 'protection',
        'order': 16014,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'En plena forma',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/16014.png',
                'traits': [TRAIT_ATTACK],
                'cost': 2,
                'resources': [RESOURCE_PHYSICAL],
                'classification': CLASSIFICATION_PROTECTION,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [LABEL_ATTACK],
                            'effect': {
                                'type': EFFECT_DO_IF,
                                'params': {
                                    'target': TARGET_VILLAIN,
                                    'condition': {
                                        'player.superhero.life': {
                                            'operator': 'gte',
                                            'path': 'player.superhero.currentSide.card.hitPoints',
                                        },
                                    },
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_VILLAIN,
                                            'damage': 5,
                                        },
                                    },
                                    'effectNot': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_VILLAIN,
                                            'damage': 2,
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
    {
        '_id': 'protection-vigilancia-constante',
        'aspect': CLASSIFICATION_PROTECTION,
        'order': 17030,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Vigilancia constante',
                'set': CLASSIFICATION_PROTECTION,
                'image': 'aspect/protection/events/17030.png',
                'traits': [
                    TRAIT_AERIAL,
                    TRAIT_SKILL,
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL,
                ],
                'classification': CLASSIFICATION_PROTECTION,
                'paramsToPlay': {
                    'superhero.traits': TRAIT_AERIAL,
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_SIMULTANEOUS,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_READY,
                                            'params': {
                                                'target': TARGET_YOUR_HERO,
                                            },
                                        },
                                        {
                                            'type': EFFECT_REMOVE_THREAT,
                                            'params': {
                                                'target': TARGET_MAIN_SCHEME,
                                                'threat': 2,
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
    {
        _id: 'protection-primer-impacto',
        aspect: CLASSIFICATION_PROTECTION,
        order: 18015,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Primer impacto',
                set: CLASSIFICATION_PROTECTION,
                image: 'aspect/protection/events/18015.png',
                traits: [TRAIT_ATTACK],
                cost: 1,
                resources: [RESOURCE_ENERGY],
                classification: CLASSIFICATION_PROTECTION,
                abilities: [
                    {
                        type: ABILITY_HERO_ACTION,
                        params: {
                            labels: [LABEL_ATTACK],
                            effect: {
                                type: EFFECT_DEAL_DAMAGE,
                                params: {
                                    target: TARGET_VILLAIN,
                                    damage: 2,
                                },
                            },
                        },
                    },
                    {
                        type: ABILITY_HERO_INTERRUPT,
                        params: {
                            labels: [LABEL_ATTACK],
                            trigger: TRIGGER_ENEMY_ATTACKS_YOU,
                            condition: {'effect.enemy.isMinion': true},
                            effect: {
                                type: EFFECT_DEAL_DAMAGE,
                                params: {
                                    target: TARGET_ATTACKER,
                                    damage: 2,
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
    {
        _id: 'protection-brio',
        aspect: CLASSIFICATION_PROTECTION,
        order: 18031,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Brío',
                set: CLASSIFICATION_PROTECTION,
                image: 'aspect/protection/events/18031.png',
                cost: 1,
                resources: [RESOURCE_ENERGY],
                classification: CLASSIFICATION_PROTECTION,
                abilities: [
                    {
                        type: ABILITY_RESPONSE,
                        params: {
                            name: 'Brío',
                            labels: [LABEL_THWART],
                            trigger: TRIGGER_HERO_DEFENDED_ATTACK,
                            effect: {
                                type: EFFECT_REMOVE_THREAT,
                                params: {
                                    target: TARGET_SCHEME,
                                    threat: 0,
                                    paramsCalc: {
                                        target: 'player.superhero.currentSide',
                                        formula: CALC_THWART,
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
    {
        _id: 'protection-desvio',
        aspect: CLASSIFICATION_PROTECTION,
        order: 19015,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Desvío',
                set: CLASSIFICATION_PROTECTION,
                image: 'aspect/protection/events/19015.png',
                traits: [TRAIT_SKILL],
                cost: 2,
                resources: [RESOURCE_MENTAL],
                classification: CLASSIFICATION_PROTECTION,
                abilities: [
                    {
                        type: ABILITY_HERO_INTERRUPT,
                        params: {
                            trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                            triggerParams: {
                                target: TARGET_YOUR_SUPERHERO,
                            },
                            condition: {
                                'effect.isAttack': true,
                            },
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_PREVENT_DAMAGE,
                                            params: {
                                                target: TARGET_EFFECT,
                                                damage: 5,
                                                selectDamage: true,
                                            },
                                        },
                                        {
                                            type: EFFECT_DISCARD_FROM_DECK,
                                            params: {
                                                target: TARGET_YOU,
                                                count: 0,
                                                showDialog: true,
                                                paramsCalc: {
                                                    target: 'effects.0.preventedDamage',
                                                    formula: CALC_ALL,
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
    {
        _id: 'protection-una-dura-leccion',
        aspect: CLASSIFICATION_PROTECTION,
        order: 19016,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Una dura lección',
                set: CLASSIFICATION_PROTECTION,
                image: 'aspect/protection/events/19016.png',
                traits: [TRAIT_ATTACK],
                cost: 3,
                resources: [RESOURCE_PHYSICAL],
                classification: CLASSIFICATION_PROTECTION,
                abilities: [
                    {
                        type: ABILITY_HERO_ACTION,
                        params: {
                            labels: [LABEL_ATTACK],
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_DEAL_DAMAGE,
                                            params: {
                                                target: TARGET_ENEMY,
                                                damage: 4,
                                                isAttack: true,
                                            },
                                        },
                                        {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                condition: {
                                                    'effects.0.defeated': true,
                                                },
                                                effect: {
                                                    type: EFFECT_TOUGH,
                                                    params: {
                                                        target: TARGET_YOUR_HERO,
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
    {
        _id: 'protection-golpe-de-tanteo',
        aspect: CLASSIFICATION_PROTECTION,
        order: 19017,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Golpe de tanteo',
                set: CLASSIFICATION_PROTECTION,
                image: 'aspect/protection/events/19017.png',
                traits: [TRAIT_TACTIC],
                cost: 0,
                resources: [RESOURCE_ENERGY],
                classification: CLASSIFICATION_PROTECTION,
                abilities: [
                    {
                        type: ABILITY_HERO_INTERRUPT,
                        params: {
                            trigger: TRIGGER_YOU_BASIC_ATTACK,
                            condition: {
                                'effect.character.isHero': true,
                                'effect.ability.isBasic': true,
                            },
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_DISCARD_FROM_DECK,
                                            params: {
                                                target: TARGET_ENCOUNTER_DECK,
                                                count: 1,
                                            },
                                        },
                                        {
                                            type: EFFECT_COUNT_BOOST_ICONS,
                                            params: {
                                                card: 'effects.0.cards.0',
                                                showDialog: false,
                                            },
                                        },
                                        {
                                            type: EFFECT_MODIFY_ATTACK_VALUE,
                                            params: {
                                                target: TARGET_EFFECT,
                                                count: 0,
                                                paramsCalc: {
                                                    target: 'effects.1.value',
                                                    formula: CALC_ALL,
                                                    multiply: -1,
                                                },
                                            },
                                        },
                                        {
                                            type: EFFECT_DELAYED,
                                            params: {
                                                target: TARGET_EFFECT,
                                                effect: {
                                                    type: EFFECT_DO_IF,
                                                    params: {
                                                        condition: {
                                                            'effect.dealtDamage': '>0',
                                                        },
                                                        effect: {
                                                            type: EFFECT_READY,
                                                            params: {
                                                                target: TARGET_YOUR_HERO,
                                                            },
                                                        },
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
    {
        _id: 'protection-sometimiento',
        aspect: CLASSIFICATION_PROTECTION,
        order: 19018,
        card: {
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Sometimiento',
                set: CLASSIFICATION_PROTECTION,
                image: 'aspect/protection/events/19018.png',
                cost: 1,
                resources: [RESOURCE_ENERGY],
                classification: CLASSIFICATION_PROTECTION,
                abilities: [
                    {
                        type: ABILITY_HERO_INTERRUPT,
                        params: {
                            trigger: TRIGGER_ENEMY_ATTACKS,
                            effect: {
                                type: EFFECT_MODIFY_ATTACK,
                                params: {
                                    target: TARGET_EFFECT,
                                    modify: {
                                        modifyAttack: -3,
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
];
