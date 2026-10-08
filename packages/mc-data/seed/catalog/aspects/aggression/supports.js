import {
    ABILITY_ACTION,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_REMOVE_USE,
    RESOURCE_ENERGY,
    TARGET_ENEMY,
    TARGET_THIS,
    TRAIT_SHIELD
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-tac-team',
        'aspect': 'aggression',
        'order': 6,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Tac Team',
                'set': 'aggression',
                'image': 'aspect/aggression/supports/a56-copy-2.webp',
                'traits': [
                    TRAIT_SHIELD
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
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
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'threat': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
