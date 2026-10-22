import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_TREACHERY,
    CALC_COUNT,
    CALC_SUM,
    CARD_TYPE_MINION,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_VILLAIN,
    CLASSIFICATION_HERO,
    CHARACTER_VILLAIN,
    DECK_POSITION_SHUFFLE,
    EFFECT_CHAINED,
    EFFECT_CONFUSE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_FACEDOWN,
    EFFECT_FOR_EACH,
    EFFECT_ADD_KEYWORD,
    EFFECT_MODIFY_ACTIVATION,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MOVE_TO_HAND,
    EFFECT_MOVE_TO_DECK,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PLACE_THREAT,
    EFFECT_PUT_PLAY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_COUNTER,
    EFFECT_RETURN_FACEDOWN,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SURGE,
    EFFECT_STUN,
    EFFECT_TOUGH,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_HAND,
    TARGET_ALL_CARDS,
    TARGET_ALL_PLAYERS,
    TARGET_ACTIVATION,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_INITIAL_PLAYER,
    TARGET_ATTACHED,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_MINION,
    TARGET_YOU,
    TARGET_VILLAIN,
    TRAIT_DROID,
    TRAIT_HYDRA,
    TRAIT_MUTATED,
    TRAIT_TECH,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';
import {revealEncounterFrom} from '../utils/reveal-encounter.js';

const SET = 'zola';
const BIO_SERVANT_NAME = 'Biosiervo definitivo';
const encounterPlaces = [
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
];

const shuffleEncounterDeck = {
    type: EFFECT_SHUFFLE_DECK,
    params: {
        target: TARGET_SCENARIO,
    },
};

const searchForTestSubjects = {
    type: EFFECT_SEARCH_CARD_REVEAL,
    params: {
        condition: {
            name: 'Sujetos de prueba',
        },
        places: encounterPlaces,
    },
};

const searchAndRevealMinion = {
    type: EFFECT_SEARCH_CARD_REVEAL,
    params: {
        title: 'Elige el Esbirro a mostrar',
        condition: {
            isMinion: true,
        },
        places: encounterPlaces,
    },
};

const searchAndRevealMinionForEachPlayer = {
    type: EFFECT_FOR_EACH,
    params: {
        target: TARGET_ALL_PLAYERS,
        effect: searchAndRevealMinion,
    },
};

const searchBioServant = {
    type: EFFECT_SEARCH_CARDS,
    params: {
        filter: {
            name: BIO_SERVANT_NAME,
            isMinion: true,
        },
        firstMatch: true,
        locations: [PLACE_ENCOUNTER_DECK_CARDS],
        requireMatch: true,
    },
};

const putMinionIntoPlayEngaged = target => ({
    type: EFFECT_ENGAGE,
    params: {
        cardSource: 'selectedCard',
        target,
    },
});

const identitySpecificAllyFilter = {
    isAlly: true,
    'card.classification': CLASSIFICATION_HERO,
};

const searchAndStoreIdentitySpecificAlly = {
    type: EFFECT_FOR_EACH,
    params: {
        target: TARGET_ALL_PLAYERS,
        effect: {
            type: EFFECT_CHAINED,
            params: {
                target: TARGET_THIS,
                effects: [
                    {
                        type: EFFECT_SEARCH_CARDS,
                        params: {
                            target: TARGET_YOU,
                            filter: identitySpecificAllyFilter,
                            locations: [
                                PLACE_HAND,
                                PLACE_DECK,
                                PLACE_DISCARD_PILE,
                            ],
                            count: 1,
                            requireMatch: true,
                            title: 'Busca un Aliado específico de tu superhéroe',
                        },
                    },
                    {
                        type: EFFECT_MOVE_TO_HAND,
                        params: {
                            target: TARGET_SOURCE,
                            source: 'selectedCards',
                        },
                    },
                    {
                        type: EFFECT_FACEDOWN,
                        params: {
                            target: TARGET_THIS,
                            cardsTarget: TARGET_SOURCE,
                            source: 'selectedCards',
                        },
                    },
                ],
            },
        },
    },
};

const placeThreatForIdentitySpecificAllies = {
    type: EFFECT_PLACE_THREAT,
    params: {
        target: TARGET_THIS,
        threat: 0,
        paramsCalc: {
            target: 'effect.ability.card.faceDown',
            formula: CALC_SUM,
            property: 'card.cost',
        },
    },
};

const shuffleEachPlayerDeck = {
    type: EFFECT_FOR_EACH,
    params: {
        target: TARGET_ALL_PLAYERS,
        effect: {
            type: EFFECT_SHUFFLE_DECK,
            params: {
                target: TARGET_YOU,
            },
        },
    },
};

const bioServant = {
    type: CARD_TYPE_MINION,
    params: {
        name: BIO_SERVANT_NAME,
        set: SET,
        image: `scenarios/${SET}/04114.png`,
        traits: [TRAIT_HYDRA, TRAIT_MUTATED],
        attack: 1,
        scheme: 1,
        hitPoints: 4,
        keywords: {
            toughness: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_GET_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'card.attached',
                                formula: CALC_COUNT,
                                conditions: {isAttachment: true},
                            },
                        },
                    },
                },
            },
        ],
        boost: 0,
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_TOUGH,
                    params: {
                        target: TARGET_VILLAIN,
                    },
                },
            },
        },
    },
};

const zolaMutate = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Mutado de Zola',
        set: SET,
        image: `scenarios/${SET}/04115.png`,
        traits: [TRAIT_HYDRA, TRAIT_MUTATED],
        attack: 2,
        scheme: 1,
        hitPoints: 5,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_THIS,
                            effects: [
                                {
                                    type: EFFECT_DISCARD_UNTIL,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        showDiscardedCards: true,
                                        condition: {
                                            isAttachment: true,
                                            traits: TRAIT_TECH,
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_PUT_PLAY,
                                    params: {
                                        cardSource: 'selectedCard',
                                        controller: 'player.match.scenario',
                                        target: TARGET_THIS,
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
        boost: 0,
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DELAYED,
                    params: {
                        target: TARGET_ACTIVATION,
                        effect: {
                            type: EFFECT_MOVE_TO_DECK,
                            params: {
                                target: TARGET_SCENARIO,
                                position: DECK_POSITION_SHUFFLE,
                            },
                        },
                    },
                },
            },
        },
    },
};

const rabidMutate = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Mutado rabioso',
        set: SET,
        image: `scenarios/${SET}/04116.png`,
        traits: [TRAIT_HYDRA, TRAIT_MUTATED],
        attack: 2,
        scheme: 0,
        hitPoints: 3,
        keywords: {
            quickStrike: true,
        },
        boost: 0,
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_PLACE_COUNTERS,
                                params: {
                                    target: TARGET_MAIN_SCHEME,
                                    counters: 1,
                                },
                            },
                            {
                                type: EFFECT_MODIFY_ACTIVATION,
                                params: {
                                    target: TARGET_ACTIVATION,
                                    attack: true,
                                    scheme: true,
                                    paramsCalc: {
                                        target: 'player.match.mainScheme.counters',
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
};

const defensiveProgramming = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Programación defensiva',
        set: SET,
        image: `scenarios/${SET}/04117.png`,
        traits: [TRAIT_TECH],
        boost: 1,
        maxAttach: 1,
        attach: {
            target: TARGET_MINION,
            condition: {
                life: {operator: 'max'},
            },
            ifNot: {
                type: EFFECT_SURGE,
            },
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                    effect: {
                        type: EFFECT_MODIFY_HIT_POINTS,
                        params: {
                            target: TARGET_ATTACHED,
                            count: 2,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_ADD_KEYWORD,
                        params: {
                            target: TARGET_ATTACHED,
                            keyword: {guard: true},
                        },
                    },
                },
            },
        ],
    },
};

const painInhibitors = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Inhibidores del dolor',
        set: SET,
        image: `scenarios/${SET}/04118.png`,
        traits: [TRAIT_TECH],
        boost: 1,
        maxAttach: 1,
        attach: {
            target: TARGET_MINION,
            condition: {
                life: {operator: 'max'},
            },
            ifNot: {
                type: EFFECT_SURGE,
            },
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                    effect: {
                        type: EFFECT_MODIFY_HIT_POINTS,
                        params: {
                            target: TARGET_ATTACHED,
                            count: 2,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_ADD_KEYWORD,
                        params: {
                            target: TARGET_ATTACHED,
                            keyword: {retaliate: 1},
                        },
                    },
                },
            },
        ],
    },
};

const neuralImplants = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Implantes neurológicos',
        set: SET,
        image: `scenarios/${SET}/04119.png`,
        traits: [TRAIT_TECH],
        attack: 2,
        scheme: 2,
        boost: 1,
        maxAttach: 1,
        attach: {
            target: TARGET_MINION,
            condition: {
                life: {operator: 'max'},
            },
            ifNot: {
                type: EFFECT_SURGE,
            },
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                    effect: {
                        type: EFFECT_MODIFY_HIT_POINTS,
                        params: {
                            target: TARGET_ATTACHED,
                            count: 2,
                        },
                    },
                },
            },
        ],
    },
};

const mentalRay = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Rayo mental',
        set: SET,
        image: `scenarios/${SET}/04120.png`,
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ENEMY_SCHEME,
                                    params: {
                                        enemyType: CHARACTER_VILLAIN,
                                        target: TARGET_MAIN_SCHEME,
                                    },
                                },
                                {
                                    type: EFFECT_CONFUSE,
                                    params: {
                                        target: TARGET_YOU,
                                    },
                                },
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
                                    },
                                },
                                {
                                    type: EFFECT_STUN,
                                    params: {
                                        target: TARGET_YOU,
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

const technologyImprovements = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Mejoras tecnológicas',
        set: SET,
        image: `scenarios/${SET}/04121.png`,
        boost: 0,
        keywords: {incite: 1},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_MAIN_SCHEME,
                            counters: 1,
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_PLACE_COUNTERS,
                    params: {
                        target: TARGET_MAIN_SCHEME,
                        counters: 1,
                    },
                },
            },
        },
    },
};

const testSubjects = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Sujetos de prueba',
        set: SET,
        image: `scenarios/${SET}/04123.png`,
        startingThreat: [2, true],
        boost: 2,
        icons: {
            hazard: 1,
        },
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_INITIAL_PLAYER,
                            effects: [
                                {
                                    type: EFFECT_DISCARD_UNTIL,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        condition: {isMinion: true},
                                    },
                                },
                                {
                                    ...revealEncounterFrom({
                                        from: PLACE_ENCOUNTER_DISCARD,
                                        cardSource: 'selectedCard',
                                        revealParams: {
                                            player: 'match.initialPlayer',
                                        },
                                    }),
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const hydraPrison = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Prisión de Hydra',
        set: SET,
        image: `scenarios/${SET}/04122.png`,
        startingThreat: 1,
        boost: 0,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_THIS,
                            effects: [
                                searchAndStoreIdentitySpecificAlly,
                                placeThreatForIdentitySpecificAllies,
                                shuffleEachPlayerDeck,
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_THIS,
                            effects: [
                                {
                                    type: EFFECT_RETURN_FACEDOWN,
                                    params: {
                                        target: TARGET_THIS,
                                        faceDownTarget: TARGET_ALL_CARDS,
                                    },
                                },
                                {
                                    type: EFFECT_REMOVE_CARD,
                                    params: {
                                        target: TARGET_THIS,
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

const zolaExperiments = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Los experimentos de Zola',
        set: SET,
        image: `scenarios/${SET}/04124.png`,
        startingThreat: [3, true],
        icons: {acceleration: 1},
        boost: 3,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    triggerParams: {
                        cardCondition: {isMinion: true},
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_ENCOUNTER_DISCARD],
                                        filter: {
                                            isAttachment: true,
                                            traits: TRAIT_TECH,
                                        },
                                        firstMatch: true,
                                        reverseLocations: [
                                            PLACE_ENCOUNTER_DISCARD,
                                        ],
                                    },
                                },
                                {
                                    type: EFFECT_PUT_PLAY,
                                    params: {
                                        cardSource: 'selectedCards',
                                        controller: 'player.match.scenario',
                                        target: TARGET_TRIGGERED_CARD,
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

const mainSchemeSetup = {
    type: ABILITY_SETUP,
    params: {
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_SEARCH_CARD_REVEAL,
                        params: {
                            condition: {
                                name: 'Prisión de Hydra',
                            },
                            places: [PLACE_ENCOUNTER_DECK_CARDS],
                        },
                    },
                    {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        searchBioServant,
                                        putMinionIntoPlayEngaged(TARGET_YOU),
                                    ],
                                },
                            },
                        },
                    },
                    shuffleEncounterDeck,
                ],
            },
        },
    },
};

const testCounterResponse = () => ({
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_VILLAIN_PHASE_STEP,
        condition: {step: 1},
        effect: {
            type: EFFECT_PLACE_COUNTERS,
            params: {
                target: TARGET_THIS,
                counters: 1,
                thenEffect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {
                            'ability.card.counters': '>2',
                        },
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_DISCARD_UNTIL,
                                        params: {
                                            condition: {isMinion: true},
                                            target: TARGET_ENCOUNTER_DECK,
                                        },
                                    },
                                    {
                                        type: EFFECT_SIMULTANEOUS,
                                        params: {
                                            effects: [
                                                putMinionIntoPlayEngaged(TARGET_INITIAL_PLAYER),
                                                {
                                                    type: EFFECT_REMOVE_COUNTER,
                                                    params: {
                                                        count: 3,
                                                        target: TARGET_THIS,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        },
    },
});

const mainScheme = ({
    name,
    stage,
    imageA,
    imageB,
    startingThreat,
    acceleration,
    value,
    content,
    abilitiesA = [],
    abilitiesB = [],
    final = false,
}) => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name,
            set: SET,
            image: `scenarios/${SET}/${imageA}.png`,
            stage,
            ...(content ? {content} : {}),
            ...(abilitiesA.length ? {abilities: abilitiesA} : {}),
        },
    },
    {
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        params: {
            name,
            set: SET,
            image: `scenarios/${SET}/${imageB}.png`,
            stage,
            startingThreat,
            acceleration,
            value,
            ...(final ? {final: true} : {}),
            ...(abilitiesB.length ? {abilities: abilitiesB} : {}),
        },
    },
];

const villain = (stage, image, scheme, attack, hitPoints, abilities = []) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Zola',
        set: SET,
        image: `scenarios/${SET}/${image}.png`,
        traits: [TRAIT_DROID, TRAIT_HYDRA],
        unique: true,
        stage,
        scheme,
        attack,
        hitPoints: [hitPoints, true],
        keywords: {
            retaliate: 1,
        },
        ...(abilities.length ? {abilities} : {}),
    },
});

const searchAndShuffle = effect => ({
    type: EFFECT_CHAINED,
    params: {
        effects: [effect, shuffleEncounterDeck],
    },
});

export default {
    _id: SET,
    order: 6,
    name: 'Zola',
    folder: SET,
    config: {
        name: SET,
        villains: [
            villain(1, '04109', 2, 1, 12),
            villain(2, '04110', 2, 2, 14, [
                {
                    type: ABILITY_WHEN_REVEALED,
                    params: {
                        effect: searchAndShuffle(searchForTestSubjects),
                    },
                },
            ]),
            villain(3, '04111', 3, 2, 16, [
                {
                    type: ABILITY_WHEN_REVEALED,
                    params: {
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    searchAndRevealMinionForEachPlayer,
                                    shuffleEncounterDeck,
                                ],
                            },
                        },
                    },
                },
            ]),
        ],
        mainSchemes: [
            mainScheme({
                name: 'La isla del doctor Zola',
                stage: 1,
                imageA: '04112a',
                imageB: '04112b',
                startingThreat: 0,
                acceleration: [1, true],
                value: [6, true],
                content: {
                    villains: [1, 2],
                    villainsExpert: [2, 3],
                },
                abilitiesA: [mainSchemeSetup],
                abilitiesB: [testCounterResponse()],
            }),
            mainScheme({
                name: 'El científico loco',
                stage: 2,
                imageA: '04113a',
                imageB: '04113b',
                startingThreat: [1, true],
                acceleration: [1, true],
                value: [8, true],
                abilitiesA: [
                    {
                        type: ABILITY_WHEN_REVEALED,
                        params: {
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        searchAndRevealMinionForEachPlayer,
                                        shuffleEncounterDeck,
                                    ],
                                },
                            },
                        },
                    },
                ],
                abilitiesB: [testCounterResponse()],
                final: true,
            }),
        ],
        cards: [
            {count: 4, card: bioServant},
            {count: 3, card: zolaMutate},
            {count: 3, card: rabidMutate},
            {count: 3, card: defensiveProgramming},
            {count: 2, card: painInhibitors},
            {count: 2, card: neuralImplants},
            {count: 3, card: mentalRay},
            {count: 2, card: technologyImprovements},
            {count: 2, card: testSubjects},
            {count: 1, card: hydraPrison},
            {count: 1, card: zolaExperiments},
        ],
        setAsideCards: [],
        sets: ['standard'],
        defaultSets: ['under-attack'],
    },
};
