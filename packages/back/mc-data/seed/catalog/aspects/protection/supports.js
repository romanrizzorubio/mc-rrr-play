import {
    ABILITY_ACTION,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_EXHAUST,
    EFFECT_HEAL,
    EFFECT_REMOVE_COUNTER,
    EFFECT_REMOVE_STATUS,
    RESOURCE_MENTAL,
    TARGET_HERO,
    RESOURCE_ENERGY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_THIS,
    TRAIT_PERSONA,
    TRAIT_SHIELD
} from 'mc-shared';

export default [
    {
        '_id': 'protection-equipo-medico',
        'aspect': 'protection',
        'order': 5,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Equipo médico',
                'set': 'protection',
                'image': 'aspect/protection/supports/01080.png',
                'traits': [
                    TRAIT_SHIELD
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'Equipo médico',
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_THIS,
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_COUNTER,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'target': TARGET_FRIENDLY_CHARACTER,
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
        '_id': 'protection-enfermera-de-noche',
        'aspect': 'protection',
        'order': 90,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'La Enfermera de Noche',
                'set': 'protection',
                'image': 'aspect/protection/supports/09019.png',
                'traits': [
                    TRAIT_PERSONA
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'La Enfermera de Noche',
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_THIS,
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_COUNTER,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_HERO,
                                    'effects': [
                                        {
                                            'type': EFFECT_HEAL,
                                            'params': {
                                                'target': TARGET_HERO,
                                                'damage': 1
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_STATUS,
                                            'params': {
                                                'target': TARGET_HERO
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
];
