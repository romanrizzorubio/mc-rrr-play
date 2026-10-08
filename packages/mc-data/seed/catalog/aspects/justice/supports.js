import {
    ABILITY_ACTION,
    ABILITY_RESPONSE,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_EXHAUST,
    EFFECT_REMOVE_THREAT,
    EFFECT_REMOVE_USE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    TARGET_SCHEME,
    TARGET_THIS,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRIGGER_YOU_DEFEAT_MINION
} from 'mc-shared';

export default [
    {
        '_id': 'justice-interrogation-room',
        'aspect': 'justice',
        'order': 5,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Interrogation Room',
                'set': 'justice',
                'image': 'aspect/justice/supports/j63-copy-2.webp',
                'traits': [
                    TRAIT_LOCATION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'maximum': {
                    'count': 1
                },
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOU_DEFEAT_MINION,
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'target': TARGET_SCHEME,
                                    'threat': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-surveillance-team',
        'aspect': 'justice',
        'order': 6,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Surveillance Team',
                'set': 'justice',
                'image': 'aspect/justice/supports/j64-copy.webp',
                'traits': [
                    TRAIT_SHIELD
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'justice',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
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
                                            'type': EFFECT_REMOVE_USE,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'target': TARGET_SCHEME,
                                    'threat': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
