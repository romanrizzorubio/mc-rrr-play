import {
    ABILITY_HERO_INTERRUPT,
    ABILITY_RESPONSE,
    CALC_ATTACK,
    CARD_TYPE_EVENT,
    CHARACTER_VILLAIN,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_MODIFY_DEFENSE_VALUE,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_ATTACKER,
    TARGET_PLAYER,
    TRAIT_ATTACK,
    TRAIT_DEFENSE,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_VILLAIN_ATTACKS_YOU
} from 'mc-shared';

export default [
    {
        '_id': 'protection-contragolpe',
        'aspect': 'protection',
        'order': 2,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Contragolpe',
                'set': 'protection',
                'image': 'aspect/protection/events/01077.png',
                'traits': [
                    TRAIT_ATTACK
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'name': 'Contragolpe',
                            'labels': [
                                LABEL_ATTACK
                            ],
                            'trigger': TRIGGER_VILLAIN_ATTACKS_YOU,
                            'condition': {
                                'effect.isDefended': true,
                                'effect.defender.isHero': true
                            },
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ATTACKER,
                                    'paramsCalc': {
                                        'target': 'player.superhero.currentSide',
                                        'formula': CALC_ATTACK
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
        '_id': 'protection-poneos-detras-de-mi',
        'aspect': 'protection',
        'order': 3,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': '¡Poneos detrás de mí!',
                'set': 'protection',
                'image': 'aspect/protection/events/01078.png',
                'cost': 1,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'name': '¡Poneos detrás de mí!',
                            'trigger': TRIGGER_TREACHERY_REVEAL,
                            'effect': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_CANCEL_ENCOUNTER,
                                            'params': {
                                                'target': TARGET_EFFECT
                                            }
                                        },
                                        {
                                            'type': EFFECT_ENEMY_ATTACK,
                                            'params': {
                                                'enemyType': CHARACTER_VILLAIN,
                                                'target': TARGET_PLAYER
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
        '_id': 'protection-defensa-habil',
        'aspect': 'protection',
        'order': 20,
        'card': {
            'type': CARD_TYPE_EVENT,
            'params': {
                'name': 'Defensa hábil',
                'set': 'protection',
                'image': 'aspect/protection/events/03033.png',
                'traits': [
                    TRAIT_DEFENSE
                ],
                'cost': 0,
                'resources': [
                    RESOURCE_MENTAL
                ],
                'classification': 'protection',
                'abilities': [
                    {
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'name': 'Defensa hábil',
                            'labels': [
                                LABEL_DEFENSE
                            ],
                            'trigger': TRIGGER_HERO_DEFENDS_ATTACK,
                            'effect': {
                                'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'count': 3
                                }
                            }
                        }
                    }
                ]
            }
        }
    }
];
