import {
    CLASSIFICATION_BASIC,
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_RESPONSE,
    ABILITY_RESOURCE,
    CARD_TYPE_ANY,
    CARD_TYPE_ALLY,
    CARD_TYPE_SUPPORT,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_LASTING,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_MAX_ALLIES,
    EFFECT_PLAY_CARD,
    EFFECT_READY,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ANY_PLAYER,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_PHASE,
    TARGET_PLAYER,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TIME_PHASE,
    TRAIT_AVENGER,
    TRAIT_GUARDIAN,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRAIT_VEHICLE,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_PHASE_ENDS,
    TRIGGER_PLAY_CARD,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-avengers-mansion',
        'classification': 'basic',
        'order': 0,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Mansión de los Vengadores',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/supports/01091.png',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_LOCATION
                ],
                'cost': 4,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_CARD
                                }
                            },
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'target': TARGET_ANY_PLAYER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-avengers-tower',
        'classification': 'basic',
        'order': 20,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Torre de los Vengadores',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/supports/03024.png',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_LOCATION
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES,
                            'condition': {
                                'player.allies': {
                                    'every': {
                                        'traits': TRAIT_AVENGER
                                    }
                                }
                            },
                            'effect': {
                                'type': EFFECT_MODIFY_MAX_ALLIES,
                                'params': {
                                    'count': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_CARD
                                }
                            },
                            'effect': {
                                'type': EFFECT_LASTING,
                                'params': {
                                    'target': TARGET_PLAYER,
                                    'until': TIME_PHASE,
                                    'triggerType': TRIGGER_PLAY_CARD,
                                    'limit': {
                                        'count': 1,
                                        'target': TARGET_PHASE
                                    },
                                    'condition': {
                                        'effect.card.isAlly': true,
                                        'effect.card.traits': TRAIT_AVENGER
                                    },
                                    'hideDialog': true,
                                    'effect': {
                                        'type': EFFECT_MODIFY_COST,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'cardType': CARD_TYPE_ALLY,
                                            'count': -1
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
        '_id': 'basic-helicarrier',
        'classification': 'basic',
        'order': 1,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Helitransporte',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/supports/01092.png',
                'traits': [
                    TRAIT_SHIELD,
                    TRAIT_LOCATION
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_CARD
                                }
                            },
                            'effect': {
                                'type': EFFECT_LASTING,
                                'params': {
                                    'target': TARGET_ANY_PLAYER,
                                    'until': [
                                        TRIGGER_END_PLAY_CARD,
                                        TRIGGER_PHASE_ENDS
                                    ],
                                    'triggerType': TRIGGER_PLAY_CARD,
                                    'triggerParams': {
                                        'player': 'ability.lasting.selectedTarget'
                                    },
                                    'hideDialog': true,
                                    'effect': {
                                        'type': EFFECT_MODIFY_COST,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'cardType': CARD_TYPE_ANY,
                                            'count': -1
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
        '_id': 'basic-quintransporte',
        'classification': 'basic',
        'order': 21,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Quintransporte',
                'unique': true,
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/supports/08023.png',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_VEHICLE
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'paramsToPlay': {
                    'superhero.traits': TRAIT_AVENGER
                },
                'abilities': [
                    {
                        'type': ABILITY_RESOURCE,
                        'params': {
                            'resource': RESOURCE_WILD,
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
        '_id': 'basic-espiritu-de-equipo',
        'classification': CLASSIFICATION_BASIC,
        'order': 22,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Espíritu de equipo',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/supports/12024.png',
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL,
                ],
                'classification': CLASSIFICATION_BASIC,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS,
                                },
                            },
                            'effect': {
                                'type': EFFECT_PLAY_CARD,
                                'params': {
                                    'target': TARGET_SOURCE,
                                    'source': 'player.hand.cards',
                                    'sharedTraitsWith': TARGET_YOUR_HERO,
                                    'costReduction': 1,
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
    {
        '_id': 'basic-ngii',
        'classification': CLASSIFICATION_BASIC,
        'order': 17021,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'N.G.I.I.',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/supports/17021.png',
                'traits': [TRAIT_VEHICLE],
                'cost': 2,
                'resources': [RESOURCE_WILD],
                'classification': CLASSIFICATION_BASIC,
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
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
                                            'type': EFFECT_SPEND,
                                            'params': {
                                                'resources': [
                                                    RESOURCE_ANY,
                                                    RESOURCE_ANY,
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            'effect': {
                                'type': EFFECT_READY,
                                'params': {
                                    'target': TARGET_FRIENDLY_CHARACTER,
                                    'condition': {
                                        'traits': TRAIT_GUARDIAN,
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
        '_id': 'basic-sapiencial',
        'classification': CLASSIFICATION_BASIC,
        'order': 17022,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Sapiencial',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/supports/17022.png',
                'traits': [TRAIT_LOCATION],
                'cost': 2,
                'resources': [RESOURCE_ENERGY],
                'classification': CLASSIFICATION_BASIC,
                'paramsToPlay': {
                    'superhero.traits': TRAIT_GUARDIAN,
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES,
                            'effect': {
                                'type': EFFECT_MODIFY_MAX_ALLIES,
                                'params': {
                                    'count': 1,
                                },
                            },
                        },
                    },
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOU_END_PLAY_CARD,
                            'condition': {
                                'effect.card.isAlly': true,
                                'effect.card.traits': TRAIT_GUARDIAN,
                            },
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS,
                                },
                            },
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'target': TARGET_YOU,
                                    'count': 1,
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
];
