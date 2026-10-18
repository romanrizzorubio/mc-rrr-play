import {
    ABILITY_CONSTANT,
    ABILITY_HERO_RESPONSE,
    ABILITY_RESPONSE,
    CALC_ALL,
    CARD_TYPE_UPGRADE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_READY,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    EFFECT_MODIFY_ATTACK_CONSEQUENCIAL,
    LABEL_ATTACK,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ANY_PLAYER,
    TARGET_ALLY,
    TARGET_ENEMY,
    TARGET_ATTACKER,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TARGET_THIS,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ASGARD,
    TRAIT_CONDITION,
    TRAIT_PREPARATION,
    TRAIT_SKILL,
    TRAIT_TACTIC,
    TRAIT_WEAPON,
    TRIGGER_ATTACHED_GET_ATTACK,
    TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_YOU_ATTACK,
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
                'set': 'aggression',
                'image': 'aspect/aggression/upgrades/a57-copy-2.webp',
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
                'set': 'aggression',
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
                'set': 'aggression',
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
                'set': 'aggression',
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
                'set': 'aggression',
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
    }
];
