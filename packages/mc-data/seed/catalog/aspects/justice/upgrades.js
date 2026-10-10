import {
    ABILITY_CONSTANT,
    ABILITY_RESPONSE,
    CARD_TYPE_UPGRADE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_ENERGY,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TARGET_SCHEME,
    TRAIT_SKILL,
    TRIGGER_ATTACHED_DEFEAT,
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
                    'count': 1,
                    'target': TARGET_PLAYER
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
    },
    {
        '_id': 'justice-seguimiento',
        'aspect': 'justice',
        'order': 20,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Seguimiento',
                'set': 'justice',
                'image': 'aspect/justice/upgrades/03032.png',
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'attach': TARGET_SCHEME,
                'maxAttach': 1,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_ATTACHED_DEFEAT,
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'damage': 4
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
