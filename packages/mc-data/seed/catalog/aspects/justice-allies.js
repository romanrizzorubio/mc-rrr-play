import {
    ABILITY_CONSTANT,
    ABILITY_RESPONSE,
    CALC_COUNT,
    CARD_TYPE_ALLY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_MODIFY_THWART_VALUE,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TRAIT_DEFENDER,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_THIS_THWARTS
} from 'mc-shared';

export default [
    {
        '_id': 'justice-daredevil',
        'aspect': 'justice',
        'order': 0,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Daredevil',
                'set': 'justice',
                'image': 'aspect/justice/allies/j58.webp',
                'traits': [
                    TRAIT_DEFENDER
                ],
                'unique': true,
                'cost': 4,
                'resources': [
                    RESOURCE_PHYSICAL
                ],
                'classification': 'justice',
                'subtitle': 'Matt Murdock',
                'thwart': 2,
                'attack': 2,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_RESPONSE,
                        'params': {
                            'trigger': TRIGGER_THIS_THWARTS,
                            'effect': {
                                'type': EFFECT_DEAL_DAMAGE,
                                'params': {
                                    'target': TARGET_ENEMY,
                                    'damage': 1
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    {
        '_id': 'justice-jessica-jones',
        'aspect': 'justice',
        'order': 1,
        'card': {
            'type': CARD_TYPE_ALLY,
            'params': {
                'name': 'Jessica Jones',
                'set': 'justice',
                'image': 'aspect/justice/allies/j59.webp',
                'traits': [
                    TRAIT_DEFENDER
                ],
                'unique': true,
                'cost': 3,
                'resources': [
                    RESOURCE_ENERGY
                ],
                'classification': 'justice',
                'thwart': 1,
                'attack': 2,
                'thwartConsequencial': 1,
                'attackConsequencial': 1,
                'hitPoints': 3,
                'abilities': [
                    {
                        'type': ABILITY_CONSTANT,
                        'params': {
                            'hideDialog': true,
                            'trigger': TRIGGER_THIS_GET_THWART,
                            'effect': {
                                'type': EFFECT_MODIFY_THWART_VALUE,
                                'params': {
                                    'target': TARGET_EFFECT,
                                    'paramsCalc': {
                                        'target': 'player.match.sideSchemes',
                                        'formula': CALC_COUNT
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
