import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_HALF_ROUNDED_DOWN,
    CALC_TRAITS_COUNT,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    DECK_POSITION_SHUFFLE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_RESOURCES,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_FOR_EACH,
    EFFECT_HEAL,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MOVE_TO_DECK,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PLACE_THREAT,
    EFFECT_PUT_PLAY,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_STORE_BOOST,
    EFFECT_STUN,
    EFFECT_SURGE,
    EFFECT_TOUGH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    RESOURCE_ANY,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_PLAYERS,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENVIRONMENT,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_BRUTE,
    TRAIT_ICE,
    TRAIT_METAL,
    TRAIT_STONE,
    TRAIT_WEAPON,
    TRAIT_WOOD,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_PLACE_THREAT,
    TRIGGER_THIS_SCHEME,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';

const SET = 'absorbing-man';
const VILLAIN_NAME = 'Hombre Absorbente';
const SUPERIOR_ABSORPTION = 'Poder de absorción superior';
const DELAYED_SCHEME_CONDITION = {
    'player.match.mainScheme.counters': '>4',
};

const ifVillainHasTraits = (traits, effect, effectNot) => ({
    type: EFFECT_DO_IF_HAS_TRAITS,
    params: {
        target: TARGET_VILLAIN,
        traits,
        effect,
        ...(effectNot ? {effectNot} : {}),
    },
});

const villainTraitAbility = trait => ({
    type: ABILITY_CONSTANT,
    params: {
        hideDialog: true,
        trigger: TRIGGER_CONDITION_GET_TRAITS,
        triggerParams: {
            conditionSource: 'effect.selectedTarget',
            conditionTrigger: {
                name: VILLAIN_NAME,
            },
        },
        condition: {
            'effect.match.scenario.gameZone.cards.*.traits': trait,
        },
        effect: {
            type: EFFECT_MODIFY_TRAITS,
            params: {
                target: TARGET_EFFECT,
                traits: [trait],
            },
        },
    },
});

const absorbingManTraitAbilities = [
    villainTraitAbility(TRAIT_ICE),
    villainTraitAbility(TRAIT_METAL),
    villainTraitAbility(TRAIT_STONE),
    villainTraitAbility(TRAIT_WOOD),
];

const environmentResponse = effect => ({
    type: ABILITY_FORCED_RESPONSE,
    params: {
        condition: {
            'effect.isDefended': false,
        },
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
        effect,
    },
});

const environmentCard = ({name, image, trait, response}) => ({
    type: CARD_TYPE_ENVIRONMENT,
    params: {
        name,
        set: SET,
        image: `scenarios/absorbing-man/${image}.png`,
        traits: [trait],
        boost: 0,
        keywords: {
            surge: true,
        },
        abilities: [
            environmentResponse(response),
            {
                type: ABILITY_BOOST,
                params: {
                    effect: {
                        type: EFFECT_PUT_PLAY,
                        params: {
                            cardSource: 'card',
                            controller: 'player.match.scenario',
                            target: TARGET_SCENARIO,
                        },
                    },
                },
            },
        ],
    },
});

const stoneSweep = {
    type: ABILITY_WHEN_REVEALED_ALTEREGO,
    params: {
        effect: {
            type: EFFECT_ENEMY_SCHEME,
            params: {
                enemyType: CHARACTER_VILLAIN,
                schemeModifierCalc: {
                    formula: CALC_TRAITS_COUNT,
                    target: 'effect.character',
                    trait: TRAIT_STONE,
                },
                target: TARGET_MAIN_SCHEME,
            },
        },
    },
};

const stoneSweepHero = {
    type: ABILITY_WHEN_REVEALED_HERO,
    params: {
        effect: {
            type: EFFECT_ENEMY_ATTACK,
            params: {
                attackModifierCalc: {
                    formula: CALC_TRAITS_COUNT,
                    target: 'effect.character',
                    trait: TRAIT_STONE,
                },
                enemyType: CHARACTER_VILLAIN,
                target: TARGET_YOU,
            },
        },
    },
};

const absorbingManActivationResponse = trigger => ({
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger,
        effect: {
            type: EFFECT_SIMULTANEOUS,
            params: {
                effects: [
                    ifVillainHasTraits(
                        [TRAIT_ICE, TRAIT_STONE],
                        {
                            type: EFFECT_PLACE_THREAT,
                            params: {
                                target: TARGET_MAIN_SCHEME,
                                threat: 1,
                            },
                        }
                    ),
                    ifVillainHasTraits(
                        [TRAIT_METAL, TRAIT_WOOD],
                        {
                            type: EFFECT_ASSIGN_DAMAGE,
                            params: {
                                damage: 1,
                                target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                            },
                        }
                    ),
                ],
            },
        },
    },
});

const villain = ({
    attack,
    hitPoints,
    image,
    scheme,
    stage,
    abilities = [],
}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name: VILLAIN_NAME,
        set: SET,
        image: `scenarios/absorbing-man/${image}.png`,
        traits: [TRAIT_BRUTE],
        unique: true,
        stage,
        attack,
        scheme,
        hitPoints: [hitPoints, true],
        abilities: [
            ...absorbingManTraitAbilities,
            ...abilities,
        ],
    },
});

const mainSchemeA = {
    type: CARD_TYPE_MAIN_SCHEME_A_CARD,
    params: {
        name: 'Por aquí no pasa nadie',
        set: SET,
        image: 'scenarios/absorbing-man/04079b.png',
        stage: 1,
        content: {
            villains: [1, 2],
            villainsExpert: [2, 3],
        },
        abilities: [
            {
                type: ABILITY_SETUP,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                        {
                            type: EFFECT_DISCARD_UNTIL,
                            params: {
                                condition: {
                                    isEnvironment: true,
                                },
                                showSelectedCard: true,
                                title: 'Entorno que entra en juego',
                                target: TARGET_ENCOUNTER_DECK,
                            },
                        },
                        {
                            type: EFFECT_PUT_PLAY,
                            params: {
                                cardSource: 'selectedCard',
                                controller: 'player.match.scenario',
                                target: TARGET_SCENARIO,
                            },
                        },
                        {
                            type: EFFECT_MOVE_TO_DECK,
                            params: {
                                cards: 'player.match.scenario.deck.discardPile',
                                position: DECK_POSITION_SHUFFLE,
                                target: TARGET_SCENARIO,
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

const mainSchemeB = {
    type: CARD_TYPE_MAIN_SCHEME_B_CARD,
    params: {
        name: 'Por aquí no pasa nadie',
        set: SET,
        image: 'scenarios/absorbing-man/04079.png',
        stage: 1,
        startingThreat: [2, true],
        acceleration: [1, true],
        value: [12, true],
        final: true,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    condition: {
                        'effect.isAccelerationThreat': true,
                        'effect.selectedTarget.isMainScheme': true,
                    },
                    trigger: TRIGGER_PLACE_THREAT,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            counters: 1,
                            target: TARGET_MAIN_SCHEME,
                        },
                    },
                },
            },
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    hideDialog: true,
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    triggerParams: {
                        cardCondition: {
                            isEnvironment: true,
                        },
                        beforeEnterPlay: true,
                    },
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            condition: {
                                exclude: 'triggeredCard',
                            },
                            effect: {
                                type: EFFECT_DISCARD_GAME,
                                params: {
                                    target: TARGET_ENVIRONMENT,
                                },
                            },
                            target: TARGET_ENVIRONMENT,
                        },
                    },
                },
            },
        ],
    },
};

const tacticDelay = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Tácticas dilatorias',
        set: SET,
        image: 'scenarios/absorbing-man/04085.png',
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
                            type: EFFECT_PLACE_THREAT,
                            params: {
                                paramsCalc: {
                                    formula: CALC_HALF_ROUNDED_DOWN,
                                    target: 'player.match.mainScheme.counters',
                                },
                                target: TARGET_MAIN_SCHEME,
                                threat: 0,
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
                                target: TARGET_EFFECT,
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
                        condition: DELAYED_SCHEME_CONDITION,
                        effect: {
                            type: EFFECT_ASSIGN_DAMAGE,
                            params: {
                                damage: 1,
                                target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                            },
                        },
                    },
                },
            },
        },
    },
};

const stoneSweepCard = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Barrido pétreo',
        set: SET,
        image: 'scenarios/absorbing-man/04086.png',
        boost: 1,
        abilities: [
            stoneSweep,
            stoneSweepHero,
        ],
    },
};

const steelKick = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Patada de acero',
        set: SET,
        image: 'scenarios/absorbing-man/04087.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {
                        type: EFFECT_DO_IF_HAS_TRAITS,
                        params: {
                            target: TARGET_VILLAIN,
                            traits: [TRAIT_METAL],
                            effect: {
                                type: EFFECT_PLACE_THREAT,
                                params: {
                                    target: TARGET_MAIN_SCHEME,
                                    threat: 3,
                                },
                            },
                            effectNot: {
                                type: EFFECT_PLACE_THREAT,
                                params: {
                                    target: TARGET_MAIN_SCHEME,
                                    threat: 2,
                                },
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED_HERO,
                params: {
                    effect: ifVillainHasTraits(
                        [TRAIT_METAL],
                        {
                            type: EFFECT_ASSIGN_DAMAGE,
                            params: {
                                damage: 4,
                                target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                            },
                        },
                        {
                            type: EFFECT_ASSIGN_DAMAGE,
                            params: {
                                damage: 3,
                                target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                            },
                        }
                    ),
                },
            },
        ],
    },
};

const piercingThorns = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Espinas perforantes',
        set: SET,
        image: 'scenarios/absorbing-man/04088.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                        {
                            type: EFFECT_DO_IF,
                            params: {
                                condition: {
                                    'player.hand.cards.length': '>0',
                                },
                                effect: {
                                    type: EFFECT_DISCARD_RANDOM,
                                    params: {
                                        count: 1,
                                        target: TARGET_YOU,
                                    },
                                },
                            },
                        },
                        ifVillainHasTraits(
                            [TRAIT_WOOD],
                            {
                                type: EFFECT_DISCARD_GAME,
                                params: {
                                    source: 'player.gameZone.cards',
                                    target: TARGET_SOURCE,
                                },
                            }
                        ),
                            ],
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: ifVillainHasTraits(
                    [TRAIT_STONE, TRAIT_WOOD],
                    {
                        type: EFFECT_STUN,
                        params: {
                            target: TARGET_YOU,
                        },
                    }
                ),
            },
        },
    },
};

const omnimorphicDuplication = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Duplicación omnimórfica',
        set: SET,
        image: 'scenarios/absorbing-man/04089.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                ifVillainHasTraits(
                                    [TRAIT_ICE],
                                    {
                                        type: EFFECT_EXHAUST,
                                        params: {
                                            target: TARGET_YOUR_SUPERHERO,
                                        },
                                    }
                                ),
                                ifVillainHasTraits(
                                    [TRAIT_METAL],
                                    {
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
                                                    type: EFFECT_HEAL,
                                                    params: {
                                                        allowNoDamage: true,
                                                        damage: 1,
                                                        target: TARGET_VILLAIN,
                                                    },
                                                },
                                            ],
                                        },
                                    }
                                ),
                                ifVillainHasTraits(
                                    [TRAIT_STONE],
                                    {
                                        type: EFFECT_STORE_BOOST,
                                        params: {
                                            target: TARGET_VILLAIN,
                                        },
                                    }
                                ),
                                ifVillainHasTraits(
                                    [TRAIT_WOOD],
                                    {
                                        type: EFFECT_DO_IF,
                                        params: {
                                            condition: {
                                                'player.hand.cards.length': '>0',
                                            },
                                            effect: {
                                                type: EFFECT_DISCARD_RANDOM,
                                                params: {
                                                    count: 1,
                                                    target: TARGET_YOU,
                                                },
                                            },
                                        },
                                    }
                                ),
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const icyGrip = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Presa gélida',
        set: SET,
        image: 'scenarios/absorbing-man/04090.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                        {
                            type: EFFECT_STUN,
                            params: {
                                target: TARGET_YOU,
                            },
                        },
                        ifVillainHasTraits(
                            [TRAIT_ICE],
                            {
                                type: EFFECT_ASSIGN_DAMAGE,
                                params: {
                                    damage: 2,
                                    target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                },
                            }
                        ),
                            ],
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: ifVillainHasTraits(
                    [TRAIT_ICE, TRAIT_METAL],
                    {
                        type: EFFECT_TOUGH,
                        params: {
                            target: TARGET_VILLAIN,
                        },
                    }
                ),
            },
        },
    },
};

const avalanche = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: '¡Avalancha!',
        set: SET,
        image: 'scenarios/absorbing-man/04091.png',
        startingThreat: [2, true],
        boost: 3,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_CHOOSE,
                                params: {
                                    options: [
                                        {
                                            type: EFFECT_SPEND,
                                            params: {
                                                resources: [RESOURCE_ENERGY],
                                                title: 'Gasta 1 recurso de energía',
                                            },
                                        },
                                        {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                condition: DELAYED_SCHEME_CONDITION,
                                                effect: {
                                                    type: EFFECT_ASSIGN_DAMAGE,
                                                    params: {
                                                        damage: 3,
                                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                    },
                                                },
                                                effectNot: {
                                                    type: EFFECT_ASSIGN_DAMAGE,
                                                    params: {
                                                        damage: 2,
                                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                    },
                                                },
                                                title: 'Sufre Daño indirecto',
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const superiorAbsorption = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: SUPERIOR_ABSORPTION,
        set: SET,
        image: 'scenarios/absorbing-man/04092.png',
        startingThreat: [3, true],
        boost: 0,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    hideDialog: true,
                    trigger: TRIGGER_CONDITION_GET_TRAITS,
                    triggerParams: {
                        conditionSource: 'effect.selectedTarget',
                        conditionTrigger: {
                            isVillain: true,
                            name: VILLAIN_NAME,
                        },
                    },
                    effect: {
                        type: EFFECT_MODIFY_TRAITS,
                        params: {
                            target: TARGET_EFFECT,
                            traits: [
                                TRAIT_ICE,
                                TRAIT_METAL,
                                TRAIT_STONE,
                                TRAIT_WOOD,
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
                    type: EFFECT_REVEAL_ENCOUNTER,
                    params: {
                        card: 'card',
                    },
                },
            },
        },
    },
};

const absorbingManStageTwoReveal = {
    type: ABILITY_WHEN_REVEALED,
    params: {
        effect: {
            type: EFFECT_DO_IF,
            params: {
                condition: {
                    'player.match.scenario.gameZone.cards.*.name': SUPERIOR_ABSORPTION,
                },
                effect: {
                    type: EFFECT_FOR_EACH,
                    params: {
                        target: TARGET_ALL_PLAYERS,
                        effect: {
                            type: EFFECT_DEAL_ENCOUNTER,
                            params: {
                                count: 1,
                                target: TARGET_ALL_PLAYERS,
                            },
                        },
                    },
                },
                effectNot: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                    {
                        type: EFFECT_SEARCH_CARD_REVEAL,
                        params: {
                            condition: {
                                name: SUPERIOR_ABSORPTION,
                            },
                            places: [
                                PLACE_ENCOUNTER_DECK_CARDS,
                                PLACE_ENCOUNTER_DISCARD,
                            ],
                        },
                    },
                    {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'effects.0.location': PLACE_ENCOUNTER_DECK_CARDS,
                            },
                            effect: {
                                type: EFFECT_SHUFFLE_DECK,
                                params: {
                                    target: TARGET_SCENARIO,
                                },
                            },
                            target: TARGET_EFFECT,
                        },
                    },
                        ],
                    },
                },
            },
        },
    },
};

const absorbingManStageThreeResponses = [
    absorbingManActivationResponse(TRIGGER_VILLAIN_ATTACKS_YOU),
    absorbingManActivationResponse(TRIGGER_THIS_SCHEME),
];

const ballAndChain = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Bola y cadena',
        set: SET,
        image: 'scenarios/absorbing-man/04084.png',
        traits: [TRAIT_WEAPON],
        unique: true,
        attack: 1,
        scheme: 1,
        boost: 0,
        attach: TARGET_VILLAIN,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [RESOURCE_PHYSICAL],
                        },
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                        {
                            type: EFFECT_DISCARD_GAME,
                            params: {
                                target: TARGET_THIS,
                            },
                        },
                        {
                            type: EFFECT_MOVE_TO_DECK,
                            params: {
                                position: DECK_POSITION_SHUFFLE,
                                target: TARGET_SCENARIO,
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
    _id: SET,
    order: 4,
    name: VILLAIN_NAME,
    folder: SET,
    config: {
        name: SET,
        villains: [
            villain({
                attack: 2,
                hitPoints: 14,
                image: '04076',
                scheme: 1,
                stage: 1,
            }),
            villain({
                abilities: [absorbingManStageTwoReveal],
                attack: 2,
                hitPoints: 15,
                image: '04077',
                scheme: 2,
                stage: 2,
            }),
            villain({
                abilities: absorbingManStageThreeResponses,
                attack: 3,
                hitPoints: 16,
                image: '04078',
                scheme: 2,
                stage: 3,
            }),
        ],
        mainSchemes: [
            [mainSchemeA, mainSchemeB],
        ],
        sets: ['standard'],
        defaultSets: ['hydra-patrol'],
        cards: [
            {
                count: 1,
                card: environmentCard({
                    name: 'Bosque frondoso',
                    image: '04080',
                    response: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: DELAYED_SCHEME_CONDITION,
                            effect: {
                                type: EFFECT_ASSIGN_DAMAGE,
                                params: {
                                    damage: 2,
                                    target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                },
                            },
                            effectNot: {
                                type: EFFECT_ASSIGN_DAMAGE,
                                params: {
                                    damage: 1,
                                    target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                },
                            },
                        },
                    },
                    trait: TRAIT_WOOD,
                }),
            },
            {
                count: 1,
                card: environmentCard({
                    name: 'Colina nevada',
                    image: '04081',
                    response: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: DELAYED_SCHEME_CONDITION,
                            effect: {
                                type: EFFECT_PLACE_THREAT,
                                params: {
                                    target: TARGET_MAIN_SCHEME,
                                    threat: 2,
                                },
                            },
                            effectNot: {
                                type: EFFECT_PLACE_THREAT,
                                params: {
                                    target: TARGET_MAIN_SCHEME,
                                    threat: 1,
                                },
                            },
                        },
                    },
                    trait: TRAIT_ICE,
                }),
            },
            {
                count: 1,
                card: environmentCard({
                    name: 'Promontorio rocoso',
                    image: '04082',
                    response: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: DELAYED_SCHEME_CONDITION,
                            effect: {
                                type: EFFECT_HEAL,
                                params: {
                                    allowNoDamage: true,
                                    damage: 2,
                                    target: TARGET_VILLAIN,
                                },
                            },
                            effectNot: {
                                type: EFFECT_HEAL,
                                params: {
                                    allowNoDamage: true,
                                    damage: 1,
                                    target: TARGET_VILLAIN,
                                },
                            },
                        },
                    },
                    trait: TRAIT_STONE,
                }),
            },
            {
                count: 1,
                card: environmentCard({
                    name: 'Complejo abandonado',
                    image: '04083',
                    response: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: DELAYED_SCHEME_CONDITION,
                            effect: {
                                type: EFFECT_DISCARD_RESOURCES,
                                params: {
                                    resourceRequirements: [
                                        [RESOURCE_ANY],
                                        [RESOURCE_ANY],
                                    ],
                                    target: TARGET_YOU,
                                    title: 'Descarta iconos de recursos de tu mano',
                                },
                            },
                            effectNot: {
                                type: EFFECT_DISCARD_RESOURCES,
                                params: {
                                    resourceRequirements: [[RESOURCE_ANY]],
                                    target: TARGET_YOU,
                                    title: 'Descarta iconos de recursos de tu mano',
                                },
                            },
                        },
                    },
                    trait: TRAIT_METAL,
                }),
            },
            {
                count: 1,
                card: ballAndChain,
            },
            {
                count: 2,
                card: tacticDelay,
            },
            {
                count: 2,
                card: stoneSweepCard,
            },
            {
                count: 2,
                card: steelKick,
            },
            {
                count: 2,
                card: piercingThorns,
            },
            {
                count: 3,
                card: omnimorphicDuplication,
            },
            {
                count: 2,
                card: icyGrip,
            },
            {
                count: 2,
                card: avalanche,
            },
            {
                count: 1,
                card: superiorAbsorption,
            },
        ],
    },
};
