import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_PLACE_THREAT,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_TOUGH,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALL_PLAYERS,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TRAIT_ARMOR,
    TRAIT_WEAPON,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
} from 'mc-shared';

export default {
    '_id': 'under-attack',
    'config': {
        'name': 'Civiles en peligro',
        'standard': false,
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Civiles en peligro',
                        'set': 'under-attack',
                        'image': 'sets/under-attack/01151.png',
                        'startingThreat': 3,
                        'boost': 3,
                        'icons': {
                            'crisis': true,
                        },
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CHOOSE,
                                        'params': {
                                            'players': TARGET_ALL_PLAYERS,
                                            'options': [
                                                {
                                                    'type': EFFECT_PLACE_THREAT,
                                                    'params': {
                                                        'title': 'Colocar 2 de Amenaza sobre esta carta',
                                                        'threat': 2,
                                                        'target': TARGET_CARD,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_DEAL_DAMAGE,
                                                    'params': {
                                                        'title': 'Infligir 3 de Daño a tu Héroe',
                                                        'damage': 3,
                                                        'target': TARGET_YOUR_HERO,
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
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Armadura de Vibránium',
                        'set': 'under-attack',
                        'image': 'sets/under-attack/01152.png',
                        'traits': [
                            TRAIT_ARMOR,
                        ],
                        'boost': 1,
                        'attach': TARGET_VILLAIN,
                        'abilities': [
                            {
                                'type': ABILITY_FORCED_RESPONSE,
                                'params': {
                                    'trigger': TRIGGER_ATTACHED_TAKES_DAMAGE,
                                    'effect': {
                                        'type': EFFECT_TOUGH,
                                        'params': {
                                            'target': TARGET_ATTACHED,
                                        },
                                    },
                                },
                            },
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_SPEND,
                                                    'params': {
                                                        'resources': [
                                                            RESOURCE_PHYSICAL,
                                                            RESOURCE_PHYSICAL,
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    'effect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS,
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
                    'type': CARD_TYPE_ATTACHMENT,
                    'params': {
                        'name': 'Rayos de fuerza',
                        'set': 'under-attack',
                        'image': 'sets/under-attack/01153.png',
                        'traits': [
                            TRAIT_WEAPON,
                        ],
                        'boost': 1,
                        'attach': TARGET_VILLAIN,
                        'keywords': {
                            'retaliate': 1,
                        },
                        'abilities': [
                            {
                                'type': ABILITY_HERO_ACTION,
                                'params': {
                                    'arrow': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_EXHAUST,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_SPEND,
                                                    'params': {
                                                        'resources': [
                                                            RESOURCE_ENERGY,
                                                            RESOURCE_ENERGY,
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    'effect': {
                                        'type': EFFECT_DISCARD_GAME,
                                        'params': {
                                            'target': TARGET_THIS,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Descarga fulminante',
                        'set': 'under-attack',
                        'image': 'sets/under-attack/01154.png',
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DEAL_DAMAGE,
                                        'params': {
                                            'damage': 1,
                                            'target': TARGET_ALL_FRIENDLY_CHARACTERS,
                                        },
                                    },
                                },
                            },
                        ],
                        'boostAbility': {
                            'type': ABILITY_BOOST,
                            'params': {
                                'effect': {
                                    'type': EFFECT_DEAL_DAMAGE,
                                    'params': {
                                        'damage': 1,
                                        'target': TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};
