import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_INTERRUPT,
    ABILITY_SETUP,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_ATTACK,
    CALC_COUNT,
    CALC_DIFFERENT_RESOURCE_TYPE,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    DECK_POSITION_SHUFFLE,
    EFFECT_CANNOT_TARGET,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CATEGORY_LEAVE_PLAY,
    EFFECT_CHAINED,
    EFFECT_CREATE_EXTRA_DECK,
    EFFECT_DEAL_BOOST,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_ENGAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_FOR_EACH,
    EFFECT_GET_ENCOUNTER_CARD,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_PLACE_THREAT,
    EFFECT_PUT_PLAY,
    EFFECT_REMOVE_CARD,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SET_THWART_VALUE,
    EFFECT_SPEND,
    EFFECT_TOUGH,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_SCENARIO_EXTRA_DECK,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_SCHEMES,
    TARGET_ACTIVATION,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_INITIAL_PLAYER,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_SIDE_SCHEME,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_VILLAIN,
    TRAIT_CONDITION,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_ROBOT,
    TRAIT_SKILL,
    TRAIT_WEAPON,
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_CHARACTER_DEFEATED,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_SCHEME_GET_THWART,
    TRIGGER_VILLAIN_ACTIVATES,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';

const SET = 'red-skull';
const SIDE_SCHEME_DECK = 'red-skull-side-schemes';

const chain = effects => ({
    type: EFFECT_CHAINED,
    params: {effects},
});

const revealSideScheme = () => chain([
    {
        type: EFFECT_GET_ENCOUNTER_CARD,
        params: {
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
        },
    },
    {
        type: EFFECT_REVEAL_ENCOUNTER,
        params: {
            card: 'effects.0.card',
        },
    },
]);

const redSkullAttackBonus = {
    type: ABILITY_CONSTANT,
    params: {
        trigger: TRIGGER_CHARACTER_GET_ATTACK,
        condition: {
            'effect.selectedTarget.name': 'Cráneo Rojo',
        },
        effect: {
            type: EFFECT_MODIFY_ATTACK_VALUE,
            params: {
                target: TARGET_EFFECT,
                paramsCalc: {
                    target: 'match.sideSchemes',
                    formula: CALC_COUNT,
                },
            },
        },
    },
};

const redSkullDamageRestriction = {
    type: ABILITY_CONSTANT,
    params: {
        validation: {
            type: EFFECT_CANNOT_TARGET,
            params: {
                effectCategories: [EFFECT_CATEGORY_DAMAGE],
                targetCondition: {
                    name: 'Cráneo Rojo',
                },
            },
        },
    },
};

const dealEncounterCardToEachPlayer = {
    type: EFFECT_FOR_EACH,
    params: {
        target: TARGET_ALL_PLAYERS,
        effect: {
            type: EFFECT_DEAL_ENCOUNTER,
            params: {
                target: TARGET_YOU,
                count: 1,
            },
        },
    },
};

const redSkull = ({stage, attack, scheme, hitPoints, image, abilities = []}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Cráneo Rojo',
        set: SET,
        image: `scenarios/red-skull/${image}.png`,
        traits: [TRAIT_HYDRA],
        unique: true,
        stage,
        attack,
        scheme,
        hitPoints: [hitPoints, true],
        abilities: [redSkullAttackBonus, ...abilities],
    },
});

const setupRedHouseAndSideSchemeDeck = {
    type: ABILITY_SETUP,
    params: {
        effect: chain([
            {
                type: EFFECT_PUT_PLAY,
                params: {
                    target: TARGET_SCENARIO,
                    controller: 'player.match.scenario',
                    cardSource: 'player.match.scenario.deck.cards',
                    cardCondition: {
                        name: 'La Casa Roja',
                    },
                },
            },
            {
                type: EFFECT_CREATE_EXTRA_DECK,
                params: {
                    deckId: SIDE_SCHEME_DECK,
                    name: 'Planes secundarios',
                    cardCondition: {
                        isSideScheme: true,
                    },
                    collectCondition: {
                        isSideScheme: true,
                    },
                    hasDiscard: true,
                },
            },
        ]),
    },
};

const forcedSideSchemeReveal = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_VILLAIN_PHASE_STEP,
        condition: {step: 1},
        effect: revealSideScheme(),
    },
};

const mainScheme = ({
    name,
    stage,
    imageA,
    imageB,
    startingThreat,
    acceleration,
    value,
    final = false,
    abilitiesA = [],
}) => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name,
            set: SET,
            image: `scenarios/red-skull/${imageA}.png`,
            stage,
            ...(stage === 1 ? {
                content: {
                    villains: [1, 2],
                    villainsExpert: [2, 3],
                },
            } : {}),
            ...(abilitiesA.length ? {abilities: abilitiesA} : {}),
        },
    },
    {
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        params: {
            name,
            set: SET,
            image: `scenarios/red-skull/${imageB}.png`,
            stage,
            startingThreat,
            acceleration,
            value,
            ...(final ? {final: true} : {}),
            abilities: [forcedSideSchemeReveal],
        },
    },
];

const sleeper = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'El Durmiente',
        set: SET,
        image: 'scenarios/red-skull/04130.png',
        unique: true,
        traits: [TRAIT_ELITE, TRAIT_HYDRA, TRAIT_ROBOT],
        boost: 1,
        attack: 3,
        scheme: 1,
        hitPoints: [5, true],
        keywords: {
            guard: true,
            retaliate: 1,
            toughness: true,
        },
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_ENGAGE,
                        params: {
                            target: TARGET_INITIAL_PLAYER,
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_REMOVE_CARD,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const sleepingScheme = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'El Durmiente ha despertado',
        set: SET,
        image: 'scenarios/red-skull/04140.png',
        startingThreat: 0,
        boost: 0,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    validation: {
                        type: EFFECT_CANNOT_TARGET,
                        params: {
                            effectCategories: [EFFECT_CATEGORY_LEAVE_PLAY],
                            targetCondition: {
                                name: 'El Durmiente ha despertado',
                                isInPlay: true,
                            },
                            effectCondition: {
                                'match.inPlayCards.*.name': 'El Durmiente',
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_ENGAGE,
                        params: {
                            target: TARGET_INITIAL_PLAYER,
                            cardSource: 'player.match.scenario.apart',
                            cardCondition: {
                                name: 'El Durmiente',
                                isMinion: true,
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_CHARACTER_DEFEATED,
                    triggerParams: {
                        characterType: CARD_TYPE_MINION,
                    },
                    condition: {
                        'effect.defeatedCharacter.name': 'El Durmiente',
                    },
                    effect: {
                        type: EFFECT_REMOVE_CARD,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const redHouse = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'La Casa Roja',
        set: SET,
        image: 'scenarios/red-skull/04139.png',
        boost: 0,
        startingThreat: [3, true],
        abilities: [
            redSkullDamageRestriction,
            {
                type: ABILITY_INTERRUPT,
                params: {
                    trigger: TRIGGER_SCHEME_GET_THWART,
                    effect: {
                        type: EFFECT_SET_THWART_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'triggeredEffect.selectedTarget',
                                formula: CALC_ATTACK,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const concentrationCamps = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Campos de concentración',
        set: SET,
        image: 'scenarios/red-skull/04141.png',
        boost: 0,
        startingThreat: [3, true],
        icons: {acceleration: 1},
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: chain([
                        {
                            type: EFFECT_SEARCH_CARDS,
                            params: {
                                locations: [PLACE_DECK, PLACE_DISCARD_PILE],
                                filter: {isAlly: true},
                                title: 'Elige un Aliado para poner en juego',
                            },
                        },
                        {
                            type: EFFECT_PUT_PLAY,
                            params: {
                                cardSource: 'selectedCards',
                            },
                        },
                    ]),
                },
            },
        ],
    },
};

const censorThePast = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Censurar el pasado',
        set: SET,
        image: 'scenarios/red-skull/04142.png',
        boost: 0,
        startingThreat: [3, true],
        icons: {acceleration: 1},
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: chain([
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_DISCARD_PILE],
                                        title: 'Elige hasta 3 cartas de tu pila de descartes para añadir a tu mazo',
                                        count: 3,
                                        upTo: true,
                                    },
                                },
                                {
                                    type: EFFECT_MOVE_TO_DECK,
                                    params: {
                                        target: TARGET_YOU,
                                        cards: 'selectedCards',
                                        position: DECK_POSITION_SHUFFLE,
                                    },
                                },
                            ]),
                        },
                    },
                },
            },
        ],
    },
};

const hydraReinforcements = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Refuerzos de Hydra',
        set: SET,
        image: 'scenarios/red-skull/04143.png',
        boost: 0,
        startingThreat: [2, true],
        icons: {hazard: 1},
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {
                            target: TARGET_CONDITION_CARD,
                            condition: {
                                isMinion: true,
                                isInPlay: true,
                                not: {traits: TRAIT_ELITE},
                            },
                        },
                    },
                },
            },
        ],
    },
};

const generalizedChaos = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Caos generalizado',
        set: SET,
        image: 'scenarios/red-skull/04144.png',
        boost: 0,
        startingThreat: 0,
        icons: {crisis: true},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: chain([
                                {
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        target: TARGET_YOU,
                                        count: 5,
                                    },
                                },
                                {
                                    type: EFFECT_PLACE_THREAT,
                                    params: {
                                        target: TARGET_THIS,
                                        threat: 0,
                                        paramsCalc: {
                                            target: 'effects.0.cards',
                                            formula: CALC_DIFFERENT_RESOURCE_TYPE,
                                        },
                                    },
                                },
                            ]),
                        },
                    },
                },
            },
        ],
    },
};

const armoredHydraSoldier = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Soldado de Hydra con exoarmadura',
        set: SET,
        image: 'scenarios/red-skull/04131.png',
        traits: [TRAIT_HYDRA],
        attack: 2,
        scheme: 2,
        hitPoints: 5,
        keywords: {
            toughness: true,
        },
        boost: 0,
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_SIMULTANEOUS,
                    params: {
                        effects: [
                            {
                                type: EFFECT_TOUGH,
                                params: {
                                    target: TARGET_VILLAIN,
                                },
                            },
                            {
                                type: EFFECT_DEAL_BOOST,
                                params: {
                                    target: TARGET_VILLAIN,
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
};

const redSkullLuger = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Luger de Cráneo Rojo',
        set: SET,
        image: 'scenarios/red-skull/04132.png',
        traits: [TRAIT_WEAPON],
        unique: true,
        attack: 1,
        scheme: 1,
        boost: 0,
        attach: TARGET_VILLAIN,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_VILLAIN_ATTACKS,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK,
                        params: {
                            target: TARGET_EFFECT,
                            modify: {
                                keywords: {
                                    ranged: true,
                                    piercing: true,
                                },
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [
                                RESOURCE_ENERGY,
                                RESOURCE_MENTAL,
                                RESOURCE_PHYSICAL,
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_PUT_PLAY,
                    params: {
                        cardSource: 'card',
                        controller: 'player.match.scenario',
                        target: TARGET_VILLAIN,
                    },
                },
            },
        },
    },
};

const redSkullRightHook = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Derechazo de Cráneo Rojo',
        set: SET,
        image: 'scenarios/red-skull/04133.png',
        traits: [TRAIT_SKILL],
        boost: 3,
        attach: TARGET_VILLAIN,
        keywords: {
            retaliate: 1,
        },
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [
                                RESOURCE_ENERGY,
                                RESOURCE_MENTAL,
                                RESOURCE_PHYSICAL,
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const redSkullStrategist = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Estratega consumado',
        set: SET,
        image: 'scenarios/red-skull/04134.png',
        traits: [TRAIT_SKILL],
        boost: 2,
        attach: TARGET_VILLAIN,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_VILLAIN_ACTIVATES,
                    condition: {
                        'effect.character.name': 'Cráneo Rojo',
                    },
                    maximum: {
                        count: 1,
                        target: TARGET_ACTIVATION,
                    },
                    effect: {
                        type: EFFECT_DEAL_BOOST,
                        params: {
                            paramsCalc: {
                                target: 'match.sideSchemes',
                                formula: CALC_COUNT,
                            },
                            thenEffect: {
                                type: EFFECT_DISCARD_GAME,
                                params: {
                                    target: TARGET_THIS,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const distortedReality = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Realidad distorsionada',
        set: SET,
        image: 'scenarios/red-skull/04135.png',
        traits: [TRAIT_CONDITION],
        boost: 2,
        attach: TARGET_SIDE_SCHEME,
        keywords: {incite: 1},
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_ATTACHED_DEFEAT,
                    effect: {
                        type: EFFECT_DEAL_ENCOUNTER,
                        params: {
                            target: TARGET_INITIAL_PLAYER,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

const staunchEnemy = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Enemigo acérrimo',
        set: SET,
        image: 'scenarios/red-skull/04136.png',
        boost: 0,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                            multipleTarget: true,
                            targetCountCalc: {
                                target: 'match.sideSchemes',
                                formula: CALC_COUNT,
                            },
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_EXHAUST,
                    params: {
                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                        selectCount: 1,
                    },
                },
            },
        },
    },
};

const spreadLies = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Difundir mentiras',
        set: SET,
        image: 'scenarios/red-skull/04137.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_PLACE_THREAT,
                        params: {
                            target: TARGET_ALL_SCHEMES,
                            threat: 2,
                        },
                    },
                },
            },
        ],
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

const infinitePower = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Poder infinito',
        set: SET,
        image: 'scenarios/red-skull/04138.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: chain([
                        {
                            type: EFFECT_TOUGH,
                            params: {
                                target: TARGET_VILLAIN,
                            },
                        },
                        {
                            type: EFFECT_ENEMY_SCHEME,
                            params: {
                                enemyType: CHARACTER_VILLAIN,
                                target: TARGET_MAIN_SCHEME,
                            },
                        },
                    ]),
                },
            },
            {
                type: ABILITY_WHEN_REVEALED_HERO,
                params: {
                    effect: chain([
                        {
                            type: EFFECT_TOUGH,
                            params: {
                                target: TARGET_VILLAIN,
                            },
                        },
                        {
                            type: EFFECT_ENEMY_ATTACK,
                            params: {
                                enemyType: CHARACTER_VILLAIN,
                                target: TARGET_YOU,
                            },
                        },
                    ]),
                },
            },
        ],
    },
};

export default {
    _id: 'red-skull',
    name: 'Cráneo Rojo',
    folder: 'red-skull',
    config: {
        name: 'Cráneo Rojo',
        villains: [
            redSkull({
                stage: 1,
                attack: 0,
                scheme: 2,
                hitPoints: 12,
                image: '04125',
            }),
            redSkull({
                stage: 2,
                attack: 1,
                scheme: 3,
                hitPoints: 16,
                image: '04126',
                abilities: [
                    {
                        type: ABILITY_WHEN_REVEALED,
                        params: {
                            effect: dealEncounterCardToEachPlayer,
                        },
                    },
                ],
            }),
            redSkull({
                stage: 3,
                attack: 2,
                scheme: 3,
                hitPoints: 20,
                image: '04127',
                abilities: [
                    {
                        type: ABILITY_WHEN_REVEALED,
                        params: {
                            effect: dealEncounterCardToEachPlayer,
                        },
                    },
                ],
            }),
        ],
        mainSchemes: [
            mainScheme({
                name: 'La tiranía de Cráneo Rojo',
                stage: 1,
                imageA: '04128a',
                imageB: '04128b',
                startingThreat: 0,
                acceleration: [1, true],
                value: [8, true],
                abilitiesA: [setupRedHouseAndSideSchemeDeck],
            }),
            mainScheme({
                name: 'El nuevo mundo de Hydra',
                stage: 2,
                imageA: '04129a',
                imageB: '04129b',
                startingThreat: [1, true],
                acceleration: [1, true],
                value: [11, true],
                final: true,
                abilitiesA: [
                    {
                        type: ABILITY_WHEN_REVEALED,
                        params: {
                            effect: revealSideScheme(),
                        },
                    },
                ],
            }),
        ],
        cards: [
            {count: 1, card: armoredHydraSoldier},
            {count: 1, card: redSkullLuger},
            {count: 2, card: redSkullRightHook},
            {count: 2, card: redSkullStrategist},
            {count: 2, card: distortedReality},
            {count: 2, card: staunchEnemy},
            {count: 2, card: spreadLies},
            {count: 2, card: infinitePower},
            {count: 1, card: redHouse},
            {count: 1, card: sleepingScheme},
            {count: 1, card: concentrationCamps},
            {count: 1, card: censorThePast},
            {count: 1, card: hydraReinforcements},
            {count: 1, card: generalizedChaos},
        ],
        sets: ['standard'],
        defaultSets: ['hydra-assault', 'hydra-patrol'],
        setAsideCards: [{count: 1, card: sleeper}],
    },
};
