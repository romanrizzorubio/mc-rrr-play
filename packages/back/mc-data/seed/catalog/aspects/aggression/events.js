import {
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_RESPONSE,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_REMOVE_THREAT,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_MINION,
    TARGET_SCHEME,
    TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TRAIT_ATTACK,
    TRAIT_AERIAL,
    TRAIT_SKILL,
    TRAIT_THWART,
    TRAIT_WEAPON,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-a-por-ellos',
        'aspect': 'aggression',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'A por ellos',
                'set': 'aggression',
                'image': 'aspect/aggression/events/01052.png',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'trigger': TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'threat': 2,
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
        '_id': 'aggression-asalto-implacable',
        'aspect': 'aggression',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Asalto implacable',
                'set': 'aggression',
                'image': 'aspect/aggression/events/a53-copy-2.webp',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_PHYSICAL
                                    ],
                                    'target': TARGET_MINION,
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 5,
                                            'keywords': {
                                                'overkill': true
                                            }
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 5
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
        '_id': 'aggression-gancho',
        'aspect': 'aggression',
        'order': 4,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Gancho',
                'set': 'aggression',
                'image': 'aspect/aggression/events/a54-copy-2.webp',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
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
                                    'damage': 5
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-cuerpo-a-cuerpo',
        'aspect': 'aggression',
        'order': 30,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Cuerpo a cuerpo',
                'set': 'aggression',
                'image': 'aspect/aggression/events/05030.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
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
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'damage': 3
                                            }
                                        },
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ENEMY,
                                                'damage': 3,
                                                'excludeTarget': 'effects.0.selectedTarget'
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
        '_id': 'aggression-ven-aqui',
        'aspect': 'aggression',
        'order': 62,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Ven aquí!',
                'set': 'aggression',
                'image': 'aspect/aggression/events/06014.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
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
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_MINION,
                                                'damage': 1
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF_HAS_TRAITS,
                                            'params': {
                                                'target': TARGET_YOUR_HERO,
                                                'traits': [
                                                    TRAIT_AERIAL
                                                ],
                                                'effect': {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effects.0.selectedTarget.isInPlay': true
                                                        },
                                                        'effect': {
                                                            'type': EFFECT_ENGAGE,
                                                            'params': {
                                                                'target': TARGET_YOU,
                                                                'cardSource': 'effects.0.selectedTarget'
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
        '_id': 'aggression-golpetazo',
        'aspect': 'aggression',
        'order': 63,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Golpetazo',
                'set': 'aggression',
                'image': 'aspect/aggression/events/06015.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_YOU_BASIC_ATTACK,
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO,
                                    'condition': {
                                        'traits': TRAIT_WEAPON
                                    }
                                }
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                'params': {
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
        '_id': 'aggression-golpe-diestro',
        'aspect': 'aggression',
        'order': 90,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Golpe diestro',
                'set': 'aggression',
                'image': 'aspect/aggression/events/09037.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_YOU_BASIC_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
