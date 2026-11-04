import {
    CLASSIFICATION_BASIC,
    ABILITY_ACTION,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_INTERRUPT,
    CARD_TYPE_EVENT,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_DEAL_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_HEAL,
    EFFECT_FLIP,
    EFFECT_EXHAUST,
    EFFECT_LASTING,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_PREVENT_PLACE_THREAT,
    EFFECT_READY,
    EFFECT_REMOVE_STATUS,
    EFFECT_REMOVE_THREAT,
    EFFECT_SIMULTANEOUS,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    STATUS_CONFUSED,
    STATUS_STUNNED,
    TARGET_CHARACTER,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_ANY_CHARACTER_YOU_CONTROL,
    TARGET_DECK,
    TARGET_HERO,
    TARGET_HERO_SIDE,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_SCHEME,
    TARGET_VILLAIN,
    TARGET_YOUR_SUPERHERO,
    TARGET_YOUR_HERO,
    TIME_PHASE,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_SUPERPOWER,
    TRAIT_TACTIC,
    TRAIT_THWART,
    TRIGGER_GET_HAND_SIZE,
    TRIGGER_VILLAIN_SCHEMES,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_TREACHERY_REVEAL,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-haymaker',
        'classification': 'basic',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Puñetazo demoledor',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/01087.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
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
                                    'damage': 3,
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
        '_id': 'basic-emergency',
        'classification': 'basic',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Emergencia',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/01085.png',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'trigger': TRIGGER_VILLAIN_SCHEMES,
                            'effect': {
                                'type': EFFECT_PREVENT_PLACE_THREAT,
                                'params': {
                                    'threat': 1,
                                    'target': TARGET_EFFECT
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-first-aid',
        'classification': 'basic',
        'order': 4,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Primeros auxilios',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/01086.png',
                'traits': [],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'damage': 2,
                                    'target': TARGET_CHARACTER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
{
        '_id': 'basic-invulnerabilidad',
        'classification': 'basic',
        'order': 61,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Invulnerabilidad',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/06021.png',
                'traits': [
                    TRAIT_SUPERPOWER
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_TOUGH,
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
        '_id': 'basic-alerta',
        'classification': 'basic',
        'order': 90,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Alerta',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/09021.png',
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                            'triggerParams': {
                                'target': TARGET_HERO
                            },
                            'effect': {
                                'type': EFFECT_PREVENT_DAMAGE,
                                'params': {
                                    'target': TARGET_EFFECT,
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
        '_id': 'basic-al-rescate',
        'classification': 'basic',
        'order': 91,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Al rescate!',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/10019.png',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
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
        '_id': 'basic-los-heroes-mas-poderosos',
        'classification': 'basic',
        'order': 92,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Los héroes más poderosos',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/04022.png',
                'cost': 0,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_ANY_CHARACTER_YOU_CONTROL,
                                    'condition': {
                                        'traits': TRAIT_AVENGER
                                    },
                                }
                            },
                            'effect': {
                                'type': EFFECT_READY,
                                'params': {
                                    'target': TARGET_ANY_CHARACTER_YOU_CONTROL,
                                    'condition': {
                                        'traits': TRAIT_AVENGER
                                    },
                                    'excludeTarget': 'ability.arrow.cost.selectedTarget'
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-tacticas-de-enjambre',
        'classification': 'basic',
        'order': 93,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Tácticas de enjambre',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/12020.png',
                'traits': [
                    TRAIT_TACTIC
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_BASIC,
                'maximum': {
                    'count': 1,
                    'target': TARGET_DECK
                },
                'keywords': {
                    'teamUp': [
                        'Hombre Hormiga',
                        'Avispa'
                    ]
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_FLIP,
                                            'params': {
                                                'target': TARGET_YOUR_SUPERHERO,
                                                'formTarget': TARGET_HERO_SIDE
                                            }
                                        },
                                        {
                                            'type': EFFECT_READY,
                                            'params': {
                                                'target': TARGET_YOUR_HERO
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
        '_id': 'basic-evaluar-la-situacion',
        'classification': 'basic',
        'order': 94,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Evaluar la situación',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/12033.png',
                'traits': [
                    TRAIT_TACTIC
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_BASIC,
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_LASTING,
                                'params': {
                                    'until': TIME_PHASE,
                                    'triggerType': TRIGGER_GET_HAND_SIZE,
                                    'triggerParams': {
                                        'target': TARGET_CARD
                                    },
                                    'triggerTarget': TARGET_YOUR_SUPERHERO,
                                    'effect': {
                                        'type': EFFECT_MODIFY_HAND_SIZE,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'count': 1
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
        '_id': 'basic-preparacion-fisica',
        'classification': 'basic',
        'order': 95,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Preparación física',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/13034.png',
                'cost': 1,
                'resources': [RESOURCE_MENTAL],
                'classification': CLASSIFICATION_BASIC,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_REMOVE_STATUS,
                                'params': {
                                    'target': TARGET_YOUR_HERO,
                                    'statuses': [
                                        STATUS_STUNNED,
                                        STATUS_CONFUSED,
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
        '_id': 'basic-orden-y-caos',
        'classification': 'basic',
        'order': 140,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Orden y caos',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/14018.png',
                'cost': 1,
                'resources': [RESOURCE_PHYSICAL],
                'classification': CLASSIFICATION_BASIC,
                'maximum': {
                    'count': 1,
                    'target': TARGET_DECK,
                },
                'keywords': {
                    'teamUp': ['Mercurio', 'Bruja Escarlata'],
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_TREACHERY_REVEAL,
                            'effect': {
                                'type': EFFECT_CANCEL_ENCOUNTER,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'full': false,
                                    'thenEffect': {
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
        '_id': 'basic-paliza',
        'classification': 'basic',
        'order': 141,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Paliza',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/events/14032.png',
                'traits': [
                    TRAIT_TACTIC
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': CLASSIFICATION_BASIC,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_SIMULTANEOUS,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_VILLAIN,
                                                'damage': 1
                                            }
                                        },
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ALL_ENGAGED_MINIONS,
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
];
