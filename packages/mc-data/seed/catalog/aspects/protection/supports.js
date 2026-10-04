import {
    ABILITY_ACTION,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_EXHAUST,
    EFFECT_HEAL,
    EFFECT_REMOVE_USE,
    RESOURCE_ENERGY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_THIS,
    TRAIT_SHIELD
} from 'mc-shared';

export default [
    {
        '_id': 'protection-equipo-medico',
        'aspect': 'protection',
        'order': 5,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Equipo médico',
                'set': 'protection',
                'image': 'aspect/protection/supports/01080.png',
                'traits': [
                    TRAIT_SHIELD
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'Equipo médico',
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_THIS,
                                    'matchAll': true,
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_USE,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'target': TARGET_FRIENDLY_CHARACTER,
                                    'damage': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
