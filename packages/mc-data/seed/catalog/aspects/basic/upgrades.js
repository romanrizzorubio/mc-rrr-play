import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_RESOURCE,
    CARD_TYPE_UPGRADE,
    EFFECT_CHAINED,
    EFFECT_ADD_TRAIT,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_REMOVE_COUNTER,
    EFFECT_READY,
    EFFECT_SPEND,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_PLAYER,
    TARGET_THIS,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_TITLE,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_CONDITION_GET_TRAITS,
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
    {
        '_id': 'basic-honorary-avenger',
        'aspect': 'basic',
        'order': 20,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Vengador honorario',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/03025.png',
                'traits': [
                    TRAIT_TITLE
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'attach': TARGET_FRIENDLY_CHARACTER,
                'maxAttach': 1,
                'paramsToPlay': {
                    'traits': TRAIT_AVENGER
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_CHARACTER_GET_HIT_POINTS,
                            'effect': {
                                'type': EFFECT_MODIFY_HIT_POINTS,
                                'params': {
                                    'target': TARGET_ATTACHED,
                                    'count': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_CONDITION_GET_TRAITS,
                            'effect': {
                                'type': EFFECT_ADD_TRAIT,
                                'params': {
                                    'target': TARGET_ATTACHED,
                                    'trait': TRAIT_AVENGER
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-enhanced-awareness',
        'aspect': 'basic',
        'order': 21,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Consciencia mejorada',
                'set': 'basic',
                'image': 'aspect/basic/upgrades/03034.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_RESOURCE,
                        'params': {
                            'resource': RESOURCE_MENTAL,
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_THIS,
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_COUNTER,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
