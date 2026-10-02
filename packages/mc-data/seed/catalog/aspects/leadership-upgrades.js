import {
    ABILITY_CONSTANT,
    CARD_TYPE_UPGRADE,
    EFFECT_CHAINED,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_PHYSICAL,
    TARGET_ALLY,
    TARGET_ATTACHED,
    TRAIT_CONDITION
} from 'mc-shared';

export default [
    {
        '_id': 'leadership-inspiracion',
        'aspect': 'leadership',
        'order': 7,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Inspiración',
                'set': 'leadership',
                'image': 'aspect/leadership/upgrades/01074.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'leadership',
                'attach': TARGET_ALLY,
                'maxAttach': 1,
                'maximum': {
                    'count': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'Inspiración',
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_ATTACHED,
                                    'effects': [
                                        {
                                            'type': EFFECT_MODIFY_THWART_VALUE,
                                            'params': {
                                                'count': 1
                                            }
                                        },
                                        {
                                            'type': EFFECT_MODIFY_ATTACK_VALUE,
                                            'params': {
                                                'count': 1
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
