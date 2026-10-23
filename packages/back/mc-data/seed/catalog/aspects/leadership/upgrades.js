import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_UPGRADE,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PUT_PLAY,
    EFFECT_READY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALLY,
    TARGET_ATTACHED,
    TARGET_DECK,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_PREPARATION,
    TRAIT_TACTIC,
    TRAIT_VEHICLE,
    TRIGGER_ATTACHED_GET_ATTACK,
    TRIGGER_ATTACHED_GET_THWART,
    TRIGGER_ATTACHED_GET_TRAITS,
    TRIGGER_CHARACTER_DEFEATED,
} from 'mc-shared';

export default [
    {
        '_id': 'leadership-inspiracion',
        'aspect': 'leadership',
        'order': 7,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Inspiración',
                'set': 'leadership',
                'image': 'aspect/leadership/upgrades/01074.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'leadership',
                'attach': TARGET_ALLY,
                'maxAttach': 1,
                'maximum': {
                    'count': 3,
                    'target': TARGET_DECK
                },
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'Inspiración',
                            'trigger': TRIGGER_ATTACHED_GET_THWART,
                            'effect': {
                                'type': EFFECT_MODIFY_THWART_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'name': 'Inspiración',
                            'trigger': TRIGGER_ATTACHED_GET_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_ATTACK_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'leadership-respuesta-rapida',
        'aspect': 'leadership',
        'order': 8,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Respuesta rápida',
                'set': 'leadership',
                'image': 'aspect/leadership/upgrades/08031.png',
                'traits': [
                    TRAIT_PREPARATION,
                    TRAIT_TACTIC
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'leadership',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_CHARACTER_DEFEATED,
                            'triggerParams': {
                                'characterType': CARD_TYPE_ALLY,
                                'controlledByYou': true
                            },
                            'arrow': {
                                'type': EFFECT_DISCARD_GAME,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_PUT_PLAY,
                                            'params': {
                                                'target': TARGET_TRIGGERED_CARD
                                            }
                                        },
                                        {
                                            'type': EFFECT_DEAL_DAMAGE,
                                            'params': {
                                                'target': TARGET_TRIGGERED_CARD,
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
    },
    {
        '_id': 'leadership-aeromoto',
        'aspect': 'leadership',
        'order': 9,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Aeromoto',
                'set': 'leadership',
                'image': 'aspect/leadership/upgrades/04015.png',
                'traits': [
                    TRAIT_VEHICLE
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'leadership',
                'attach': {
                    'target': TARGET_ALLY,
                    'condition': {
                        'traits': TRAIT_AVENGER,
                    },
                },
                'maxAttach': 1,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'trigger': TRIGGER_ATTACHED_GET_TRAITS,
                            'effect': {
                                'type': EFFECT_MODIFY_TRAITS,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'traits': [
                                        TRAIT_AERIAL,
                                    ],
                                },
                            },
                        },
                    },
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'Aeromoto',
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS,
                                },
                            },
                            'effect': {
                                'type': EFFECT_READY,
                                'params': {
                                    'target': TARGET_ATTACHED,
                                },
                            },
                        },
                    },
                ],
            },
        },
    }
];
