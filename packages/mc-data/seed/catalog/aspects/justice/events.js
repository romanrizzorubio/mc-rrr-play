import {
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    CARD_TYPE_EVENT,
    EFFECT_CHAINED,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_PREVENT_PLACE_THREAT,
    EFFECT_REMOVE_THREAT,
    EFFECT_TAKE_DAMAGE,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    TARGET_EFFECT,
    TARGET_SCHEME,
    TARGET_YOU,
    TRAIT_THWART,
    TRIGGER_WOULD_PLACE_THREAT
} from 'mc-shared';

export default [
    {
        '_id': 'justice-for-justice',
        'aspect': 'justice',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'For Justice',
                'set': 'justice',
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
                'name': 'Great Responsability',
                'set': 'justice',
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
    }
];
