import {
    ABILITY_FORCED_RESPONSE,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_LASTING,
    EFFECT_REMOVE_THREAT,
    EFFECT_STUN,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_CARD,
    TARGET_ENEMY,
    TARGET_SCHEME,
    TARGET_YOU,
    TIME_ROUND,
    TRAIT_SHIELD,
    TRAIT_SPY,
    TRIGGER_THIS_ENTER_PLAY,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-mockingbird',
        'aspect': 'basic',
        'order': 8,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Pájaro Burlón',
                'set': 'basic',
                'image': 'aspect/basic/allies/b83-copy-2.webp',
                'traits': [
                    TRAIT_SHIELD,
                    TRAIT_SPY
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'subtitle': 'Bobbi Morse',
                'thwart': 1,
                'attack': 1,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_STUN,
                                'params': {
                                    'target': TARGET_ENEMY
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'basic-nick-fury',
        'aspect': 'basic',
        'order': 9,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Nick Furia',
                'set': 'basic',
                'image': 'aspect/basic/allies/b84-copy-2.webp',
                'traits': [
                    TRAIT_SHIELD,
                    TRAIT_SPY
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'thwart': 2,
                'attack': 2,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_FORCED_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_YOU,
                                    'effects': [
                                        {
                                            'type': EFFECT_CHOOSE,
                                            'params': {
                                                'target': TARGET_YOU,
                                                'options': [
                                                    {
                                                        'type': EFFECT_REMOVE_THREAT,
                                                        'params': {
                                                            'title': 'Quita 2 de Amenaza de un Plan',
                                                            'target': TARGET_SCHEME
                                                        }
                                                    },
                                                    {
                                                        'type': EFFECT_DRAW_CARD,
                                                        'params': {
                                                            'title': 'Roba 3 cartas',
                                                            'target': TARGET_YOU,
                                                            'count': 3
                                                        }
                                                    },
                                                    {
                                                        'type': EFFECT_DEAL_DAMAGE,
                                                        'params': {
                                                            'title': 'Inflige 4 de Daño a un enemigo',
                                                            'target': TARGET_ENEMY,
                                                            'damage': 4
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            'type': EFFECT_LASTING,
                                            'params': {
                                                'target': TARGET_CARD,
                                                'until': TIME_ROUND,
                                                'endEffect': {
                                                    'type': EFFECT_DISCARD_GAME,
                                                    'params': {
                                                        'target': TARGET_CARD
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
];
