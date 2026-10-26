import {
    CLASSIFICATION_BASIC,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK,
    EFFECT_REMOVE_THREAT,
    EFFECT_SELECT_AND_ORDER_TOP_CARDS,
    EFFECT_STUN,
    PLACE_DISCARD_PILE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_SCHEME,
    TARGET_YOU,
    TIME_ROUND,
    TRAIT_AVENGER,
    TRAIT_SHIELD,
    TRAIT_ASGARD,
    TRAIT_SPY,
    TRAIT_INHUMAN,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

export default [
    {
        '_id': 'basic-mockingbird',
        'classification': 'basic',
        'order': 8,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Pájaro Burlón',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/allies/01083.png',
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
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_CARD_ENTER_PLAY,
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
        'classification': 'basic',
        'order': 9,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Nick Furia',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/allies/01084.png',
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
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_FORCED_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_CARD_ENTER_PLAY,
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
    {
        '_id': 'basic-mandibulas',
        'classification': 'basic',
        'order': 30,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Mandíbulas',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/allies/05018.png',
                'traits': [
                    TRAIT_INHUMAN
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'basic',
                'thwart': 2,
                'attack': 2,
                'thwartConsequential': 2,
                'attackConsequential': 2,
                'hitPoints': 4,
                'playFrom': [
                    PLACE_DISCARD_PILE,
                ],
            }
        }
    },
{
    '_id': 'basic-maquina-de-guerra',
    'classification': 'basic',
    'order': 40,
    'card': {
        'type': CARD_TYPE_ALLY,
        'params': {
            'name': 'Máquina de Guerra',
            'subtitle': 'James Rhodes',
            'set': CLASSIFICATION_BASIC,
            'image': 'aspect/basic/allies/04020.png',
            'traits': [
                TRAIT_AVENGER,
                TRAIT_SHIELD,
            ],
            'unique': true,
            'cost': 4,
            'resources': [
                RESOURCE_MENTAL,
            ],
            'classification': 'basic',
            'thwart': 2,
            'attack': 2,
            'thwartConsequential': 1,
            'attackConsequential': 1,
            'hitPoints': 3,
            'keywords': {
                'toughness': true,
            },
            'abilities': [
                {
                    'type': ABILITY_CONSTANT,
                    'params': {
                        'hideDialog': true,
                        'trigger': TRIGGER_THIS_ATTACK,
                        'condition': {
                            'effect.ability.isBasic': true,
                        },
                        'effect': {
                            'type': EFFECT_MODIFY_ATTACK,
                            'params': {
                                'target': TARGET_EFFECT,
                                'modify': {
                                    'keywords': {
                                        'ranged': true,
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },
    },
},
{
        '_id': 'basic-heimdall',
        'classification': 'basic',
        'order': 60,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Heimdall',
                'set': CLASSIFICATION_BASIC,
                'image': 'aspect/basic/allies/06020.png',
                'traits': [
                    TRAIT_ASGARD
                ],
                'unique': true,
                'cost': 5,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'basic',
                'thwart': 2,
                'attack': 3,
                'thwartConsequential': 1,
                'attackConsequential': 2,
                'hitPoints': 4,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_CARD_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_SELECT_AND_ORDER_TOP_CARDS,
                                'params': {
                                    'target': TARGET_ENCOUNTER_DECK,
                                    'count': 3
                                }
                            }
                        }
                    }
                ]
            }
        }
    },

];
