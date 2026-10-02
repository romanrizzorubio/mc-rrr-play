import {
    ABILITY_WHEN_REVEALED,
    CALC_THREAT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHOOSE,
    EFFECT_CONFUSE,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_PLACE_THREAT,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    TARGET_ALL_HEROES_ALLIES,
    TARGET_CARD,
    TARGET_MAIN_SCHEME,
    TARGET_YOU,
    TRAIT_HYDRA
} from 'mc-shared';

export default {
    '_id': 'bomb-scare',
    'config': {
        'name': 'bomb-scare',
        'standard': true,
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Bomb Scare',
                        'set': 'bomb-scare',
                        'image': 'sets/bomb-scare/bomb1.webp',
                        'boost': 2,
                        'icons': {
                            'acceleration': 1
                        },
                        'startingThreat': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'threat': [
                                                1,
                                                true
                                            ],
                                            'target': TARGET_CARD
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Hydra Bomber',
                        'set': 'bomb-scare',
                        'image': 'sets/bomb-scare/bomb2.webp',
                        'traits': [
                            TRAIT_HYDRA
                        ],
                        'boost': 1,
                        'scheme': 1,
                        'attack': 1,
                        'hitPoints': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHOOSE,
                                        'params': {
                                            'options': [
                                                {
                                                    'type': EFFECT_TAKE_DAMAGE,
                                                    'params': {
                                                        'damage': 2,
                                                        'target': TARGET_YOU
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_PLACE_THREAT,
                                                    'params': {
                                                        'threat': 1,
                                                        'target': TARGET_MAIN_SCHEME
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
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Explosion',
                        'set': 'bomb-scare',
                        'image': 'sets/bomb-scare/bomb4.webp',
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DO_IF_CARD_GAME,
                                        'params': {
                                            'condition': {
                                                'name': 'Bomb Scare'
                                            },
                                            'effect': {
                                                'type': EFFECT_ASSIGN_DAMAGE,
                                                'params': {
                                                    'target': TARGET_ALL_HEROES_ALLIES,
                                                    'paramsCalc': {
                                                        'target': 'cardCondition',
                                                        'formula': CALC_THREAT
                                                    }
                                                }
                                            },
                                            'effectNot': {
                                                'type': EFFECT_SURGE
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
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'False Alarm',
                        'set': 'bomb-scare',
                        'image': 'sets/bomb-scare/bomb5.webp',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CONFUSE,
                                        'params': {
                                            'target': TARGET_YOU
                                        }
                                    },
                                    'ifNot': {
                                        'type': EFFECT_SURGE,
                                        'params': {}
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
