import {
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_VILLAIN,
    EFFECT_ADD_TO_ADDITIONAL_ZONE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_FOR_EACH,
    EFFECT_LOSE_GAME,
    EFFECT_PLACE_THREAT,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    MATCH_END_REASON_SCENARIO_FAILED,
    RESOURCE_ANY,
    TARGET_ALL_PLAYERS,
    TARGET_MAIN_SCHEME,
    TARGET_ROUND,
    TARGET_SOURCE,
    TARGET_TRIGGERED_TARGET,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TRAIT_ELDER_OF_THE_UNIVERSE,
    TRIGGER_CARD_WOULD_BE_DISCARDED,
    TRIGGER_SCENARIO_ADDITIONAL_ZONE_CHANGED,
} from 'mc-shared';

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
                path: 'owner.name',
            }],
        }],
        villains: [villains[0], villains[1]],
        expertVillains: [villains[1], villains[2]],
        mainSchemes: [mainScheme()],
        sets: ['standard', 'galactic-artifacts'],
        defaultSets: ['menagerie-medley'],
        cards: [],
    },
};
