import {
    ABILITY_ACTION,
    ABILITY_RESPONSE,
    CARD_TYPE_SUPPORT,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_MOVE_THREAT,
    EFFECT_REMOVE_THREAT,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SIMULTANEOUS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_MINION,
    TARGET_PLAYER,
    TARGET_SCHEME,
    TARGET_THIS,
    TRAIT_LOCATION,
    TRAIT_PERSONA,
    TRAIT_SHIELD,
    TRIGGER_YOU_DEFEAT_MINION
} from 'mc-shared';

export default [
    {
        '_id': 'justice-interrogation-room',
        'aspect': 'justice',
        'order': 5,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Sala de interrogatorios',
                'set': 'justice',
                'image': 'aspect/justice/supports/01063.png',
                'traits': [
                    TRAIT_LOCATION
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_YOU_DEFEAT_MINION,
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'target': TARGET_SCHEME,
                                    'threat': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-surveillance-team',
        'aspect': 'justice',
        'order': 6,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Equipo de vigilancia',
                'set': 'justice',
                'image': 'aspect/justice/supports/01064.png',
                'traits': [
                    TRAIT_SHIELD
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'justice',
                'keywords': {
                    'uses': 3
                },
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'target': TARGET_THIS,
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
                                            }
                                        },
                                        {
                                            'type': EFFECT_REMOVE_COUNTER,
                                            'params': {
                                                'target': TARGET_THIS,
                                                'count': 1
                                            }
                                        }
                                    ]
                                }
                            },
                            'effect': {
                                'type': EFFECT_REMOVE_THREAT,
                                'params': {
                                    'target': TARGET_SCHEME,
                                    'threat': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-policia-de-barrio',
        'aspect': 'justice',
        'order': 7,
        'card': {
            'type': CARD_TYPE_SUPPORT,
            'params': {
                'name': 'Policía de barrio',
                'set': 'justice',
                'image': 'aspect/justice/supports/10029.png',
                'traits': [
                    TRAIT_PERSONA
                ],
                'cost': 3,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'justice',
                'abilities': [
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'Agota la Policía de barrio: traslada 1 de amenaza desde un plan hasta esta carta',
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_MOVE_THREAT,
                                'params': {
                                    'fromTarget': TARGET_SCHEME,
                                    'target': TARGET_THIS,
                                    'threat': 1
                                }
                            }
                        }
                    },
                    {
                        'type': ABILITY_ACTION,
                        'params': {
                            'name': 'Agota y descarta la Policía de barrio: inflige tanto daño a un esbirro como la amenaza que haya sobre esta carta',
                            'arrow': {
                                'type': EFFECT_SIMULTANEOUS,
                                'params': {
                                    'saveData': [
                                        'threat'
                                    ],
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_THIS
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
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_MINION,
                                    'paramsCalc': {
                                        'target': 'effect.ability.arrow.cost.savedData.threat'
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
