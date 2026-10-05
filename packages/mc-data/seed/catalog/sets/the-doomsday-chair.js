import {
    ABILITY_FORCED_INTERRUPT,
    ABILITY_WHEN_REVEALED,
    CALC_ALL,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_ENGAGE,
    EFFECT_HEAL,
    EFFECT_PREVENT_DEFEAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_ATTACHED,
    TARGET_EFFECT,
    TARGET_MINION_HIGHEST_PRINTED_HP,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_CYBORG,
    TRAIT_ELITE,
    TRAIT_TECH,
    TRIGGER_ATTACHED_DEFEAT,
} from 'mc-shared';

export default {
    '_id': 'the-doomsday-chair',
    'config': {
        'name': 'La Silla del Juicio Final',
        'standard': false,
        'cards': [
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'La Silla del Juicio Final',
                        'set': 'the-doomsday-chair',
                        'image': 'sets/the-doomsday-chair/01183.png',
                        'boost': 3,
                        'startingThreat': 8,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_SEARCH_CARDS,
                                                    'params': {
                                                        'locations': [
                                                            PLACE_ENCOUNTER_DECK_CARDS,
                                                            PLACE_ENCOUNTER_DISCARD,
                                                        ],
                                                        'filter': {
                                                            'name': 'M.O.D.O.K.'
                                                        },
                                                        'firstMatch': true,
                                                        'requireMatch': true,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_ENGAGE,
                                                    'params': {
                                                        'target': TARGET_YOU,
                                                    },
                                                },
                                            ],
                                            'thenEffect': {
                                                'type': EFFECT_SHUFFLE_DECK,
                                                'params': {
                                                    'target': TARGET_SCENARIO,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'M.O.D.O.K.',
                        'set': 'the-doomsday-chair',
                        'image': 'sets/the-doomsday-chair/01184.png',
                        'unique': true,
                        'traits': [
                            TRAIT_CYBORG,
                            TRAIT_ELITE,
                        ],
                        'boost': 2,
                        'attack': 2,
                        'scheme': 2,
                        'hitPoints': 8,
                        'keywords': {
                            'retaliate': 2,
                        },
                    },
                },
            },
            {
                'count': 3,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Mejoras biomecánicas',
                        'set': 'the-doomsday-chair',
                        'image': 'sets/the-doomsday-chair/01185.png',
                        'traits': [
                            TRAIT_TECH,
                        ],
                        'boost': 1,
                        'maxAttach': 1,
                        'attach': {
                            'target': TARGET_MINION_HIGHEST_PRINTED_HP,
                        },
                        'keywords': {
                            'surge': true,
                        },
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_INTERRUPT,
                                'params': {
                                    'trigger': TRIGGER_ATTACHED_DEFEAT,
                                    'effect': {
                                        'type': EFFECT_CHAINED,
                                        'params': {
                                            'matchAll': true,
                                            'effects': [
                                                {
                                                    'type': EFFECT_PREVENT_DEFEAT,
                                                    'params': {
                                                        'target': TARGET_EFFECT,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_HEAL,
                                                    'params': {
                                                        'target': TARGET_ATTACHED,
                                                        'damage': 0,
                                                        'allowNoDamage': true,
                                                        'paramsCalc': {
                                                            'formula': CALC_ALL,
                                                            'target': 'effect.selectedTarget',
                                                        },
                                                    },
                                                },
                                            ],
                                            'thenEffect': {
                                                'type': EFFECT_DISCARD_GAME,
                                                'params': {
                                                    'target': TARGET_THIS,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};
