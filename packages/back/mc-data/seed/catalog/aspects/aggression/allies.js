import {
    ABILITY_FORCED_RESPONSE,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_HEAL,
    EFFECT_SIMULTANEOUS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    TARGET_ALL_CHARACTERS,
    TARGET_ENEMY,
    TARGET_THIS,
    TRAIT_AVENGER,
    TRAIT_GAMMA,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT_MINION
} from 'mc-shared';

export default [
    {
        '_id': 'aggression-hulk',
        'aspect': 'aggression',
        'order': 0,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Hulk',
                'set': 'aggression',
                'image': 'aspect/aggression/allies/a50.webp',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_GAMMA
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'aggression',
                'subtitle': 'Bruce Banner',
                'thwart': null,
                'attack': 3,
                'thwartConsequencial': null,
                'attackConsequencial': 1,
                'hitPoints': 5,
                'abilities': [
                    {
                        'type': ABILITY_FORCED_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_ATTACK,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_DISCARD_FROM_DECK
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'p'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ENEMY,
                                                        'damage': 2
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'e'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'target': TARGET_ALL_CHARACTERS,
                                                        'damage': 1
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'm'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_DISCARD_GAME,
                                                    'params': {
                                                        'target': TARGET_THIS
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            'type': EFFECT_DO_IF,
                                            'params': {
                                                'condition': {
                                                    'effects.0.cards.0.resources': [
                                                        'w'
                                                    ]
                                                },
                                                'effect': {
                                                    'type': EFFECT_SIMULTANEOUS,
                                                    'params': {
                                                        'effects': [
                                                            {
                                                                'type': EFFECT_DEAL_DAMAGE,
                                                                'params': {
                                                                    'target': TARGET_ENEMY,
                                                                    'damage': 2
                                                                }
                                                            },
                                                            {
                                                                'type': EFFECT_DEAL_DAMAGE,
                                                                'params': {
                                                                    'target': TARGET_ALL_CHARACTERS,
                                                                    'damage': 1
                                                                }
                                                            },
                                                            {
                                                                'type': EFFECT_DISCARD_GAME,
                                                                'params': {
                                                                    'target': TARGET_THIS
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
                    }
                ]
            }
        }
    },
    {
        '_id': 'aggression-tigra',
        'aspect': 'aggression',
        'order': 1,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Tigra',
                'set': 'aggression',
                'image': 'aspect/aggression/allies/a51.webp',
                'traits': [
                    TRAIT_AVENGER
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'aggression',
                'subtitle': 'Greer Grant Nelson',
                'thwart': 1,
                'attack': 2,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_DEFEAT_MINION,
                            'effect': {
                                'type': EFFECT_HEAL,
                                'params': {
                                    'target': TARGET_THIS,
                                    'damage': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
