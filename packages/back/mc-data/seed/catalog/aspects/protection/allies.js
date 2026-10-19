import {
    ABILITY_CONSTANT,
    ABILITY_INTERRUPT,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_ANY,
    CARD_TYPE_EVENT,
    DECK_POSITION_SHUFFLE,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_COUNTERS,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_STUN,
    PLACE_DECK,
    PLACE_ENCOUNTER_DECK,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ATTACKER,
    TARGET_ATTACKED,
    TARGET_EFFECT,
    TARGET_SOURCE,
    TARGET_THIS,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
    TRAIT_AVENGER,
    TRAIT_CHAMPION,
    TRAIT_DEFENDER,
    TRAIT_MYSTIC,
    TRAIT_SHIELD,
    TRAIT_SPY,
} from 'mc-shared';

import {revealEncounterFrom} from '../../utils/reveal-encounter.js';

export default [
    {
        '_id': 'protection-viuda-negra',
        'aspect': 'protection',
        'order': 0,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Viuda Negra',
                'subtitle': 'Natasha Romanoff',
                'set': 'protection',
                'image': 'aspect/protection/allies/01075.png',
                'traits': [
                    TRAIT_SHIELD,
                    TRAIT_SPY
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'thwart': 2,
                'attack': 1,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 2,
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_ENCOUNTER_REVEAL,
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_SPEND,
                                            'params': {
                                                'resources': [
                                                    RESOURCE_MENTAL
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_CANCEL_ENCOUNTER,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'type': CARD_TYPE_ANY,
                                                'full': true,
                                                'thenEffect': revealEncounterFrom({
                                                    from: PLACE_ENCOUNTER_DECK,
                                                })
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
        '_id': 'protection-luke-cage',
        'aspect': 'protection',
        'order': 1,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Luke Cage',
                'set': 'protection',
                'image': 'aspect/protection/allies/01076.png',
                'traits': [
                    TRAIT_DEFENDER
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'thwart': 1,
                'attack': 2,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 5,
                'keywords': {
                    'toughness': true
                }
            }
        }
    },
    {
        '_id': 'protection-nova',
        'aspect': 'protection',
        'order': 30,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Nova',
                'subtitle': 'Sam Alexander',
                'set': 'protection',
                'image': 'aspect/protection/allies/05012.png',
                'traits': [
                    TRAIT_CHAMPION
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'protection',
                'thwart': 1,
                'attack': 2,
                'thwartConsequential': 1,
                'attackConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_ENEMY_ATTACKS_YOU,
                            'arrow': {
                                'type': EFFECT_SPEND,
                                'params': {
                                    'resources': [
                                        RESOURCE_ENERGY
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ATTACKER,
                                    'damage': 2
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'protection-hermano-vudu',
        'aspect': 'protection',
        'order': 90,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Hermano Vudú',
                'subtitle': 'Jericho Drumm',
                'set': 'protection',
                'image': 'aspect/protection/allies/09012.png',
                'unique': true,
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_MYSTIC
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'attack': 1,
                'thwart': 2,
                'thwartConsequential': 2,
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
                                                'locations': [PLACE_DECK],
                                                'topCount': 5,
                                                'count': 1,
                                                'filter': {
                                                    'type': CARD_TYPE_EVENT,
                                                },
                                                'title': 'Busca un Evento entre las 5 primeras cartas de tu mazo',
                                            },
                                        },
                                        {
                                            'type': EFFECT_MOVE_TO_HAND,
                                            'params': {
                                                'target': TARGET_SOURCE,
                                                'source': 'selectedCards',
                                            },
                                        },
                                        {
                                            'type': EFFECT_SHUFFLE_DECK,
                                        },
                                    ],
                                },
                            },
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'protection-clea',
        'aspect': 'protection',
        'order': 91,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Clea',
                'set': 'protection',
                'image': 'aspect/protection/allies/09013.png',
                'unique': true,
                'traits': [
                    TRAIT_MYSTIC
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'attack': 1,
                'thwart': 1,
                'attackConsequential': 1,
                'thwartConsequential': 1,
                'hitPoints': 2,
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_THIS_DEFEAT,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_REMOVE_CARD,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_MOVE_TO_DECK,
                                            'params': {
                                                'position': DECK_POSITION_SHUFFLE
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
        '_id': 'protection-puno-de-hierro',
        'aspect': 'protection',
        'order': 92,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Puño de Hierro',
                'subtitle': 'Danny Rand',
                'set': 'protection',
                'image': 'aspect/protection/allies/09014.png',
                'unique': true,
                'traits': [
                    TRAIT_DEFENDER
                ],
                'cost': 4,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'attack': 2,
                'thwart': 1,
                'attackConsequential': 1,
                'thwartConsequential': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_CARD_ENTER_PLAY,
                            'effect': {
                                'type': EFFECT_PLACE_COUNTERS,
                                'params': {
                                    'target': TARGET_THIS,
                                    'counters': 2
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_THIS_ATTACK,
                            'arrow': {
                                'type': EFFECT_REMOVE_COUNTER,
                                'params': {
                                    'target': TARGET_THIS,
                                    'count': 1
                                }
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_ATTACKED,
                                    'effects': [
                                        {
                                            'type': EFFECT_STUN,
                                            'params': {
                                                'target': TARGET_ATTACKED
                                            }
                                        },
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_ATTACKED,
                                                'damage': 1
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
