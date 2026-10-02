import {
    ABILITY_ACTION,
    ABILITY_HERO_ACTION,
    ABILITY_INTERRUPT,
    CARD_TYPE_EVENT,
    EFFECT_DEAL_DAMAGE,
    EFFECT_HEAL,
    EFFECT_PREVENT_PLACE_THREAT,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    TARGET_CHARACTER,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TRAIT_ATTACK,
    TRAIT_THWART,
    TRIGGER_VILLAIN_SCHEMES,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-haymaker',
        'aspect': 'basic',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Haymaker',
                'set': 'basic',
                'image': 'aspect/basic/events/b87-1.webp',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'damage': 3,
                                    'target': TARGET_ENEMY
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-emergency',
        'aspect': 'basic',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Emergency',
                'set': 'basic',
                'image': 'aspect/basic/events/b85-copy-2.webp',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'trigger': TRIGGER_VILLAIN_SCHEMES,
                            'effect': {
                                'type': EFFECT_PREVENT_PLACE_THREAT,
                                'params': {
                                    'threat': 1,
                                    'target': TARGET_EFFECT
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-first-aid',
        'aspect': 'basic',
        'order': 4,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'First Aid',
                'set': 'basic',
                'image': 'aspect/basic/events/b86-copy-2.webp',
                'traits': [],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'effect': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'damage': 2,
                                    'target': TARGET_CHARACTER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
];
