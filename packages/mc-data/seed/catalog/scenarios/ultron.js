import {
    ABILITY_OPTION,
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_TRAITS_COUNT,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_ALL_ENGAGED_MINIONS,
    CHARACTER_VILLAIN,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CANNOT_TARGET,
    EFFECT_CONVERT_FACEDOWN_CARD,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_PUT_FACEDOWN_CARD_IN_PLAY,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_PLACE_THREAT,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_SURGE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_EFFECT,
    TARGET_ENGAGED,
    TARGET_INITIAL_PLAYER,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_ENVIRONMENT,
    TRAIT_CONDITION,
    TRAIT_DRONE,
    TRAIT_DROID,
    TRAIT_ITEM,
    TRAIT_TECH,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_FACEDOWN_CARD,
    TRIGGER_PLACE_THREAT,
    TRIGGER_THIS_SCHEME,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT_MINION,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';

const facedownDrone = ({
    count = 1,
    players,
    target = TARGET_YOU,
    title,
} = {}) => ({
    type: EFFECT_PUT_FACEDOWN_CARD_IN_PLAY,
    params: {
        count,
        players,
        target,
        title,
    },
});

const allPlayersGetDrone = () => facedownDrone({
    players: TARGET_ALL_PLAYERS,
});

const healVillainPerDrone = amountPerDrone => ({
    type: EFFECT_HEAL,
    params: {
        target: TARGET_VILLAIN,
        paramsCalc: {
            target: 'player.minions',
            formula: CALC_TRAITS_COUNT,
            trait: TRAIT_DRONE,
            multiply: amountPerDrone,
        },
    },
});

const mainSchemeCard = ({
    name,
    image,
    stage,
    abilities,
    value,
    final,
}) => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name,
            set: 'ultron',
            image: image.a,
            stage,
            ...(stage === 1 ? {
                content: {
                    villains: [1, 2],
                    villainsExpert: [2, 3],
                },
            } : {}),
            ...(abilities?.a ? {abilities: abilities.a} : {}),
        },
    },
    {
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        params: {
            name,
            set: 'ultron',
            image: image.b,
            stage,
            value,
            startingThreat: 0,
            acceleration: [1, true],
            ...(final === undefined ? {} : {final}),
            ...(abilities?.b ? {abilities: abilities.b} : {}),
        },
    },
];

const chooseDroneOrThreat = ({
    threat,
    threatTitle,
    droneTitle = 'Pon en juego la primera carta de tu mazo boca abajo como un Esbirro Dron',
    players,
}) => {
    const options = [
        {
            name: threatTitle,
            effect: {
                type: EFFECT_PLACE_THREAT,
                params: {
                    target: TARGET_MAIN_SCHEME,
                    threat,
                    title: threatTitle,
                },
            },
        },
        {
            name: droneTitle,
            effect: facedownDrone({
                title: droneTitle,
            }),
        },
    ];
    const abilityOption = ({name, effect}) => ({
        type: ABILITY_OPTION,
        params: {
            name,
            effect,
        },
    });

    if (players === TARGET_ALL_PLAYERS) {
        return {
            type: EFFECT_CHOOSE_ABILITY,
            params: {
                options: [
                    abilityOption({
                        name: 'Cada jugador elige cómo resolver esta respuesta',
                        effect: {
                            type: EFFECT_CHOOSE,
                            params: {
                                players,
                                options: options.map(option => option.effect),
                            },
                        },
                    }),
                ],
            },
        };
    }

    return {
        type: EFFECT_CHOOSE_ABILITY,
        params: {
            options: options.map(abilityOption),
        },
    };
};

const stageOneAttackResponse = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
        effect: chooseDroneOrThreat({
            threat: 1,
            threatTitle: 'Coloca 1 de Amenaza sobre el Plan principal',
        }),
    },
};

const stageTwoAttackInterrupt = {
    type: ABILITY_FORCED_INTERRUPT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    facedownDrone(),
                    {
                        type: EFFECT_LASTING,
                        params: {
                            target: TARGET_VILLAIN,
                            until: TRIGGER_THIS_ATTACK,
                            effect: {
                                type: EFFECT_MODIFY_ATTACK_VALUE,
                                params: {
                                    target: TARGET_VILLAIN,
                                    paramsCalc: {
                                        target: 'player.minions',
                                        formula: CALC_TRAITS_COUNT,
                                        trait: TRAIT_DRONE,
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        },
    },
};

const stageThreeDroneAttackBonus = {
    type: ABILITY_CONSTANT,
    params: {
        trigger: TRIGGER_CHARACTER_GET_ATTACK,
        condition: {
            'effect.selectedTarget.traits': TRAIT_DRONE,
        },
        effect: {
            type: EFFECT_MODIFY_ATTACK_VALUE,
            params: {
                target: TARGET_EFFECT,
                count: 1,
            },
        },
    },
};

const stageThreeDroneHealthBonus = {
    type: ABILITY_CONSTANT,
    params: {
        trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
        condition: {
            'effect.selectedTarget.traits': TRAIT_DRONE,
        },
        effect: {
            type: EFFECT_MODIFY_HIT_POINTS,
            params: {
                target: TARGET_EFFECT,
                count: 1,
            },
        },
    },
};

const stageThreeCannotTakeDamage = {
    type: ABILITY_CONSTANT,
    params: {
        validation: {
            type: EFFECT_CANNOT_TARGET,
            params: {
                effectCategories: [EFFECT_CATEGORY_DAMAGE],
                targetCondition: {
                    isVillain: true,
                },
                condition: {
                    isMinion: true,
                    traits: TRAIT_DRONE,
                },
            },
        },
    },
};

const stageThreeWhenRevealed = {
    type: ABILITY_WHEN_REVEALED,
    params: {
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_SEARCH_CARD_REVEAL,
                        params: {
                            condition: {
                                name: 'La Directriz Ultrón',
                            },
                            places: [
                                PLACE_ENCOUNTER_DECK_CARDS,
                                PLACE_ENCOUNTER_DISCARD,
                            ],
                        },
                    },
                    {
                        type: EFFECT_SHUFFLE_DECK,
                        params: {
                            target: TARGET_SCENARIO,
                        },
                    },
                ],
            },
        },
    },
};

const efficacyWhenRevealed = {
    type: ABILITY_WHEN_REVEALED,
    params: {
        effect: allPlayersGetDrone(),
    },
};

const efficacyBoostAbility = resource => {
    const resourceTitles = {
        [RESOURCE_ENERGY]: 'Gasta 1 recurso de energía',
        [RESOURCE_MENTAL]: 'Gasta 1 recurso mental',
        [RESOURCE_PHYSICAL]: 'Gasta 1 recurso físico',
    };
    const resourceTitle = resourceTitles[resource];

    if (!resourceTitle) {
        throw new Error(`Tipo de recurso no admitido en Eficacia androide: ${resource}`);
    }

    return {
        type: ABILITY_BOOST,
        params: {
            effect: {
                type: EFFECT_CHOOSE,
                params: {
                    options: [
                        {
                            type: EFFECT_SPEND,
                            params: {
                                resources: [resource],
                                title: resourceTitle,
                            },
                        },
                        facedownDrone({
                            title: 'Pon en juego la primera carta de tu mazo boca abajo como un Esbirro Dron',
                        }),
                    ],
                },
            },
        },
    };
};

const efficacyCard = (id, resource) => ({
    count: 1,
    card: {
        type: CARD_TYPE_TREACHERY,
        params: {
            id,
            name: 'Eficacia androide',
            set: 'ultron',
            image: 'scenarios/ultron/01144a.png',
            boost: 0,
            abilities: [efficacyWhenRevealed],
            boostAbility: efficacyBoostAbility(resource),
        },
    },
});

export default {
    _id: 'ultron',
    order: 2,
    name: 'Ultrón',
    folder: 'ultron',
    config: {
        name: 'ultron',
        villains: [
            {
                type: CARD_TYPE_VILLAIN,
                params: {
                    name: 'Ultrón',
                    set: 'ultron',
                    image: 'scenarios/ultron/01134.png',
                    traits: [TRAIT_DROID],
                    unique: true,
                    stage: 1,
                    scheme: 1,
                    attack: 2,
                    hitPoints: [17, true],
                    abilities: [stageOneAttackResponse],
                },
            },
            {
                type: CARD_TYPE_VILLAIN,
                params: {
                    name: 'Ultrón',
                    set: 'ultron',
                    image: 'scenarios/ultron/01135.png',
                    traits: [TRAIT_DROID],
                    unique: true,
                    stage: 2,
                    scheme: 2,
                    attack: 2,
                    hitPoints: [22, true],
                    abilities: [stageTwoAttackInterrupt],
                },
            },
            {
                type: CARD_TYPE_VILLAIN,
                params: {
                    name: 'Ultrón',
                    set: 'ultron',
                    image: 'scenarios/ultron/01136.png',
                    traits: [TRAIT_DROID],
                    unique: true,
                    stage: 3,
                    scheme: 2,
                    attack: 4,
                    hitPoints: [27, true],
                    abilities: [
                        stageThreeWhenRevealed,
                        stageThreeDroneAttackBonus,
                        stageThreeDroneHealthBonus,
                        stageThreeCannotTakeDamage,
                    ],
                },
            },
        ],
        mainSchemes: [
            mainSchemeCard({
                name: 'La Capucha Carmesí',
                image: {
                    a: 'scenarios/ultron/01137b.png',
                    b: 'scenarios/ultron/01137.png',
                },
                stage: 1,
                value: [3, true],
                abilities: {
                    a: [
                        {
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
                                                        isEnvironment: true,
                                                    },
                                                    places: [
                                                        PLACE_ENCOUNTER_DECK_CARDS,
                                                    ],
                                                },
                                            },
                                            {
                                                type: EFFECT_SHUFFLE_DECK,
                                                params: {
                                                    target: TARGET_SCENARIO,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                    b: [
                        {
                            type: ABILITY_WHEN_REVEALED,
                            params: {
                                effect: allPlayersGetDrone(),
                            },
                        },
                    ],
                },
            }),
            mainSchemeCard({
                name: 'Ataque al NORAD',
                image: {
                    a: 'scenarios/ultron/01138b.png',
                    b: 'scenarios/ultron/01138.png',
                },
                stage: 2,
                value: [10, true],
                abilities: {
                    a: [
                        {
                            type: ABILITY_WHEN_REVEALED,
                            params: {
                                effect: allPlayersGetDrone(),
                            },
                        },
                    ],
                    b: [
                        {
                            type: ABILITY_FORCED_RESPONSE,
                            params: {
                                trigger: TRIGGER_PLACE_THREAT,
                                condition: {
                                    'effect.isAccelerationThreat': true,
                                    'effect.selectedTarget.isMainScheme': true,
                                },
                                effect: chooseDroneOrThreat({
                                    threat: 2,
                                    threatTitle: 'Coloca 2 de Amenaza sobre este Plan',
                                    players: TARGET_ALL_PLAYERS,
                                }),
                            },
                        },
                    ],
                },
            }),
            mainSchemeCard({
                name: 'Cuenta atrás para el olvido',
                image: {
                    a: 'scenarios/ultron/01139b.png',
                    b: 'scenarios/ultron/01139.png',
                },
                stage: 3,
                value: [5, true],
                final: true,
                abilities: {
                    a: [
                        {
                            type: ABILITY_WHEN_REVEALED,
                            params: {
                                effect: allPlayersGetDrone(),
                            },
                        },
                    ],
                    b: [
                        {
                            type: ABILITY_CONSTANT,
                            params: {
                                validation: {
                                    type: EFFECT_CANNOT_TARGET,
                                    params: {
                                        effectTypes: [EFFECT_REMOVE_THREAT],
                                        targetCondition: {
                                            isMainScheme: true,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            }),
        ],
        sets: ['standard'],
        defaultSets: ['under-attack'],
        cards: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_ENVIRONMENT,
                    params: {
                        name: 'Drones de Ultrón',
                        set: 'ultron',
                        image: 'scenarios/ultron/01140.png',
                        abilities: [
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    hideDialog: true,
                                    trigger: TRIGGER_FACEDOWN_CARD,
                                    effect: {
                                        type: EFFECT_CONVERT_FACEDOWN_CARD,
                                        params: {
                                            cardType: CARD_TYPE_MINION,
                                            cardParams: {
                                                name: 'Dron boca abajo',
                                                traits: [TRAIT_DRONE],
                                                attack: 1,
                                                scheme: 1,
                                                hitPoints: 1,
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
                count: 1,
                card: {
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Transmisor de programa',
                        set: 'ultron',
                        image: 'scenarios/ultron/01141.png',
                        traits: [TRAIT_ITEM, TRAIT_TECH],
                        attach: TARGET_VILLAIN,
                        scheme: 1,
                        boost: 1,
                        abilities: [
                            {
                                type: ABILITY_FORCED_RESPONSE,
                                params: {
                                    trigger: TRIGGER_THIS_SCHEME,
                                    effect: {
                                        type: EFFECT_PLACE_THREAT,
                                        params: {
                                            target: TARGET_ALL_SIDE_SCHEMES,
                                            threat: 1,
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_HERO_ACTION,
                                params: {
                                    name: 'Descartar el Transmisor de programa',
                                    arrow: {
                                        type: EFFECT_SIMULTANEOUS,
                                        params: {
                                            effects: [
                                                {
                                                    type: EFFECT_EXHAUST,
                                                    params: {
                                                        target: TARGET_YOUR_HERO,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_SPEND,
                                                    params: {
                                                        resources: [
                                                            RESOURCE_MENTAL,
                                                            RESOURCE_MENTAL,
                                                        ],
                                                    },
                                                },
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
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Drones mejorados',
                        set: 'ultron',
                        image: 'scenarios/ultron/01142.png',
                        traits: [TRAIT_CONDITION],
                        attach: TARGET_ENVIRONMENT,
                        boost: 0,
                        abilities: [
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    trigger: TRIGGER_CHARACTER_GET_ATTACK,
                                    condition: {
                                        'effect.selectedTarget.isFacedownCard': true,
                                        'effect.selectedTarget.isMinion': true,
                                    },
                                    effect: {
                                        type: EFFECT_MODIFY_ATTACK_VALUE,
                                        params: {
                                            target: TARGET_EFFECT,
                                            count: 1,
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_CONSTANT,
                                params: {
                                    trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                                    condition: {
                                        'effect.selectedTarget.isFacedownCard': true,
                                        'effect.selectedTarget.isMinion': true,
                                    },
                                    effect: {
                                        type: EFFECT_MODIFY_HIT_POINTS,
                                        params: {
                                            target: TARGET_EFFECT,
                                            count: 1,
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_HERO_ACTION,
                                params: {
                                    name: 'Descartar Drones mejorados',
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
                },
            },
            {
                count: 3,
                card: {
                    type: CARD_TYPE_MINION,
                    params: {
                        name: 'Dron avanzado de Ultrón',
                        set: 'ultron',
                        image: 'scenarios/ultron/01143.png',
                        traits: [TRAIT_DRONE],
                        boost: 2,
                        scheme: 1,
                        attack: 1,
                        hitPoints: 4,
                        keywords: {
                            guard: true,
                        },
                        abilities: [
                            {
                                type: ABILITY_FORCED_INTERRUPT,
                                params: {
                                    trigger: TRIGGER_THIS_DEFEAT_MINION,
                                    effect: facedownDrone({
                                        target: TARGET_ENGAGED,
                                    }),
                                },
                            },
                        ],
                    },
                },
            },
            efficacyCard('ultron-android-efficiency-energy', RESOURCE_ENERGY),
            efficacyCard('ultron-android-efficiency-mental', RESOURCE_MENTAL),
            efficacyCard('ultron-android-efficiency-physical', RESOURCE_PHYSICAL),
            {
                count: 2,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'La cólera de Ultrón',
                        set: 'ultron',
                        image: 'scenarios/ultron/01145.png',
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
                                                    type: EFFECT_DISCARD_FROM_DECK,
                                                    params: {
                                                        paramsCalc: {
                                                            target: 'effects.0.threatPlaced',
                                                        },
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
                                                    type: EFFECT_DISCARD_FROM_DECK,
                                                    params: {
                                                        paramsCalc: {
                                                            target: 'effects.0.activation.takenDamage',
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
            {
                count: 2,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Secuencia de reparación',
                        set: 'ultron',
                        image: 'scenarios/ultron/01146.png',
                        boost: 1,
                        boostAbility: {
                            type: ABILITY_BOOST,
                            params: {
                                effect: healVillainPerDrone(1),
                            },
                        },
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: healVillainPerDrone(2),
                                    ifNot: {
                                        type: EFFECT_SURGE,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Ejército robótico',
                        set: 'ultron',
                        image: 'scenarios/ultron/01147.png',
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
                                                    type: EFFECT_SEVERAL_ATTACKS,
                                                    params: {
                                                        target: TARGET_YOU,
                                                        enemiesType: [
                                                            CHARACTER_ALL_ENGAGED_MINIONS,
                                                        ],
                                                        enemiesCondition: {
                                                            traits: TRAIT_DRONE,
                                                        },
                                                    },
                                                },
                                                {
                                                    type: EFFECT_DO_IF,
                                                    params: {
                                                        target: TARGET_EFFECT,
                                                        condition: {
                                                            'effects.0.attacks.length': 0,
                                                        },
                                                        effect: facedownDrone(),
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
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'Fábrica de drones',
                        set: 'ultron',
                        image: 'scenarios/ultron/01148.png',
                        boost: 2,
                        startingThreat: 4,
                        icons: {
                            acceleration: 1,
                        },
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: {
                                        type: EFFECT_CHAINED,
                                        params: {
                                            effects: [
                                                allPlayersGetDrone(),
                                                {
                                                    type: EFFECT_PLACE_THREAT,
                                                    params: {
                                                        target: TARGET_THIS,
                                                        paramsCalc: {
                                                            target: 'player.match.minions',
                                                            formula: CALC_TRAITS_COUNT,
                                                            trait: TRAIT_DRONE,
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
            {
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'IA invasiva',
                        set: 'ultron',
                        image: 'scenarios/ultron/01149.png',
                        boost: 3,
                        startingThreat: [3, true],
                        icons: {
                            hazard: 1,
                        },
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: {
                                        type: EFFECT_DISCARD_FROM_DECK,
                                        params: {
                                            count: 3,
                                            players: TARGET_ALL_PLAYERS,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'La Directriz Ultrón',
                        set: 'ultron',
                        image: 'scenarios/ultron/01150.png',
                        boost: 3,
                        startingThreat: [2, true],
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: facedownDrone({
                                        count: 2,
                                        target: TARGET_INITIAL_PLAYER,
                                    }),
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};
