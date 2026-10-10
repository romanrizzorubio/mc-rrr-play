import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PLACE_THREAT,
    EFFECT_REPLACE_EFFECT,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SIMULTANEOUS,
    EFFECT_STORE_BOOST,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_PLAYERS,
    TARGET_BY_TITLE,
    TARGET_CARD,
    TARGET_ENVIRONMENT,
    TARGET_PLAYER_LOWEST_HERO_LIFE,
    TARGET_SCENARIO,
    TARGET_SIDE,
    TARGET_VILLAIN,
    TARGET_YOU,
    PLACE_SCENARIO_ZONE,
    TRAIT_BUSINESSMAN,
    TRAIT_CRIMINAL,
    TRAIT_GENIUS,
    TRAIT_GOBLIN,
    TRAIT_MERCENARY,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_MAIN_SCHEME_COMPLETED,
    TRIGGER_THIS_COUNTERS_REMOVED,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_SCHEMES,
} from 'mc-shared';

const countCounters = count => ({
    type: EFFECT_PLACE_COUNTERS,
    params: {
        target: TARGET_ENVIRONMENT,
        condition: {name: 'Empresa criminal'},
        counters: count,
    },
});

const removeCounters = count => ({
    type: EFFECT_REMOVE_COUNTER,
    params: {
        target: TARGET_ENVIRONMENT,
        condition: {name: 'Estado de locura'},
        count,
    },
});

const placeInfamyOrRemoveMadness = count => ({
    type: EFFECT_DO_IF,
    params: {
        condition: {
            'player.match.scenario.villain.name': 'Norman Osborn',
        },
        effect: countCounters(count),
        effectNot: removeCounters(count),
    },
});

const environmentCountersRemoved = {
    type: ABILITY_CONSTANT,
    params: {
        hideDialog: true,
        trigger: TRIGGER_THIS_COUNTERS_REMOVED,
        condition: {
            'effect.selectedTarget.counters': 0,
        },
        effect: {
            type: EFFECT_SIMULTANEOUS,
            params: {
                effects: [
                    {
                        type: EFFECT_FLIP,
                        params: {
                            target: TARGET_CARD,
                            formTarget: TARGET_SIDE,
                        },
                    },
                    {
                        type: EFFECT_FLIP,
                        params: {
                            target: TARGET_VILLAIN,
                            formTarget: TARGET_SIDE,
                        },
                    },
                ],
            },
        },
    },
};

const environmentSide = ({name, image}) => ({
    type: CARD_TYPE_ENVIRONMENT,
    params: {
        name,
        set: 'risky-business',
        image,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_CARD,
                            counters: 2,
                        },
                    },
                },
            },
            environmentCountersRemoved,
        ],
    },
});

const villainSide = ({
    name,
    image,
    stage,
    attack,
    scheme,
    unprintedStats = [],
    hitPoints,
    traits,
    abilities = [],
}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name,
        set: 'risky-business',
        image,
        traits,
        unique: true,
        stage,
        attack,
        scheme,
        unprintedStats,
        hitPoints: [hitPoints, true],
        abilities,
    },
});

const normanAttackInterrupt = counters => ({
    type: ABILITY_FORCED_INTERRUPT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS,
        effect: {
            type: EFFECT_REPLACE_EFFECT,
            params: {
                replacement: countCounters(counters),
            },
        },
    },
});

const normanDamageInterrupt = {
    type: ABILITY_FORCED_INTERRUPT,
    params: {
        trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
        triggerParams: {
            target: TARGET_CARD,
        },
        effect: {
            type: EFFECT_REPLACE_EFFECT,
            params: {
                replacement: {
                    type: EFFECT_REMOVE_COUNTER,
                    params: {
                        target: TARGET_ENVIRONMENT,
                        condition: {name: 'Empresa criminal'},
                        paramsCalc: {
                            target: 'triggeredTargetDamage',
                        },
                    },
                },
            },
        },
    },
};

const goblinSchemeInterrupt = counters => ({
    type: ABILITY_FORCED_INTERRUPT,
    params: {
        trigger: TRIGGER_VILLAIN_SCHEMES,
        effect: {
            type: EFFECT_REPLACE_EFFECT,
            params: {
                replacement: removeCounters(counters),
            },
        },
    },
});

const goblinRevealEffect = stage => {
    if (stage === 1 || stage === 2) {
        return {
            type: EFFECT_FOR_EACH,
            params: {
                target: TARGET_ALL_PLAYERS,
                ...(stage === 1 ? {condition: {isHero: true}} : {}),
                effect: {
                    type: EFFECT_ASSIGN_DAMAGE,
                    params: {
                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                        damage: stage === 1 ? 3 : 4,
                    },
                },
            },
        };
    }

    return {
        type: EFFECT_FOR_EACH,
        params: {
            target: TARGET_ALL_PLAYERS,
            effect: {
                type: EFFECT_TAKE_DAMAGE,
                params: {
                    target: TARGET_YOU,
                    damage: 4,
                },
            },
        },
    };
};

const villainCard = ({
    stage,
    normanImage,
    goblinImage,
    hitPoints,
    normanScheme,
    goblinAttack,
    infamyPerAttack,
    madnessPerScheme,
    goblinRevealDamage,
}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        sameCard: true,
        sides: [
            villainSide({
                name: 'Norman Osborn',
                image: normanImage,
                stage,
                attack: 0,
                unprintedStats: ['attack'],
                scheme: normanScheme,
                hitPoints,
                traits: [TRAIT_BUSINESSMAN, TRAIT_GENIUS],
                abilities: [
                    normanAttackInterrupt(infamyPerAttack),
                    normanDamageInterrupt,
                ],
            }),
            villainSide({
                name: 'Duende Verde',
                image: goblinImage,
                stage,
                attack: goblinAttack,
                scheme: 0,
                unprintedStats: ['scheme'],
                hitPoints,
                traits: [TRAIT_GOBLIN],
                abilities: [
                    {
                        type: ABILITY_WHEN_REVEALED,
                        params: {
                            effect: goblinRevealEffect(goblinRevealDamage),
                        },
                    },
                    goblinSchemeInterrupt(madnessPerScheme),
                ],
            }),
        ],
    },
});

const mainSchemeCard = ({
    name,
    stage,
    images,
    startingThreat,
    acceleration,
    value,
    icons,
    final = false,
    abilitiesA = [],
    abilitiesB = [],
}) => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name,
            set: 'risky-business',
            image: images.a,
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
            set: 'risky-business',
            image: images.b,
            stage,
            startingThreat,
            acceleration,
            value,
            ...(icons ? {icons} : {}),
            ...(final ? {final: true} : {}),
            ...(abilitiesB.length ? {abilities: abilitiesB} : {}),
        },
    },
];

const scenarioSetup = {
    type: ABILITY_SETUP,
    params: {
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_SEARCH_CARD_REVEAL,
                        params: {
                            condition: {name: 'Empresa criminal'},
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

const hostileTakeoverCompleted = {
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_MAIN_SCHEME_COMPLETED,
        effect: {
            type: EFFECT_CHAINED,
            params: {
                target: TARGET_BY_TITLE,
                title: 'Empresa criminal',
                locations: [PLACE_SCENARIO_ZONE],
                effects: [
                    {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_BY_TITLE,
                            title: 'Empresa criminal',
                            locations: [PLACE_SCENARIO_ZONE],
                            counters: 1,
                        },
                    },
                ],
                thenEffect: {
                    type: EFFECT_DISCARD_FROM_DECK,
                    params: {
                        target: TARGET_BY_TITLE,
                        title: 'Empresa criminal',
                        locations: [PLACE_SCENARIO_ZONE],
                        players: TARGET_ALL_PLAYERS,
                        paramsCalc: {
                            target: 'effect.selectedTarget.counters',
                        },
                    },
                },
            },
        },
    },
};

const hiredGun = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Pistolero a sueldo',
        set: 'risky-business',
        image: 'scenarios/risky-business/02007.png',
        traits: [TRAIT_CRIMINAL],
        attack: 2,
        scheme: 2,
        hitPoints: 3,
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
                                    type: EFFECT_STORE_BOOST,
                                    params: {
                                        target: TARGET_VILLAIN,
                                        title: 'Dale al Villano 1 carta de aumento boca abajo',
                                    },
                                },
                                {
                                    type: EFFECT_PLACE_COUNTERS,
                                    params: {
                                        target: TARGET_ENVIRONMENT,
                                        condition: {name: 'Empresa criminal'},
                                        counters: 2,
                                        title: 'Coloca 2 contadores de Infamia sobre Empresa criminal',
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
                effect: placeInfamyOrRemoveMadness(1),
            },
        },
    },
};

const securityGuard = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Guardia privado de seguridad',
        set: 'risky-business',
        image: 'scenarios/risky-business/02008.png',
        traits: [TRAIT_MERCENARY],
        attack: 1,
        scheme: 0,
        hitPoints: 4,
        boost: 1,
        keywords: {guard: true},
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: placeInfamyOrRemoveMadness(1),
            },
        },
    },
};

const unstableBridge = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Puente inestable',
        set: 'risky-business',
        image: 'scenarios/risky-business/02009.png',
        startingThreat: [2, true],
        boost: 0,
        icons: {crisis: true},
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: placeInfamyOrRemoveMadness(1),
            },
        },
    },
};

const oscorpIndustries = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Industrias Oscorp',
        set: 'risky-business',
        image: 'scenarios/risky-business/02010.png',
        startingThreat: [2, true],
        boost: 3,
        icons: {acceleration: 1},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    condition: {
                        'player.match.scenario.villain.name': 'Norman Osborn',
                    },
                    effect: {
                        type: EFFECT_PLACE_THREAT,
                        params: {
                            target: TARGET_CARD,
                            threat: [1, true],
                        },
                    },
                },
            },
        ],
    },
};

const payoff = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Soborno',
        set: 'risky-business',
        image: 'scenarios/risky-business/02011.png',
        startingThreat: [2, true],
        boost: 1,
        icons: {hazard: 1},
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: placeInfamyOrRemoveMadness(1),
            },
        },
    },
};

const allInADaysWork = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Rutina laboral',
        set: 'risky-business',
        image: 'scenarios/risky-business/02012.png',
        boost: 0,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: placeInfamyOrRemoveMadness(2),
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: placeInfamyOrRemoveMadness(1),
            },
        },
    },
};

const madGenius = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Genio loco',
        set: 'risky-business',
        image: 'scenarios/risky-business/02013.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    condition: {
                        'player.match.scenario.villain.name': 'Duende Verde',
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEVERAL_ATTACKS,
                                    params: {
                                        target: TARGET_YOU,
                                        attackTarget: TARGET_PLAYER_LOWEST_HERO_LIFE,
                                        enemiesType: TARGET_VILLAIN,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        target: TARGET_YOU,
                                        condition: {
                                            'effects.0.attacks.length': 0,
                                        },
                                        effect: {type: EFFECT_SURGE},
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    condition: {
                        'player.match.scenario.villain.name': 'Norman Osborn',
                    },
                    effect: {
                        type: EFFECT_DISCARD_FROM_DECK,
                        params: {
                            target: TARGET_ENVIRONMENT,
                            condition: {name: 'Empresa criminal'},
                            paramsCalc: {
                                target: 'effect.selectedTarget.counters',
                            },
                        },
                    },
                },
            },
        ],
    },
};

const criminalEnterprise = {
    type: CARD_TYPE_ENVIRONMENT,
    params: {
        name: 'Empresa criminal',
        set: 'risky-business',
        image: 'scenarios/risky-business/02006a.png',
        sides: [
            environmentSide({
                name: 'Empresa criminal',
                image: 'scenarios/risky-business/02006a.png',
            }),
            environmentSide({
                name: 'Estado de locura',
                image: 'scenarios/risky-business/02006b.png',
            }),
        ],
    },
};

export default {
    _id: 'risky-business',
    order: 3,
    name: 'Negocios arriesgados',
    folder: 'risky-business',
    config: {
        name: 'risky-business',
        villains: [
            villainCard({
                stage: 1,
                normanImage: 'scenarios/risky-business/02001a.png',
                goblinImage: 'scenarios/risky-business/02001b.png',
                hitPoints: 14,
                normanScheme: 2,
                goblinAttack: 3,
                infamyPerAttack: 1,
                madnessPerScheme: 1,
                goblinRevealDamage: 1,
            }),
            villainCard({
                stage: 2,
                normanImage: 'scenarios/risky-business/02002a.png',
                goblinImage: 'scenarios/risky-business/02002b.png',
                hitPoints: 18,
                normanScheme: 2,
                goblinAttack: 4,
                infamyPerAttack: 2,
                madnessPerScheme: 1,
                goblinRevealDamage: 2,
            }),
            villainCard({
                stage: 3,
                normanImage: 'scenarios/risky-business/02003a.png',
                goblinImage: 'scenarios/risky-business/02003b.png',
                hitPoints: 22,
                normanScheme: 3,
                goblinAttack: 4,
                infamyPerAttack: 3,
                madnessPerScheme: 2,
                goblinRevealDamage: 3,
            }),
        ],
        mainSchemes: [
            mainSchemeCard({
                name: 'OPA hostil',
                stage: 1,
                images: {
                    a: 'scenarios/risky-business/02004a.png',
                    b: 'scenarios/risky-business/02004b.png',
                },
                startingThreat: [2, true],
                acceleration: [1, true],
                value: [7, true],
                abilitiesA: [scenarioSetup],
                abilitiesB: [hostileTakeoverCompleted],
            }),
            mainSchemeCard({
                name: 'Adquisición corporativa',
                stage: 2,
                images: {
                    a: 'scenarios/risky-business/02005a.png',
                    b: 'scenarios/risky-business/02005b.png',
                },
                startingThreat: [1, true],
                acceleration: [2, true],
                value: [10, true],
                icons: {hazard: 1},
                final: true,
            }),
        ],
        sets: ['standard'],
        defaultSets: ['goblin-gimmicks'],
        cards: [
            {count: 1, card: criminalEnterprise},
            {count: 3, card: hiredGun},
            {count: 4, card: securityGuard},
            {count: 1, card: unstableBridge},
            {count: 2, card: oscorpIndustries},
            {count: 2, card: payoff},
            {count: 4, card: allInADaysWork},
            {count: 2, card: madGenius},
        ],
    },
};
