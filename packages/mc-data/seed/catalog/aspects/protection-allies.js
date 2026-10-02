import {
    ABILITY_INTERRUPT,
    CARD_TYPE_ALLY,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_EXHAUST,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SPEND,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_CARD,
    TARGET_EFFECT,
    TRAIT_DEFENDER,
    TRAIT_SHIELD,
    TRAIT_SPY,
    TRIGGER_TREACHERY_REVEAL
} from 'mc-shared';

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
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 2,
                'abilities': [
                    {
                        'type': ABILITY_INTERRUPT,
                        'params': {
                            'trigger': TRIGGER_TREACHERY_REVEAL,
                            'arrow': {
                                'type': EFFECT_CHAINED,
                                'params': {
                                    'effects': [
                                        {
                                            'type': EFFECT_EXHAUST,
                                            'params': {
                                                'target': TARGET_CARD
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
                                                'full': true
                                            }
                                        },
                                        {
                                            'type': EFFECT_REVEAL_ENCOUNTER
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
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 5,
                'keywords': {
                    'toughness': true
                }
            }
        }
    }
];
