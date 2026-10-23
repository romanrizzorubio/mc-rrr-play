import {
    ABILITY_ACTION,
    ABILITY_HERO_ACTION,
    ABILITY_INTERRUPT,
    CARD_TYPE_EVENT,
    EFFECT_DEAL_DAMAGE,
    EFFECT_HEAL,
    EFFECT_EXHAUST,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_PREVENT_PLACE_THREAT,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_CHARACTER,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_ANY_CHARACTER_YOU_CONTROL,
    TARGET_HERO,
    TARGET_SCHEME,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_SUPERPOWER,
    TRAIT_THWART,
    TRIGGER_VILLAIN_SCHEMES,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-haymaker',
        'aspect': 'basic',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Puñetazo demoledor',
                'set': 'basic',
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
        'aspect': 'basic',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Emergencia',
                'set': 'basic',
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
        'aspect': 'basic',
        'order': 4,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Primeros auxilios',
                'set': 'basic',
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
        'aspect': 'basic',
        'order': 61,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Invulnerabilidad',
                'set': 'basic',
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
        'aspect': 'basic',
        'order': 90,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Alerta',
                'set': 'basic',
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
        'aspect': 'basic',
        'order': 91,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Al rescate!',
                'set': 'basic',
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
        'aspect': 'basic',
        'order': 92,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Los héroes más poderosos',
                'set': 'basic',
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
    }
];
