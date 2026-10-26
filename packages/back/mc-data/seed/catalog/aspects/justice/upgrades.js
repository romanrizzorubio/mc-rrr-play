import {
    CLASSIFICATION_JUSTICE,
    CARD_TYPE_ANY,
    ABILITY_CONSTANT,
    ABILITY_HERO_RESPONSE,
    ABILITY_INTERRUPT,
    CARD_TYPE_UPGRADE,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PREVENT_PLACE_THREAT,
    PLACE_ENCOUNTER_DECK,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_ANY_PLAYER,
    TARGET_PLAYER,
    TARGET_SIDE_SCHEME,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_CONDITION,
    TRAIT_PREPARATION,
    TRAIT_SKILL,
    TRAIT_SPY,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_SIDE_SCHEME_DEFEATED,
    TRIGGER_WOULD_PLACE_THREAT,
    TRIGGER_YOUR_HERO_GET_THWART
} from 'mc-shared';

import {revealEncounterFrom} from '../../utils/reveal-encounter.js';

export default [
    {
        '_id': 'justice-intuicion-heroica',
        'aspect': 'justice',
        'order': 7,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Intuición heróica',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/upgrades/j65-copy.webp',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 2,
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
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_YOUR_HERO_GET_THWART,
                            'effect': {
                                'type': EFFECT_MODIFY_THWART_VALUE,
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
        '_id': 'justice-seguimiento',
        'aspect': 'justice',
        'order': 20,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Seguimiento',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/upgrades/03032.png',
                'cost': 1,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'attach': TARGET_SIDE_SCHEME,
                'maxAttach': 1,
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_ATTACHED_DEFEAT,
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'damage': 4
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
{
        '_id': 'justice-bajo-vigilancia',
        'aspect': 'justice',
        'order': 60,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Bajo vigilancia',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/upgrades/06031.png',
                'traits': [
                    TRAIT_CONDITION
                ],
                'cost': 2,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'attach': TARGET_MAIN_SCHEME,
                'maxAttach': 1,
                'threatThresholdModifier': 4
            }
        }
    },
    {
        '_id': 'justice-investigador-sagaz',
        'aspect': 'justice',
        'order': 63,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Investigador sagaz',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/upgrades/04047.png',
                'traits': [
                    TRAIT_SKILL
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': CLASSIFICATION_JUSTICE,
                'controllerTarget': TARGET_ANY_PLAYER,
                'maximum': {
                    'count': 1,
                    'target': TARGET_PLAYER
                },
                'abilities': [
                    {
                        'type': ABILITY_HERO_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_SIDE_SCHEME_DEFEATED,
                            'arrow': {
                                'type': EFFECT_EXHAUST,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_DRAW_CARD,
                                'params': {
                                    'target': TARGET_YOU,
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
        '_id': 'justice-contraespionaje',
        'aspect': 'justice',
        'order': 61,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Contraespionaje',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/upgrades/08017.png',
                'traits': [
                    TRAIT_PREPARATION,
                    TRAIT_SKILL
                ],
                'cost': 2,
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
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_WOULD_PLACE_THREAT,
                            'condition': {
                                'effect.selectedTarget.isMainScheme': true
                            },
                            'arrow': {
                                'type': EFFECT_DISCARD_GAME,
                                'params': {
                                    'target': TARGET_THIS
                                }
                            },
                            'effect': {
                                'type': EFFECT_PREVENT_PLACE_THREAT,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'threat': 3
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-tacticas-de-infiltracion',
        'aspect': 'justice',
        'order': 62,
        'card': {
            'type': CARD_TYPE_UPGRADE,
            'params': {
                'name': 'Tácticas de infiltración',
                'set': CLASSIFICATION_JUSTICE,
                'image': 'aspect/justice/upgrades/08018.png',
                'traits': [
                    TRAIT_PREPARATION,
                    TRAIT_SKILL
                ],
                'cost': 1,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'justice',
                'paramsToPlay': {
                    'friends.*.traits': TRAIT_SPY
                },
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_ENCOUNTER_REVEAL,
                            'condition': {
                                'effect.selectedTarget.hasUncancellableAbilities': false
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
                                            'type': EFFECT_CANCEL_ENCOUNTER,
                                            'params': {
                                                'target': TARGET_EFFECT,
                                                'type': CARD_TYPE_ANY,
                                                'full': true
                                            }
                                        },
                                        revealEncounterFrom({
                                            'from': PLACE_ENCOUNTER_DECK
                                        })
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
