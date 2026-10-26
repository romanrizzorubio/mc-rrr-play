import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESOURCE,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    ASPECT_IDS,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_JUSTICE,
    CLASSIFICATION_LEADERSHIP,
    CLASSIFICATION_PROTECTION,
    EFFECT_ADD_TRAIT,
    EFFECT_CHAINED,
    EFFECT_ASSIGN_THREAT,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_LOOK_AT_TOP_CARDS,
    EFFECT_MAY,
    EFFECT_MOVE_TO_HAND,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PLACE_THREAT,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DECK,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_DECKS,
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_SCHEMES,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_ENGAGED,
    TARGET_HERO,
    TARGET_MAIN_SCHEME,
    TARGET_PARENT,
    TARGET_ROUND,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TIME_ROUND,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_ATTACK,
    TRAIT_CONDITION,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRAIT_SKILL,
    TRAIT_SPY,
    TRAIT_SUPERPOWER,
    TRIGGER_GET_HAND_SIZE,
    TRIGGER_INSTANT,
    TRIGGER_ROUND_ENDS,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_THWARTS,
    TRIGGER_YOU_PLAY_CARD,
    translateAspect,
} from 'mc-shared';

import {hydraTroop} from '../encounters/minions.js';
import {hailHydra} from '../encounters/treacheries.js';
import {withCardSet} from '../with-card-set.js';

const spiderwomanSet = 'Spiderwoman';

const captainMarvelCard = {
    'type': CARD_TYPE_ALLY,
    'params': {
        'name': 'Capitana Marvel',
        'subtitle': 'Carol Danvers',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04032.png',
        'traits': [
            TRAIT_AVENGER,
        ],
        'unique': true,
        'cost': 4,
        'resources': [
            RESOURCE_WILD,
        ],
        'classification': CLASSIFICATION_HERO,
        'thwart': 2,
        'attack': 2,
        'thwartConsequential': 1,
        'attackConsequential': 1,
        'hitPoints': 3,
        'abilities': [
            {
                'type': ABILITY_RESPONSE,
                'params': {
                    'trigger': TRIGGER_THIS_ATTACK,
                    'condition': {
                        'effect.ability.isBasic': true,
                    },
                    'effect': {
                        'type': EFFECT_DRAW_CARD,
                        'params': {
                            'target': TARGET_YOU,
                            'count': 1,
                        },
                    },
                },
            },
            {
                'type': ABILITY_RESPONSE,
                'params': {
                    'trigger': TRIGGER_THIS_THWARTS,
                    'condition': {
                        'effect.ability.isBasic': true,
                    },
                    'effect': {
                        'type': EFFECT_DRAW_CARD,
                        'params': {
                            'target': TARGET_YOU,
                            'count': 1,
                        },
                    },
                },
            },
        ],
    },
};

const sutilezaCard = {
    'type': CARD_TYPE_UPGRADE,
    'params': {
        'name': 'Sutileza',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04033.png',
        'traits': [
            TRAIT_CONDITION,
        ],
        'resources': [
          RESOURCE_MENTAL,
        ],
        'cost': 2,
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_HERO_RESOURCE,
                'params': {
                    'resource': RESOURCE_WILD,
                    'condition': ASPECT_IDS.map(classification => ({
                        'cardToPay.card.classification': classification,
                    })),
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const jessicaApartmentCard = {
    'type': CARD_TYPE_SUPPORT,
    'params': {
        'name': 'Apartamento de Jessica Drew',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04034.png',
        'traits': [
            TRAIT_LOCATION,
        ],
        'unique': true,
        'cost': 1,
        'resources': [
            RESOURCE_PHYSICAL,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_ALTEREGO_ACTION,
                'params': {
                    'arrow': {
                        'type': EFFECT_EXHAUST,
                        'params': {
                            'target': TARGET_THIS,
                        },
                    },
                    'effect': {
                        'type': EFFECT_CHAINED,
                        'params': {
                            'effects': [
                                {
                                    'type': EFFECT_SEARCH_CARDS,
                                    'params': {
                                        'locations': [
                                            PLACE_DECK,
                                        ],
                                        'topCount': 5,
                                        'filter': ASPECT_IDS.map(classification => ({
                                            'card.classification': classification,
                                        })),
                                        'title': 'Elige una carta de Aspecto para añadir a tu mano',
                                    },
                                },
                                {
                                    'type': EFFECT_MOVE_TO_HAND,
                                    'params': {
                                        'target': TARGET_SOURCE,
                                        'source': 'selectedCards',
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const venomBlastCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Rayo venenoso',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04035.png',
        'traits': [
            TRAIT_ATTACK,
            TRAIT_SUPERPOWER,
        ],
        'cost': 2,
        'resources': [
            RESOURCE_ENERGY,
        ],
        'classification': [
            CLASSIFICATION_HERO,
            CLASSIFICATION_AGGRESSION,
        ],
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'labels': [
                        LABEL_ATTACK,
                    ],
                    'effect': {
                        'type': EFFECT_DEAL_DAMAGE,
                        'params': {
                            'target': TARGET_ENEMY,
                            'damage': 5,
                        },
                    },
                },
            },
        ],
    },
};

const pheromonesCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Feromonas',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04036.png',
        'traits': [
            TRAIT_SUPERPOWER,
        ],
        'cost': 2,
        'resources': [
            RESOURCE_PHYSICAL,
        ],
        'classification': [
            CLASSIFICATION_HERO,
            CLASSIFICATION_LEADERSHIP,
        ],
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'effect': {
                        'type': EFFECT_SIMULTANEOUS,
                        'params': {
                            'target': TARGET_ENEMY,
                            'effects': [
                                {
                                    'type': EFFECT_STUN,
                                    'params': {
                                        'target': TARGET_ENEMY,
                                    },
                                },
                                {
                                    'type': EFFECT_CONFUSE,
                                    'params': {
                                        'target': TARGET_ENEMY,
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const toxinImmunityCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Inmunidad a toxinas',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04037.png',
        'traits': [
            TRAIT_SUPERPOWER,
        ],
        'cost': 2,
        'resources': [
            RESOURCE_ENERGY,
        ],
        'classification': [
            CLASSIFICATION_HERO,
            CLASSIFICATION_PROTECTION,
        ],
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'effect': {
                        'type': EFFECT_SIMULTANEOUS,
                        'params': {
                            'target': TARGET_HERO,
                            'condition': {
                                'name': 'Spiderwoman',
                            },
                            'effects': [
                                {
                                    'type': EFFECT_HEAL,
                                    'params': {
                                        'target': TARGET_HERO,
                                        'condition': {
                                            'name': 'Spiderwoman',
                                        },
                                        'damage': 3,
                                    },
                                },
                                {
                                    'type': EFFECT_TOUGH,
                                    'params': {
                                        'target': TARGET_HERO,
                                        'condition': {
                                            'name': 'Spiderwoman',
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
};

const stayUnnoticedCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Pasar desapercibida',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04038.png',
        'traits': [
            TRAIT_SKILL,
        ],
        'cost': 1,
        'resources': [
            RESOURCE_ENERGY,
        ],
        'classification': [
            CLASSIFICATION_HERO,
            CLASSIFICATION_JUSTICE,
        ],
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'labels': [
                        LABEL_THWART,
                    ],
                    'effect': {
                        'type': EFFECT_ASSIGN_THREAT,
                        'params': {
                            'target': TARGET_ALL_SCHEMES,
                            'threat': 3,
                        },
                    },
                },
            },
        ],
    },
};

const controlledGlideCard = {
    'type': CARD_TYPE_EVENT,
    'params': {
        'name': 'Planeo controlado',
        'set': spiderwomanSet,
        'image': 'heroes/spiderwoman/04039.png',
        'traits': [
            TRAIT_SUPERPOWER,
        ],
        'cost': 1,
        'resources': [
            RESOURCE_MENTAL,
        ],
        'classification': CLASSIFICATION_HERO,
        'abilities': [
            {
                'type': ABILITY_HERO_ACTION,
                'params': {
                    'effect': {
                        'type': EFFECT_CHAINED,
                        'params': {
                            'target': TARGET_ALL_CHARACTERS,
                            'condition': {
                                'name': 'Spiderwoman',
                            },
                            'effects': [
                                {
                                    'type': EFFECT_READY,
                                    'params': {
                                        'target': TARGET_PARENT,
                                    },
                                },
                                {
                                    'type': EFFECT_LASTING,
                                    'params': {
                                        'target': TARGET_PARENT,
                                        'until': TIME_ROUND,
                                        'effect': {
                                            'type': EFFECT_ADD_TRAIT,
                                            'params': {
                                                'target': TARGET_PARENT,
                                                'trait': TRAIT_AERIAL,
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
};

export default {
    '_id': 'spiderwoman',
    'order': 13,
    'name': 'Spiderwoman',
    'folder': 'spiderwoman',
    'config': {
        'aspectMarkerRules': {
            'activateOn': TRIGGER_YOU_PLAY_CARD,
            'deactivateOn': TRIGGER_ROUND_ENDS,
        },
        'deckBuildingRules': {
            'aspectCount': 2,
            'equalAspectCardCounts': true,
        },
        'sides': [
            {
                'type': CARD_TYPE_ALTEREGO,
                'params': {
                    'name': 'Jessica Drew',
                    'set': spiderwomanSet,
                    'image': 'heroes/spiderwoman/04031b.png',
                    'traits': [
                        TRAIT_SHIELD,
                        TRAIT_SPY,
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'recovery': 3,
                    'handSize': 6,
                    'hitPoints': 11,
                    'abilities': [
                        {
                            'type': ABILITY_ALTEREGO_ACTION,
                            'params': {
                                'name': 'Consultar la carta superior de un mazo',
                                'limit': {
                                    'count': 1,
                                    'target': TARGET_ROUND,
                                },
                                'effect': {
                                    'type': EFFECT_LOOK_AT_TOP_CARDS,
                                    'params': {
                                        'target': TARGET_ALL_DECKS,
                                        'count': 1,
                                    },
                                },
                            },
                        },
                    ],
                },
            },
            {
                'type': CARD_TYPE_HERO,
                'params': {
                    'name': 'Spiderwoman',
                    'set': spiderwomanSet,
                    'image': 'heroes/spiderwoman/04031a.png',
                    'traits': [
                        TRAIT_AVENGER,
                        TRAIT_SPY,
                    ],
                    'unique': true,
                    'classification': CLASSIFICATION_HERO,
                    'thwart': 1,
                    'attack': 1,
                    'defense': 1,
                    'handSize': 5,
                    'hitPoints': 11,
                    'abilities': ASPECT_IDS.map(aspect => ({
                        'type': ABILITY_HERO_INTERRUPT,
                        'params': {
                            'name': `Agilidad sobrehumana (${translateAspect(aspect)})`,
                            'trigger': TRIGGER_YOU_PLAY_CARD,
                            'condition': {
                                'effect.card.card.classification': aspect,
                            },
                            'limit': {
                                'count': 1,
                                'target': TARGET_ROUND,
                            },
                            'effect': {
                                'type': EFFECT_LASTING,
                                'params': {
                                    'target': TARGET_YOUR_HERO,
                                    'until': TIME_ROUND,
                                    'effect': {
                                        'type': EFFECT_SIMULTANEOUS,
                                        'params': {
                                            'effects': [
                                                {
                                                    'type': EFFECT_MODIFY_THWART_VALUE,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
                                                        'count': 1,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_MODIFY_ATTACK_VALUE,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
                                                        'count': 1,
                                                    },
                                                },
                                                {
                                                    'type': EFFECT_MODIFY_DEFENSE_VALUE,
                                                    'params': {
                                                        'target': TARGET_YOUR_HERO,
                                                        'count': 1,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    })),
                },
            },
        ],
        'cards': [
            {
                'count': 1,
                'card': captainMarvelCard,
            },
            {
                'count': 2,
                'card': sutilezaCard,
            },
            {
                'count': 1,
                'card': jessicaApartmentCard,
            },
            {
                'count': 2,
                'card': venomBlastCard,
            },
            {
                'count': 2,
                'card': pheromonesCard,
            },
            {
                'count': 2,
                'card': toxinImmunityCard,
            },
            {
                'count': 2,
                'card': stayUnnoticedCard,
            },
            {
                'count': 3,
                'card': controlledGlideCard,
            },
        ],
        'precon': [
            {
                'classification': CLASSIFICATION_BASIC,
                'cardRefs': [
                    {'id': 'basic-energy', 'count': 1},
                    {'id': 'basic-strength', 'count': 1},
                    {'id': 'basic-genius', 'count': 1},
                ],
            },
            {
                'aspect': CLASSIFICATION_AGGRESSION,
                'cardRefs': [
                    {'id': 'aggression-aprovechar-la-ventaja', 'count': 3},
                    {'id': 'aggression-golpe-imparable', 'count': 3},
                    {'id': 'aggression-entrenamiento-de-combate', 'count': 2},
                    {'id': 'aggression-tac-team', 'count': 2},
                    {'id': 'aggression-spidergirl', 'count': 1},
                ],
            },
            {
                'aspect': CLASSIFICATION_JUSTICE,
                'cardRefs': [
                    {'id': 'justice-intuicion-heroica', 'count': 2},
                    {'id': 'justice-interrogation-room', 'count': 2},
                    {'id': 'justice-spiderman', 'count': 1},
                    {'id': 'justice-investigador-sagaz', 'count': 3},
                    {'id': 'justice-despejar-la-zona', 'count': 3},
                ],
            },
        ],
        'obligation': {
            'count': 1,
            'card': {
                'type': CARD_TYPE_OBLIGATION,
                'params': {
                    'name': 'Lealtad dudosa',
                    'set': spiderwomanSet,
                    'image': 'heroes/spiderwoman/04053.png',
                    'boost': 2,
                    'giveToOwner': true,
                    'triggerInstant': true,
                    'abilities': [
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Adoptar la identidad de alter ego',
                                'effect': {
                                    'type': EFFECT_MAY,
                                    'params': {
                                        'effect': {
                                            'type': EFFECT_FLIP,
                                            'params': {
                                                'target': TARGET_YOUR_SUPERHERO,
                                                'formTarget': TARGET_ALTEREGO_SIDE,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        {
                            'type': ABILITY_CONSTANT,
                            'params': {
                                'trigger': TRIGGER_INSTANT,
                                'name': 'Resolver la obligación',
                                'effect': {
                                    'type': EFFECT_CHOOSE_ABILITY,
                                    'params': {
                                        'options': [
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Agotar a Jessica Drew para retirar del juego Lealtad dudosa',
                                                    'arrow': {
                                                        'type': EFFECT_EXHAUST,
                                                        'params': {
                                                            'target': TARGET_ALTEREGO,
                                                        },
                                                    },
                                                    'effect': {
                                                        'type': EFFECT_REMOVE_CARD,
                                                        'params': {
                                                            'target': TARGET_CARD,
                                                        },
                                                    },
                                                },
                                            },
                                            {
                                                'type': ABILITY_OPTION,
                                                'params': {
                                                    'name': 'Colocar 3 de Amenaza sobre el Plan principal y descartar esta Obligación',
                                                    'effect': {
                                                        'type': EFFECT_CHAINED,
                                                        'params': {
                                                            'effects': [
                                                                {
                                                                    'type': EFFECT_PLACE_THREAT,
                                                                    'params': {
                                                                        'target': TARGET_MAIN_SCHEME,
                                                                        'threat': 3,
                                                                    },
                                                                },
                                                                {
                                                                    'type': EFFECT_DISCARD_GAME,
                                                                    'params': {
                                                                        'target': TARGET_CARD,
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
                        },
                    ],
                },
            },
        },
        'nemesis': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_MINION,
                    'params': {
                        'name': 'Víbora',
                        'set': spiderwomanSet,
                        'image': 'heroes/spiderwoman/04054.png',
                        'traits': [
                            TRAIT_ELITE,
                            TRAIT_HYDRA,
                        ],
                        'unique': true,
                        'boost': 3,
                        'attack': 2,
                        'scheme': 2,
                        'hitPoints': 5,
                        'nemesis': true,
                        'abilities': [
                            {
                                'type': ABILITY_CONSTANT,
                                'params': {
                                    'trigger': TRIGGER_GET_HAND_SIZE,
                                    'triggerParams': {
                                        'target': TARGET_ENGAGED,
                                    },
                                    'effect': {
                                        'type': EFFECT_MODIFY_HAND_SIZE,
                                        'params': {
                                            'target': TARGET_EFFECT,
                                            'count': -1,
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
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'La ambición de Víbora',
                        'set': spiderwomanSet,
                        'image': 'heroes/spiderwoman/04055.png',
                        'boost': 2,
                        'startingThreat': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'target': TARGET_THIS,
                                            'threat': [1, true],
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
                'card': withCardSet(hydraTroop, spiderwomanSet),
            },
            {
                'count': 1,
                'card': withCardSet(hailHydra, spiderwomanSet),
            },
        ],
    },
};
