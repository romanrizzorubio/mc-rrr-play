import {
    ABILITY_CONSTANT,
    CARD_TYPE_SUPPORT,
    EFFECT_MODIFY_MAX_ALLIES,
    RESOURCE_ENERGY,
    TRAIT_LOCATION,
    TRAIT_SHIELD
} from 'mc-shared';

export default [
    {
        '_id': 'leadership-el-triskelion',
        'aspect': 'leadership',
        'order': 6,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'El Triskelion',
                'set': 'leadership',
                'image': 'aspect/leadership/supports/01073.png',
                'traits': [
                    TRAIT_LOCATION,
                    TRAIT_SHIELD
                ],
                'unique': true,
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'El Triskelion',
                            'effect': {
                                'type': EFFECT_MODIFY_MAX_ALLIES,
                                'params': {
                                    'count': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
