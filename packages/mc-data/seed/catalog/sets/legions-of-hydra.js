import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    CALC_TRAITS_COUNT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    EFFECT_CHAINED,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CANNOT_TARGET,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_ENGAGE,
    EFFECT_PLACE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_BY_TITLE,
    TARGET_ENGAGED,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_SCHEME,
} from 'mc-shared';

export default {
    '_id': 'legions-of-hydra',
    'config': {
        'name': 'Legiones de Hydra',
        'standard': false,
        'cards': [
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Legiones de Hydra',
                        'set': 'legions-of-hydra',
                        'image': 'sets/legions-of-hydra/01180.png',
                        'boost': 3,
                        'icons': {
                            'hazard': 1
                        },
                        'startingThreat': 3,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_DO_IF_CARD_GAME,
                                                    'params': {
                                                        'condition': {
                                                            'name': 'Madame Hydra'
                                                        },
                                                        'effectNot': {
                                                            'type': EFFECT_CHAINED,
                                                            'params': {
                                                                'matchAll': true,
                                                                'effects': [
                                                                    {
                                                                        'type': EFFECT_SEARCH_CARDS,
                                                                        'params': {
                                                                            'locations': [
                                                                                PLACE_ENCOUNTER_DECK_CARDS,
                                                                                PLACE_ENCOUNTER_DISCARD
                                                                            ],
                                                                            'filter': {
                                                                                'name': 'Madame Hydra'
                                                                            },
                                                                            'firstMatch': true,
                                                                            'requireMatch': true
                                                                        }
                                                                    },
                                                                    {
                                                                        'type': EFFECT_ENGAGE,
                                                                        'params': {
                                                                            'target': TARGET_YOU
                                                                        }
                                                                    }
                                                                ],
                                                                'thenEffect': {
                                                                    'type': EFFECT_SHUFFLE_DECK,
                                                                    'params': {
                                                                        'target': TARGET_SCENARIO
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_PLACE_THREAT,
                                                    'params': {
                                                        'target': TARGET_THIS,
                                                        'threat': 0,
                                                        'paramsCalc': {
                                                            'target': 'player.match.enemies',
                                                            'formula': CALC_TRAITS_COUNT,
                                                            'trait': TRAIT_HYDRA,
                                                            'multiply': 2
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Madame Hydra',
                        'set': 'legions-of-hydra',
                        'image': 'sets/legions-of-hydra/01181.png',
                        'unique': true,
                        'traits': [
                            TRAIT_ELITE,
                            TRAIT_HYDRA
                        ],
                        'boost': 2,
                        'attack': 2,
                        'scheme': 2,
                        'hitPoints': 6,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'validation': {
                                        'type': EFFECT_CANNOT_TARGET,
                                        'params': {
                                            'effectCategories': [
                                                EFFECT_CATEGORY_DAMAGE
                                            ],
                                            'condition': {
                                                'name': 'Legiones de Hydra'
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_FORCED_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_THIS_SCHEME,
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_BY_TITLE,
                                            'title': 'Legiones de Hydra',
                                            'threat': 2
                                        }
                                    }
                                }
                            },
                            {
                                'type': ABILITY_FORCED_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_THIS_ATTACK,
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_BY_TITLE,
                                            'title': 'Legiones de Hydra',
                                            'threat': 2
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Soldado de Hydra',
                        'set': 'legions-of-hydra',
                        'image': 'sets/legions-of-hydra/01182.png',
                        'traits': [
                            TRAIT_HYDRA
                        ],
                        'boost': 1,
                        'attack': 2,
                        'scheme': 1,
                        'hitPoints': 4,
                        'keywords': {
                            'guard': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_DEFEATED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DEAL_ENCOUNTER,
                                        'params': {
                                            'target': TARGET_ENGAGED
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]
    }
};
