import {
    ABILITY_CONSTANT,
    ABILITY_RESPONSE,
    CALC_COUNT,
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_MOVE_TO_HAND,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_SEARCH_CARDS,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TRAIT_AVENGER,
    TRAIT_DEFENDER,
    TRAIT_PREPARATION,
    TRAIT_SHIELD,
    TRAIT_SPY,
    TRIGGER_CHARACTER_SCHEMES,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_THIS_THWARTS
} from 'mc-shared';

export default [
    {
        '_id': 'justice-daredevil',
        'aspect': 'justice',
        'order': 0,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Daredevil',
                'set': 'justice',
                'image': 'aspect/justice/allies/j58.webp',
                'traits': [
                    TRAIT_DEFENDER
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'justice',
                'subtitle': 'Matt Murdock',
                'thwart': 2,
                'attack': 2,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_THWARTS,
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'damage': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-jessica-jones',
        'aspect': 'justice',
        'order': 1,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Jessica Jones',
                'set': 'justice',
                'image': 'aspect/justice/allies/j59.webp',
                'traits': [
                    TRAIT_DEFENDER
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'thwart': 1,
                'attack': 2,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_THIS_GET_THWART,
                            'effect': {
                                'type': EFFECT_MODIFY_THWART_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'paramsCalc': {
                                        'target': 'player.match.sideSchemes',
                                        'formula': CALC_COUNT
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
        '_id': 'justice-agente-coulson',
        'aspect': 'justice',
        'order': 21,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Agente Coulson',
                'subtitle': 'Phil Coulson',
                'set': 'justice',
                'image': 'aspect/justice/allies/08011.png',
                'traits': [
                    TRAIT_SHIELD,
                    TRAIT_SPY
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'justice',
                'thwart': 2,
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
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_SEARCH_CARDS,
                                            'params': {
                                                'locations': [
                                                    PLACE_DECK,
                                                    PLACE_DISCARD_PILE
                                                ],
                                                'filter': {
                                                    'traits': [
                                                        TRAIT_PREPARATION
                                                    ]
                                                },
                                                'title': 'Busca una carta de PLANIFICACIÓN',
                                                'requireMatch': true
                                            }
                                        },
                                        {
                                            'type': EFFECT_MOVE_TO_HAND,
                                            'params': {
                                                'target': TARGET_SOURCE,
                                                'source': 'selectedCards'
                                            }
                                        },
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
        '_id': 'justice-temblor',
        'aspect': 'justice',
        'order': 22,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Temblor',
                'subtitle': 'Daisy Johnson',
                'set': 'justice',
                'image': 'aspect/justice/allies/08012.png',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_SHIELD
                ],
                'unique': true,
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'thwart': 1,
                'attack': 2,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 2,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_CHARACTER_SCHEMES,
                            'triggerParams': {
                                'characterType': CARD_TYPE_MINION
                            },
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_TRIGGERED_CARD,
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
