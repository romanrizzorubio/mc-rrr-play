import {
    ABILITY_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_RESPONSE,
    CALC_ALL,
    CALC_ATTACK,
    CARD_TYPE_EVENT,
    CHARACTER_VILLAIN,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CANCEL_BOOST_ICONS,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_HEAL,
    EFFECT_ENEMY_ATTACK,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_STUN,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_ATTACKER,
    TARGET_ENEMY,
    TARGET_HERO,
    TARGET_PLAYER,
    TARGET_YOU,
    TARGET_VILLAIN,
    TRAIT_ATTACK,
    TRAIT_DEFENSE,
    TRIGGER_BOOST_REVEALED,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_VILLAIN_ATTACKS_YOU
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
                'set': 'protection',
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
                            'trigger': TRIGGER_VILLAIN_ATTACKS_YOU,
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
                'set': 'protection',
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
                                                'target': TARGET_EFFECT
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
                'set': 'protection',
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
                'set': 'protection',
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
                'set': 'protection',
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
                'set': 'protection',
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

];
