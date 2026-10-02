import {
    ABILITY_ACTION,
    CARD_TYPE_ANY,
    CARD_TYPE_SUPPORT,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_LASTING,
    EFFECT_MODIFY_COST,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ANY_PLAYER,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TRAIT_AVENGER,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_PHASE_ENDS,
    TRIGGER_PLAY_CARD,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-avengers-mansion',
        'aspect': 'basic',
        'order': 0,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Avengers Mansion',
                'set': 'basic',
                'image': 'aspect/basic/supports/b91-copy-2.webp',
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
                    'count': 1
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
        '_id': 'basic-helicarrier',
        'aspect': 'basic',
        'order': 1,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Helicarrier',
                'set': 'basic',
                'image': 'aspect/basic/supports/b92-copy-2.webp',
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
                    'count': 1
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
                                    'target': TARGET_PLAYER,
                                    'until': [
                                        TRIGGER_END_PLAY_CARD,
                                        TRIGGER_PHASE_ENDS
                                    ],
                                    'triggerType': TRIGGER_PLAY_CARD,
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
];
