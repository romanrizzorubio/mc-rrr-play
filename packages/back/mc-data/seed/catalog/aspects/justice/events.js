import {
    CLASSIFICATION_JUSTICE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_INTERRUPT,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_CANCEL_BOOST_ICONS,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_PREVENT_PLACE_THREAT,
    EFFECT_REMOVE_THREAT,
    EFFECT_TAKE_DAMAGE,
    LABEL_THWART,
    LABEL_ATTACK,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_SCHEME,
    TARGET_YOU,
    TRAIT_THWART,
    TRAIT_ATTACK,
    TRIGGER_BOOST_REVEALED,
    TRIGGER_WOULD_PLACE_THREAT,
} from 'mc-shared';

export default [
    {
        '_id': 'justice-for-justice',
        'aspect': 'justice',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Por la justicia',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/events/j60-copy-2.webp',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_MENTAL
                                    ],
                                    'effect': {
                                        'type': EFFECT_REMOVE_THREAT,
                                        'params': {
                                            'target': TARGET_SCHEME,
                                            'threat': 4
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_REMOVE_THREAT,
                                        'params': {
                                            'target': TARGET_SCHEME,
                                            'threat': 3
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
        '_id': 'justice-great-responsability',
        'aspect': 'justice',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Una gran responsabilidad',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/events/j61-copy-2.webp',
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'justice',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_WOULD_PLACE_THREAT,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_PREVENT_PLACE_THREAT,
                                            'params': {
                                                'target': TARGET_EFFECT
                                            }
                                        },
                                        {
                                            'type': EFFECT_TAKE_DAMAGE,
                                            'params': {
                                                'target': TARGET_YOU,
                                                'paramsCalc': {
                                                    'target': 'effects.0.preventThreat'
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
        '_id': 'justice-golpe-contundente',
        'aspect': 'justice',
        'order': 30,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Golpe contundente',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/events/05031.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'justice',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_CONFUSE,
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
        '_id': 'justice-ataque-sigiloso',
        'aspect': 'justice',
        'order': 31,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Ataque sigiloso',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/events/08013.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'justice',
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
                                                'damage': 4
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.defeated': true
                                                },
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
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-despejar-la-zona',
        'aspect': 'justice',
        'order': 32,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Despejar la zona',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/events/04049.png',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': CLASSIFICATION_JUSTICE,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_SCHEME,
                                    'effects': [
                                        {
                                            'type': EFFECT_REMOVE_THREAT,
                                            'params': {
                                                'target': TARGET_SCHEME,
                                                'threat': 2
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.selectedTarget.threat': 0
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
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-no-tan-deprisa',
        'aspect': 'justice',
        'order': 90,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡No tan deprisa!',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/events/09038.png',
                'cost': 0,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_BOOST_REVEALED,
                            'effect': {
                                'type': EFFECT_CANCEL_BOOST_ICONS,
                                'params': {
                                    'target': TARGET_EFFECT
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
