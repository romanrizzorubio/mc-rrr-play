import {
    ABILITY_CONSTANT,
    ABILITY_RESPONSE,
    CARD_TYPE_UPGRADE,
    EFFECT_DISCARD_GAME,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_READY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TARGET_THIS,
    TARGET_YOUR_HERO,
    TRAIT_ARMOR,
    TRAIT_CONDITION,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
    TRIGGER_VILLAIN_ATTACKS_YOU
} from 'mc-shared';

export default [
    {
        '_id': 'protection-chaleco-blindado',
        'aspect': 'protection',
        'order': 6,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Chaleco blindado',
                'set': 'protection',
                'image': 'aspect/protection/upgrades/01081.png',
                'traits': [
                    TRAIT_ARMOR
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'Chaleco blindado',
                            'trigger': TRIGGER_YOUR_HERO_GET_DEFENSE,
                            'effect': {
                                'type': EFFECT_MODIFY_DEFENSE_VALUE,
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
        '_id': 'protection-indomito',
        'aspect': 'protection',
        'order': 7,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Indómito',
                'set': 'protection',
                'image': 'aspect/protection/upgrades/01082.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'name': 'Indómito',
                            'trigger': TRIGGER_VILLAIN_ATTACKS_YOU,
                            'condition': {
                                'effect.isDefended': true,
                                'effect.defender.isHero': true
                            },
                            'arrow': {
                                'type': EFFECT_DISCARD_GAME,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_READY,
                                'params': {
                                    'target': TARGET_YOUR_HERO
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
