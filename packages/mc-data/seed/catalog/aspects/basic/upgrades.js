import {
    ABILITY_ACTION,
    CARD_TYPE_UPGRADE,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_READY,
    EFFECT_SPEND,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_CARD,
    TARGET_PLAYER,
    TRAIT_CONDITION,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-tenacity',
        'aspect': 'basic',
        'order': 10,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Tenacidad',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/b93-copy-2.webp',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_CARD,
                                    'effects': [
                                        {
                                            'type': EFFECT_SPEND,
                                            'params': {
                                                'resources': [
                                                    RESOURCE_PHYSICAL
                                                ]
                                            }
                                        },
                                        {
                                            'type': EFFECT_DISCARD_GAME,
                                            'params': {
                                                'target': TARGET_CARD
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_READY,
                                'params': {
                                    'target': TARGET_PLAYER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
];
