import {
    ABILITY_BOOST,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_ALL,
    CALC_COUNT,
    CHARACTER_VILLAIN,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    EFFECT_ADD_TO_ADDITIONAL_ZONE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_HAND,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_EXHAUST,
    EFFECT_FOR_EACH,
    EFFECT_LOSE_GAME,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    EFFECT_SURGE,
    MATCH_END_REASON_SCENARIO_FAILED,
    OPERATOR_MAX,
    OPERATOR_MIN,
    RESOURCE_ANY,
    RESOURCE_PHYSICAL,
    TARGET_ACTIVATION,
    TARGET_ALL_PLAYERS,
    TARGET_ATTACHED,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_ROUND,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_TARGET,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TRAIT_BOUNTY_HUNTER,
    TRAIT_ELDER_OF_THE_UNIVERSE,
    TRIGGER_CARD_WOULD_BE_DISCARDED,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_SCENARIO_ADDITIONAL_ZONE_CHANGED,
    TRAIT_ILLUSION,
} from 'mc-shared';

import {caughtOffGuard} from '../shared/treacheries.js';
import {withCardSet} from '../with-card-set.js';

const SET = 'infiltrate-the-museum';
const IMAGE_FOLDER = `scenarios/${SET}`;
const COLLECTION_ZONE_ID = 'collection';

const addTopCardToAdditionalZone = () => ({
    type: EFFECT_ADD_TO_ADDITIONAL_ZONE,
    params: {
        zoneId: COLLECTION_ZONE_ID,
        target: TARGET_YOU,
        fromTopOfDeck: true,
        title: 'Coloca la primera carta de tu mazo en La Colección',
    },
});

const moveDiscardedCardToAdditionalZone = () => ({
    type: EFFECT_ADD_TO_ADDITIONAL_ZONE,
    params: {
        zoneId: COLLECTION_ZONE_ID,
        target: TARGET_TRIGGERED_TARGET,
        inPlayOnly: true,
    },
});

const discardFromAdditionalZone = () => ({
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_SOURCE,
        source: `match.scenario.additionalZones.${COLLECTION_ZONE_ID}.cards`,
        title: 'Descarta 1 carta de La Colección',
    },
});

const forcedAdditionalZoneInterrupt = (placeThreat = false) => ({
    type: ABILITY_FORCED_INTERRUPT,
    params: {
        trigger: TRIGGER_CARD_WOULD_BE_DISCARDED,
        effect: placeThreat ? {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    moveDiscardedCardToAdditionalZone(),
                    {
                        type: EFFECT_PLACE_THREAT,
                        params: {
                            target: TARGET_MAIN_SCHEME,
                            threat: 1,
                        },
                    },
                ],
            },
        } : moveDiscardedCardToAdditionalZone(),
    },
});

const biogrammaticImage = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Imagen biogramática',
        set: SET,
        image: `${IMAGE_FOLDER}/16074.png`,
        traits: [TRAIT_ILLUSION],
        boost: 1,
        attach: {
            target: TARGET_CONDITION_CARD,
            condition: {name: 'El Coleccionista'},
        },
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_ATTACHED,
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ADD_TO_ADDITIONAL_ZONE,
                                    params: {
                                        zoneId: COLLECTION_ZONE_ID,
                                        target: TARGET_THIS,
                                        inPlayOnly: true,
                                    },
                                },
                                {
                                    type: EFFECT_PREVENT_DAMAGE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        preventAll: true,
                                    },
                                },
                                {
                                    type: EFFECT_PLACE_THREAT,
                                    params: {
                                        target: TARGET_MAIN_SCHEME,
                                        threat: 0,
                                        paramsCalc: {
                                            target: 'effects.1.preventedDamage',
                                            formula: CALC_ALL,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DELAYED,
                    params: {
                        target: TARGET_ACTIVATION,
                        effect: {
                            type: EFFECT_REVEAL_ENCOUNTER,
                            params: {
                                card: 'card',
                            },
                        },
                    },
                },
            },
        },
    },
};

const monarkStarstalker = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Monark Starstalker',
        set: SET,
        image: `${IMAGE_FOLDER}/16075.png`,
        unique: true,
        traits: [TRAIT_BOUNTY_HUNTER],
        boost: 3,
        attack: 2,
        scheme: 2,
        hitPoints: 7,
        keywords: {
            villainous: true,
        },
    },
};

const unassumingBox = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Caja poco llamativa',
        set: SET,
        image: `${IMAGE_FOLDER}/16076.png`,
        boost: 0,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ADD_TO_ADDITIONAL_ZONE,
                                    params: {
                                        zoneId: COLLECTION_ZONE_ID,
                                        target: TARGET_SOURCE,
                                        source: 'player.gameZone.cards',
                                        condition: {
                                            cost: {
                                                operator: OPERATOR_MIN,
                                                defaultValue: 0,
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.resolved': false,
                                        },
                                        effect: {
                                            type: EFFECT_SURGE,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {
                            'match.scenario.additionalZones.collection.cards.length': {
                                operator: 'lte',
                                path: 'match.players.length',
                                multiply: 3,
                            },
                        },
                        effect: addTopCardToAdditionalZone(),
                    },
                },
            },
        },
    },
};

const observeTheCosmos = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Observar el cosmos',
        set: SET,
        image: `${IMAGE_FOLDER}/16077.png`,
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHOOSE,
                        params: {
                            options: [
                                {
                                    type: EFFECT_ADD_TO_ADDITIONAL_ZONE,
                                    params: {
                                        zoneId: COLLECTION_ZONE_ID,
                                        target: TARGET_SOURCE,
                                        source: 'player.hand.cards',
                                        condition: {
                                            cost: {
                                                operator: OPERATOR_MAX,
                                                defaultValue: 0,
                                            },
                                        },
                                        fromHand: true,
                                        title: 'Coloca boca arriba en La Colección la carta de tu mano que tenga el coste más alto',
                                    },
                                },
                                {
                                    type: EFFECT_CHAINED,
                                    params: {
                                        title: 'Descarta la carta de tu mano que tenga el coste más alto y luego coloca Amenaza en el Plan principal',
                                        outputParams: ['effects'],
                                        effects: [
                                            {
                                                type: EFFECT_DISCARD_HAND,
                                                params: {
                                                    target: TARGET_SOURCE,
                                                    source: 'player.hand.cards',
                                                    condition: {
                                                        cost: {
                                                            operator: OPERATOR_MAX,
                                                            defaultValue: 0,
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                        thenEffect: {
                                            type: EFFECT_PLACE_THREAT,
                                            params: {
                                                target: TARGET_MAIN_SCHEME,
                                                threat: 0,
                                                paramsCalc: {
                                                    target: 'effects.0.selectedTarget.cost',
                                                    formula: CALC_ALL,
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
};

const stayAWhile = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Quedaos un rato',
        set: SET,
        image: `${IMAGE_FOLDER}/16078.png`,
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {
                        type: EFFECT_CHOOSE,
                        params: {
                            options: [
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        target: TARGET_YOU,
                                        resources: [
                                            RESOURCE_PHYSICAL,
                                            RESOURCE_PHYSICAL,
                                        ],
                                        title: 'Gasta 2 recursos físicos [p][p]',
                                    },
                                },
                                addTopCardToAdditionalZone(),
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED_HERO,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ENEMY_ATTACK,
                                    params: {
                                        enemyType: CHARACTER_VILLAIN,
                                        target: TARGET_YOU,
                                        attackModifier: 1,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF_TAKE_DAMAGE,
                                    params: {
                                        source: 'effects.0',
                                        target: TARGET_YOUR_HERO,
                                        effect: addTopCardToAdditionalZone(),
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

const villains = [
    {
        type: CARD_TYPE_VILLAIN,
        params: {
            name: 'El Coleccionista',
            set: SET,
            image: `${IMAGE_FOLDER}/16070.png`,
            traits: [TRAIT_ELDER_OF_THE_UNIVERSE],
            stage: 1,
            attack: 1,
            scheme: 2,
            hitPoints: [13, true],
            abilities: [forcedAdditionalZoneInterrupt()],
        },
    },
    {
        type: CARD_TYPE_VILLAIN,
        params: {
            name: 'El Coleccionista',
            set: SET,
            image: `${IMAGE_FOLDER}/16071.png`,
            traits: [TRAIT_ELDER_OF_THE_UNIVERSE],
            stage: 2,
            attack: 2,
            scheme: 3,
            hitPoints: [14, true],
            abilities: [
                forcedAdditionalZoneInterrupt(),
                {
                    type: ABILITY_WHEN_REVEALED,
                    params: {
                        effect: {
                            type: EFFECT_CHOOSE,
                            params: {
                                players: TARGET_ALL_PLAYERS,
                                options: [
                                    addTopCardToAdditionalZone(),
                                    {
                                        type: EFFECT_TAKE_DAMAGE,
                                        params: {
                                            target: TARGET_YOU,
                                            damage: 3,
                                            title: 'Sufre 3 de daño',
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
    {
        type: CARD_TYPE_VILLAIN,
        params: {
            name: 'El Coleccionista',
            set: SET,
            image: `${IMAGE_FOLDER}/16072.png`,
            traits: [TRAIT_ELDER_OF_THE_UNIVERSE],
            stage: 3,
            attack: 3,
            scheme: 4,
            hitPoints: [18, true],
            abilities: [
                {
                    type: ABILITY_WHEN_REVEALED,
                    params: {
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_FOR_EACH,
                                        params: {
                                            target: TARGET_ALL_PLAYERS,
                                            effect: addTopCardToAdditionalZone(),
                                        },
                                    },
                                    {
                                        type: EFFECT_PLACE_THREAT,
                                        params: {
                                            target: TARGET_MAIN_SCHEME,
                                            threat: 0,
                                            paramsCalc: {
                                                target: `match.scenario.additionalZones.${COLLECTION_ZONE_ID}.cards`,
                                                formula: CALC_COUNT,
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                forcedAdditionalZoneInterrupt(true),
            ],
        },
    },
];

const mainSchemeSetup = {
    type: ABILITY_SETUP,
    params: {
        effect: {
            type: EFFECT_FOR_EACH,
            params: {
                target: TARGET_ALL_PLAYERS,
                effect: addTopCardToAdditionalZone(),
            },
        },
    },
};

const collectionAction = {
    type: ABILITY_HERO_ACTION,
    params: {
        name: 'Descarta 1 carta de La Colección',
        limit: {
            count: 1,
            target: TARGET_ROUND,
            perPlayer: true,
        },
        arrow: {
            type: EFFECT_CHOOSE,
            params: {
                options: [
                    {
                        type: EFFECT_EXHAUST,
                        params: {
                            title: 'Agota tu Héroe',
                            target: TARGET_YOUR_HERO,
                        },
                    },
                    {
                        type: EFFECT_SPEND,
                        params: {
                            title: 'Gasta 2 recursos de cualquier tipo',
                            target: TARGET_YOU,
                            resources: [RESOURCE_ANY, RESOURCE_ANY],
                        },
                    },
                ],
            },
        },
        effect: discardFromAdditionalZone(),
    },
};

const collectionFullResponse = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_SCENARIO_ADDITIONAL_ZONE_CHANGED,
        condition: {
            [`match.scenario.additionalZones.${COLLECTION_ZONE_ID}.cards.length`]: '>4',
        },
        effect: {
            type: EFFECT_LOSE_GAME,
            params: {
                reason: MATCH_END_REASON_SCENARIO_FAILED,
            },
        },
    },
};

const mainScheme = () => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name: 'La gran colección',
            set: SET,
            image: `${IMAGE_FOLDER}/16073a.png`,
            stage: 1,
            abilities: [mainSchemeSetup],
        },
    },
    {
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        params: {
            name: 'La gran colección',
            set: SET,
            image: `${IMAGE_FOLDER}/16073b.png`,
            stage: 1,
            startingThreat: [4, true],
            acceleration: [1, true],
            value: [10, true],
            final: true,
            abilities: [collectionAction, collectionFullResponse],
        },
    },
];

export default {
    _id: SET,
    name: 'Infiltrados en el museo',
    folder: SET,
    config: {
        name: SET,
        additionalZones: [{
            id: COLLECTION_ZONE_ID,
            name: 'La Colección',
            displayCardInfo: [{
                id: 'owner',
                label: 'Propietario',
                path: 'owner.superhero.mainName',
            }, {
                id: 'scenarioOwner',
                label: 'Escenario',
                path: 'owner.name',
            }],
        }],
        villains: [villains[0], villains[1]],
        expertVillains: [villains[1], villains[2]],
        mainSchemes: [mainScheme()],
        sets: ['standard', 'galactic-artifacts'],
        defaultSets: ['menagerie-medley'],
        cards: [
            {
                count: 1,
                card: withCardSet(caughtOffGuard, SET),
            },
            {
                count: 1,
                card: biogrammaticImage,
            },
            {
                count: 1,
                card: monarkStarstalker,
            },
            {
                count: 2,
                card: unassumingBox,
            },
            {
                count: 2,
                card: observeTheCosmos,
            },
            {
                count: 2,
                card: stayAWhile,
            },
        ],
    },
};
