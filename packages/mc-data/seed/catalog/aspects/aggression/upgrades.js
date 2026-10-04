import {
    ABILITY_CONSTANT,
    CARD_TYPE_UPGRADE,
    EFFECT_MODIFY_ATTACK_VALUE,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TRAIT_SKILL,
    TRIGGER_YOUR_HERO_GET_ATTACK
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-entrenamiento-de-combate',
        'aspect': 'aggression',
        'order': 7,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Entrenamiento de combate',
                'set': 'aggression',
                'image': 'aspect/aggression/upgrades/a57-copy-2.webp',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'maximum': {
                    'count': 1
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_YOUR_HERO_GET_ATTACK,
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
