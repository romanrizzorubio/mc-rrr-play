import {
    ABILITY_CONSTANT,
    CARD_TYPE_UPGRADE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_ENERGY,
    TARGET_EFFECT,
    TRAIT_SKILL,
    TRIGGER_YOUR_HERO_GET_THWART
} from 'mc-shared';

export default [
    {
        '_id': 'justice-intuicion-heroica',
        'aspect': 'justice',
        'order': 7,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Intuición heróica',
                'set': 'justice',
                'image': 'aspect/justice/upgrades/j65-copy.webp',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'maximum': {
                    'count': 1
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_YOUR_HERO_GET_THWART,
                            'effect': {
                                'type': EFFECT_MODIFY_THWART_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
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
