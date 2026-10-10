import {
    ABILITY_CONSTANT,
    CARD_TYPE_UPGRADE,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_PHYSICAL,
    TARGET_ALLY,
    TARGET_DECK,
    TARGET_EFFECT,
    TRAIT_CONDITION,
    TRIGGER_ATTACHED_GET_ATTACK,
    TRIGGER_ATTACHED_GET_THWART
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
                    'count': 3,
                    'target': TARGET_DECK
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'Inspiración',
                            'trigger': TRIGGER_ATTACHED_GET_THWART,
                            'effect': {
                                'type': EFFECT_MODIFY_THWART_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'Inspiración',
                            'trigger': TRIGGER_ATTACHED_GET_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
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
