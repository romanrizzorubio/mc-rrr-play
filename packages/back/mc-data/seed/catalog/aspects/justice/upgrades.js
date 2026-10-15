import {
    ABILITY_CONSTANT,
    ABILITY_INTERRUPT,
    CARD_TYPE_UPGRADE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_ENERGY,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_PLAYER,
    TARGET_SIDE_SCHEME,
    TRAIT_CONDITION,
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
                'attach': TARGET_SIDE_SCHEME,
                'maxAttach': 1,
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
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
    },
{
        '_id': 'justice-bajo-vigilancia',
        'aspect': 'justice',
        'order': 60,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Bajo vigilancia',
                'set': 'justice',
                'image': 'aspect/justice/upgrades/06031.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'attach': TARGET_MAIN_SCHEME,
                'maxAttach': 1,
                'threatThresholdModifier': 4
            }
        }
    },

];
