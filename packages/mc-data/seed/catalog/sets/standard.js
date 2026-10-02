import {
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_TREACHERY,
    CHARACTER_ALL_ENGAGED_MINIONS,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_REVEAL,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_INCLUDE_ASIDE_CARDS,
    EFFECT_PLACE_THREAT,
    EFFECT_REVEAL_FIRST_ENCOUNTER,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SURGE,
    PLACE_OUTSIDE_NEMESIS,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_MAIN_SCHEME,
    TARGET_PLAYER,
    TARGET_SCENARIO,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_YOU
} from 'mc-shared';

export default {
    '_id': 'standard',
    'config': {
        'name': 'standard',
        'standard': true,
        'cards': [
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Advance',
                        'set': 'standard',
                        'image': 'sets/standard/standard1.webp',
                        'boost': 0,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_ENEMY_SCHEME,
                                        'params': {
                                            'enemyType': CHARACTER_VILLAIN,
                                            'target': TARGET_MAIN_SCHEME
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
                        'name': 'Assault',
                        'set': 'standard',
                        'image': 'sets/standard/standard3.webp',
                        'boost': 0,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED_ALTEREGO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_SURGE,
                                        'params': {}
                                    }
                                }
                            },
                            {
                                'type': ABILITY_WHEN_REVEALED_HERO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_ENEMY_ATTACK,
                                        'params': {
                                            'enemyType': CHARACTER_VILLAIN,
                                            'target': TARGET_YOU
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
                        'name': 'Caught Off Guard',
                        'set': 'standard',
                        'image': 'sets/standard/standard5.webp',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': [
                                                TARGET_SUPPORT_YOU_CONTROL,
                                                TARGET_UPGRADE_YOU_CONTROL
                                            ]
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
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Gang-Up',
                        'set': 'standard',
                        'image': 'sets/standard/standard6.webp',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED_ALTEREGO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_SURGE,
                                        'params': {}
                                    }
                                }
                            },
                            {
                                'type': ABILITY_WHEN_REVEALED_HERO,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_SEVERAL_ATTACKS,
                                        'params': {
                                            'enemiesType': [
                                                CHARACTER_VILLAIN,
                                                CHARACTER_ALL_ENGAGED_MINIONS
                                            ],
                                            'target': TARGET_YOU
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
                        'name': 'Shadow of the Past',
                        'set': 'standard',
                        'image': 'sets/standard/standard7.webp',
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'effects': [
                                                {
                                                    'type': EFFECT_SEARCH_CARD_REVEAL,
                                                    'params': {
                                                        'condition': {
                                                            'isMinion': true,
                                                            'isNemesis': true
                                                        },
                                                        'places': [
                                                            PLACE_OUTSIDE_NEMESIS
                                                        ],
                                                        'revealAll': true,
                                                        'target': TARGET_YOU
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_SEARCH_CARD_REVEAL,
                                                    'params': {
                                                        'condition': {
                                                            'isSideScheme': true
                                                        },
                                                        'places': [
                                                            PLACE_OUTSIDE_NEMESIS
                                                        ],
                                                        'revealAll': true,
                                                        'target': TARGET_YOU
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_INCLUDE_ASIDE_CARDS,
                                                    'params': {
                                                        'from': PLACE_OUTSIDE_NEMESIS,
                                                        'target': TARGET_ENCOUNTER_DECK,
                                                        'ownerTarget': TARGET_SCENARIO
                                                    }
                                                },
                                                {
                                                    'type': EFFECT_DO_IF,
                                                    'params': {
                                                        'condition': {
                                                            'effects.0.hasEnterGame': false
                                                        },
                                                        'target': TARGET_EFFECT,
                                                        'effect': {
                                                            'type': EFFECT_SURGE
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
            }
        ],
        'expertSet': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Exhaustion',
                        'set': 'expert',
                        'image': 'sets/expert/expert1.webp',
                        'boost': 2,
                        'keywords': {
                            'surge': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_EXHAUST,
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Masterplan',
                        'set': 'expert',
                        'image': 'sets/expert/expert2.webp',
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_ALL_SIDE_SCHEMES,
                                            'threat': 4
                                        }
                                    },
                                    'ifNot': {
                                        'type': EFFECT_DISCARD_REVEAL,
                                        'params': {
                                            'condition': {
                                                'isSideScheme': true
                                            },
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
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Under Fire',
                        'set': 'expert',
                        'image': 'sets/expert/expert3.webp',
                        'boost': 3,
                        'keywords': {
                            'surge': true
                        },
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_REVEAL_FIRST_ENCOUNTER,
                                        'params': {
                                            'target': TARGET_PLAYER
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
