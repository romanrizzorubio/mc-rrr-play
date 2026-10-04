import {
    ABILITY_HERO_ACTION,
    ABILITY_RESPONSE,
    CARD_TYPE_EVENT,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_REMOVE_THREAT,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TARGET_MINION,
    TARGET_SCHEME,
    TRAIT_ATTACK,
    TRAIT_THWART,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-a-por-ellos',
        'aspect': 'aggression',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'A por ellos',
                'set': 'aggression',
                'image': 'aspect/aggression/events/a52-copy-2.webp',
                'traits': [
                    TRAIT_THWART
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'labels': [
                                LABEL_THWART
                            ],
                            'trigger': TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'threat': 2,
                                    'target': TARGET_SCHEME
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-asalto-implacable',
        'aspect': 'aggression',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Asalto implacable',
                'set': 'aggression',
                'image': 'aspect/aggression/events/a53-copy-2.webp',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'abilities': [
                    {
                        'type': ABILITY_HERO_ACTION,
                        'params': {
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'effect': {
                                'type': EFFECT_DO_IF_HAS_PAID,
                                'params': {
                                    'resources': [
                                        RESOURCE_PHYSICAL
                                    ],
                                    'target': TARGET_MINION,
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 5,
                                            'keywords': {
                                                'overkill': true
                                            }
                                        }
                                    },
                                    'effectNot': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'target': TARGET_MINION,
                                            'damage': 5
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-gancho',
        'aspect': 'aggression',
        'order': 4,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Gancho',
                'set': 'aggression',
                'image': 'aspect/aggression/events/a54-copy-2.webp',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'aggression',
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
                                    'target': TARGET_ENEMY,
                                    'damage': 5
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
