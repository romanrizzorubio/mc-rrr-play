import {
    ABILITY_CONSTANT,
    CARD_TYPE_UPGRADE,
    EFFECT_MODIFY_ATTACK_CONSEQUENCIAL,
    EFFECT_MODIFY_ATTACK_VALUE,
    RESOURCE_PHYSICAL,
    TARGET_ALLY,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TRAIT_CONDITION,
    TRAIT_SKILL,
    TRIGGER_ATTACHED_GET_ATTACK,
    TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
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
                    'count': 1,
                    'target': TARGET_PLAYER
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
    },
    {
        '_id': 'aggression-enfurecido',
        'aspect': 'aggression',
        'order': 20,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Enfurecido',
                'set': 'aggression',
                'image': 'aspect/aggression/upgrades/03031.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
                'attach': TARGET_ALLY,
                'maxAttach': 1,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_ATTACHED_GET_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 2
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_ATTACHED_GET_ATTACK_CONSEQUENCIAL,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_CONSEQUENCIAL,
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
