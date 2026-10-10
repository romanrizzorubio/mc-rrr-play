import {
    ABILITY_BOOST,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CHANGE_ATTACK_TARGETS,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_REQUIRE_DEFENDER,
    EFFECT_SEARCH_CARDS,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_TOUGH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_HEROES,
    TARGET_CONDITION_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENGAGED_HERO,
    TARGET_INITIAL_PLAYER,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_ELITE,
    TRAIT_MASTERS_OF_EVIL,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

const mastersOfEvilScheme = {
    'count': 1,
    'card': {
        'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
        'params': {
            'name': 'Los Señores del Mal',
            'set': 'masters-of-evil',
            'image': 'sets/masters-of-evil/01128.png',
            'boost': 2,
            'startingThreat': [3, true],
            'icons': {
                'acceleration': 1,
            },
            'abilities': [
                {
                    'type': ABILITY_WHEN_REVEALED,
                    'params': {
                        'effect': {
                            'type': EFFECT_CHAINED,
                            'params': {
                                'effects': [
                                    {
                                        'type': EFFECT_DISCARD_UNTIL,
                                        'params': {
                                            'target': TARGET_ENCOUNTER_DECK,
                                            'condition': {
                                                'isMinion': true,
                                                'traits': [TRAIT_MASTERS_OF_EVIL],
                                            },
                                        },
                                    },
                                    {
                                        'type': EFFECT_ENGAGE,
                                        'params': {
                                            'target': TARGET_INITIAL_PLAYER,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            ],
        },
    },
};

const radioactiveMan = {
    'count': 1,
    'card': {
        'type': CARD_TYPE_MINION,
        'params': {
            'name': 'Hombre Radiactivo',
            'set': 'masters-of-evil',
            'image': 'sets/masters-of-evil/01129.png',
            'unique': true,
            'traits': [
                TRAIT_ELITE,
                TRAIT_MASTERS_OF_EVIL,
            ],
            'boost': 0,
            'boostAbility': {
                'type': ABILITY_BOOST,
                'params': {
                    'effect': {
                        'type': EFFECT_DISCARD_RANDOM,
                        'params': {
                            'target': TARGET_YOU,
                            'count': 1,
                        },
                    },
                },
            },
            'attack': 1,
            'scheme': 1,
            'hitPoints': 7,
            'abilities': [
                {
                    'type': ABILITY_FORCED_RESPONSE,
                    'params': {
                        'trigger': TRIGGER_THIS_ATTACK,
                        'effect': {
                            'type': EFFECT_DISCARD_RANDOM,
                            'params': {
                                'target': TARGET_YOU,
                                'count': 1,
                            },
                        },
                    },
                },
            ],
        },
    },
};

const whirlwind = {
    'count': 1,
    'card': {
        'type': CARD_TYPE_MINION,
        'params': {
            'name': 'Torbellino',
            'set': 'masters-of-evil',
            'image': 'sets/masters-of-evil/01130.png',
            'unique': true,
            'traits': [TRAIT_MASTERS_OF_EVIL],
            'boost': 0,
            'boostAbility': {
                'type': ABILITY_BOOST,
                'params': {
                    'effect': {
                        'type': EFFECT_DEAL_DAMAGE,
                        'params': {
                            'target': TARGET_ALL_HEROES,
                            'damage': 1,
                        },
                    },
                },
            },
            'attack': 2,
            'scheme': 1,
            'hitPoints': 6,
            'abilities': [
                {
                    'type': ABILITY_FORCED_INTERRUPT,
                    'params': {
                        'trigger': TRIGGER_THIS_ATTACK,
                        'effect': {
                            'type': EFFECT_CHANGE_ATTACK_TARGETS,
                            'params': {
                                'target': TARGET_ALL_HEROES,
                            },
                        },
                    },
                },
            ],
        },
    },
};

const tigerShark = {
    'count': 1,
    'card': {
        'type': CARD_TYPE_MINION,
        'params': {
            'name': 'Tiburón Tigre',
            'set': 'masters-of-evil',
            'image': 'sets/masters-of-evil/01131.png',
            'unique': true,
            'traits': [TRAIT_MASTERS_OF_EVIL],
            'boost': 0,
            'boostAbility': {
                'type': ABILITY_BOOST,
                'params': {
                    'effect': {
                        'type': EFFECT_TOUGH,
                        'params': {
                            'target': TARGET_VILLAIN,
                        },
                    },
                },
            },
            'attack': 3,
            'scheme': 1,
            'hitPoints': 6,
            'abilities': [
                {
                    'type': ABILITY_FORCED_RESPONSE,
                    'params': {
                        'trigger': TRIGGER_THIS_ATTACK,
                        'effect': {
                            'type': EFFECT_TOUGH,
                            'params': {
                                'target': TARGET_THIS,
                            },
                        },
                    },
                },
            ],
        },
    },
};

const melter = {
    'count': 1,
    'card': {
        'type': CARD_TYPE_MINION,
        'params': {
            'name': 'Fundidor',
            'set': 'masters-of-evil',
            'image': 'sets/masters-of-evil/01132.png',
            'unique': true,
            'traits': [TRAIT_MASTERS_OF_EVIL],
            'boost': 0,
            'boostAbility': {
                'type': ABILITY_BOOST,
                'params': {
                    'effect': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_ALL_ALLIES_YOU_CONTROL,
                        },
                    },
                },
            },
            'attack': 3,
            'scheme': 1,
            'hitPoints': 5,
            'abilities': [
                {
                    'type': ABILITY_FORCED_INTERRUPT,
                    'params': {
                        'trigger': TRIGGER_THIS_ATTACK,
                        'effect': {
                            'type': EFFECT_REQUIRE_DEFENDER,
                            'params': {
                                'condition': {
                                    'isAlly': true,
                                },
                            },
                        },
                    },
                },
            ],
        },
    },
};

const mastersOfChaos = {
    'count': 2,
    'card': {
        'type': CARD_TYPE_TREACHERY,
        'params': {
            'name': 'Señores del Caos',
            'set': 'masters-of-evil',
            'image': 'sets/masters-of-evil/01133.png',
            'boost': 2,
            'abilities': [
                {
                    'type': ABILITY_WHEN_REVEALED,
                    'params': {
                        'effect': {
                            'type': EFFECT_CHAINED,
                            'params': {
                                'effects': [
                                    {
                                        'type': EFFECT_SEVERAL_ATTACKS,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'attackTarget': TARGET_ENGAGED_HERO,
                                            'enemiesType': TARGET_CONDITION_CARD,
                                            'condition': {
                                                'isMinion': true,
                                                'isInPlay': true,
                                                'traits': [TRAIT_MASTERS_OF_EVIL],
                                            },
                                        },
                                    },
                                    {
                                        'type': EFFECT_DO_IF,
                                        'params': {
                                            'target': TARGET_YOU,
                                            'condition': {
                                                'effects.0.attacks.length': 0,
                                            },
                                            'effect': {
                                                'type': EFFECT_CHAINED,
                                                'params': {
                                                    'effects': [
                                                        {
                                                            'type': EFFECT_SEARCH_CARDS,
                                                            'params': {
                                                                'locations': [
                                                                    PLACE_ENCOUNTER_DECK_CARDS,
                                                                    PLACE_ENCOUNTER_DISCARD,
                                                                ],
                                                                'filter': {
                                                                    'isMinion': true,
                                                                    'traits': [TRAIT_MASTERS_OF_EVIL],
                                                                },
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
                },
            ],
        },
    },
};

export default {
    '_id': 'masters-of-evil',
    'config': {
        'name': 'Señores del mal',
        'standard': false,
        'cards': [
            mastersOfEvilScheme,
            radioactiveMan,
            whirlwind,
            tigerShark,
            melter,
            mastersOfChaos,
        ],
    },
};
