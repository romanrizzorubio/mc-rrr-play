import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_MODIFY_MAX_ALLIES,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PUT_PLAY,
    EFFECT_SEARCH_CARDS,
    PLACE_HAND,
    RESOURCE_ENERGY,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRAIT_AVENGER,
    TRAIT_VEHICLE,
    TRIGGER_PLAYER_TURN_START,
    TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES
} from 'mc-shared';

export default [
    {
        '_id': 'leadership-el-triskelion',
        'aspect': 'leadership',
        'order': 6,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'El Triskelion',
                'set': 'leadership',
                'image': 'aspect/leadership/supports/01073.png',
                'traits': [
                    TRAIT_LOCATION,
                    TRAIT_SHIELD
                ],
                'unique': true,
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'El Triskelion',
                            'trigger': TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES,
                            'effect': {
                                'type': EFFECT_MODIFY_MAX_ALLIES,
                                'params': {
                                    'count': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
    ,
    {
        '_id': 'leadership-quinjet',
        'aspect': 'leadership',
        'order': 20,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Quinjet',
                'set': 'leadership',
                'image': 'aspect/leadership/supports/03019.png',
                'traits': [
                    TRAIT_AVENGER,
                    TRAIT_VEHICLE
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'leadership',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_PLAYER_TURN_START,
                            'effect': {
                                'type': EFFECT_PLACE_COUNTERS,
                                'params': {
                                    'target': TARGET_THIS,
                                    'counters': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'Poner en juego un Aliado Vengador',
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'outputParams': [
                                        'selectedCard'
                                    ],
                                    'effects': [
                                        {
                                            'type': EFFECT_SEARCH_CARDS,
                                            'params': {
                                                'locations': [
                                                    PLACE_HAND
                                                ],
                                                'filter': {
                                                    'type': CARD_TYPE_ALLY,
                                                    'traits': TRAIT_AVENGER,
                                                    'cost': {
                                                        'operator': '<=',
                                                        'paramsCalc': {
                                                            'target': 'card.counters'
                                                        },
                                                        'defaultValue': 0
                                                    }
                                                },
                                                'onlyPlayable': true,
                                                'showCancel': true,
                                                'requireMatch': true
                                            }
                                        },
                                        {
                                            'type': EFFECT_PUT_PLAY,
                                            'params': {
                                                'target': TARGET_YOU,
                                                'requirePlayable': true
                                            }
                                        }
                                    ],
                                    'thenEffect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
