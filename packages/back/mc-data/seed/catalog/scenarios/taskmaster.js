import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    CALC_BOOST_ICONS,
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_FOR_EACH,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    PLACE_ENCOUNTER_DECK_CARDS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_PLAYERS,
    TARGET_ENEMY,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_SCENARIO,
    TARGET_YOU,
    TRAIT_CAPTIVE,
    TRAIT_HEROFORHIRE,
    TRAIT_HYDRA,
    TRAIT_MERCENARY,
    TRIGGER_THIS_ATTACK,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';

const SET = 'taskmaster';

const hirelingResponse = (name, resource, effect) => ({
    type: ABILITY_RESPONSE,
    params: {
        trigger: TRIGGER_YOU_END_PLAY_CARD,
        condition: {'effect.card.name': name},
        arrow: {
            type: EFFECT_SPEND,
            params: {
                resources: [resource],
            },
        },
        effect,
    },
});

const setAsideHireling = ({
    name,
    subtitle,
    image,
    attack,
    thwart,
    resource,
    effect,
}) => ({
    count: 1,
    card: {
        type: CARD_TYPE_ALLY,
        params: {
            name,
            ...(subtitle ? {subtitle} : {}),
            set: SET,
            image: `scenarios/taskmaster/${image}.png`,
            traits: [TRAIT_CAPTIVE, TRAIT_HEROFORHIRE],
            unique: true,
            cost: 0,
            resources: [RESOURCE_WILD],
            attack,
            attackConsequential: 1,
            thwart,
            thwartConsequential: 1,
            hitPoints: 3,
            abilities: [
                hirelingResponse(name, resource, effect),
            ],
        },
    },
});

const identityFlipResponse = () => ({
    type: ABILITY_FORCED_RESPONSE,
    params: {
        condition: {'triggeredCard.isHero': true},
        trigger: TRIGGER_SUPERHERO_FLIPS,
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_DISCARD_FROM_DECK,
                        params: {
                            count: 1,
                            target: TARGET_ENCOUNTER_DECK,
                        },
                    },
                    {
                        type: EFFECT_TAKE_DAMAGE,
                        params: {
                            damage: 0,
                            paramsCalc: {
                                formula: CALC_BOOST_ICONS,
                                target: 'effects.0.cards',
                            },
                            target: TARGET_YOU,
                        },
                    },
                ],
            },
        },
    },
});

const dealEncounterCardToEachPlayer = () => ({
    type: ABILITY_WHEN_REVEALED,
    params: {
        effect: {
            type: EFFECT_FOR_EACH,
            params: {
                effect: {
                    type: EFFECT_DEAL_ENCOUNTER,
                    params: {
                        count: 1,
                        target: TARGET_ALL_PLAYERS,
                    },
                },
                target: TARGET_ALL_PLAYERS,
            },
        },
    },
});

const villain = ({attack, hitPoints, image, scheme, stage}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Supervisor',
        set: SET,
        image: `scenarios/taskmaster/${image}.png`,
        traits: [TRAIT_HYDRA, TRAIT_MERCENARY],
        unique: true,
        boost: 0,
        stage,
        attack,
        scheme,
        hitPoints: [hitPoints, true],
        abilities: [
            identityFlipResponse(),
            ...(stage > 1 ? [dealEncounterCardToEachPlayer()] : []),
        ],
    },
});

const hydraHunter = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Cazador de Hydra',
        set: SET,
        image: 'scenarios/taskmaster/04101.png',
        traits: [TRAIT_HYDRA],
        attack: 2,
        scheme: 2,
        hitPoints: 3,
        boost: 0,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_ATTACK,
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
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {'player.isHero': true},
                        effect: {
                            type: EFFECT_TAKE_DAMAGE,
                            params: {
                                target: TARGET_YOU,
                                damage: 1,
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
            },
        },
    },
};

const mainSchemeSetup = () => ({
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
                                name: 'Patrulla de Hydra',
                                type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                            },
                            places: [PLACE_ENCOUNTER_DECK_CARDS],
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
});

const heroPhaseStepResponse = () => ({
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_VILLAIN_PHASE_STEP,
        condition: {step: 1},
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            condition: {isHero: true},
                            effect: {
                                type: EFFECT_CHOOSE,
                                params: {
                                    options: [
                                        {
                                            type: EFFECT_PLACE_THREAT,
                                            params: {
                                                target: TARGET_MAIN_SCHEME,
                                                threat: 1,
                                                title: 'Coloca 1 de amenaza en este Plan principal',
                                            },
                                        },
                                        {
                                            type: EFFECT_TAKE_DAMAGE,
                                            params: {
                                                target: TARGET_YOU,
                                                damage: 1,
                                                title: 'Sufre 1 de daño',
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
});

const mainScheme = () => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name: 'A la caza del héroe',
            set: SET,
            image: 'scenarios/taskmaster/04096a.png',
            stage: 1,
            content: {
                villains: [1, 2],
                villainsExpert: [2, 3],
            },
            abilities: [mainSchemeSetup()],
        },
    },
    {
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        params: {
            name: 'A la caza del héroe',
            set: SET,
            image: 'scenarios/taskmaster/04096b.png',
            stage: 1,
            startingThreat: [1, true],
            acceleration: [1, true],
            value: [12, true],
            final: true,
            abilities: [heroPhaseStepResponse()],
        },
    },
];

export default {
    _id: 'taskmaster',
    name: 'Supervisor',
    folder: 'taskmaster',
    config: {
        name: 'taskmaster',
        villains: [
            villain({
                attack: 2,
                hitPoints: 13,
                image: '04093',
                scheme: 1,
                stage: 1,
            }),
            villain({
                attack: 2,
                hitPoints: 16,
                image: '04094',
                scheme: 2,
                stage: 2,
            }),
            villain({
                attack: 3,
                hitPoints: 17,
                image: '04095',
                scheme: 3,
                stage: 3,
            }),
        ],
        mainSchemes: [mainScheme()],
        sets: ['standard', 'hydra-patrol'],
        defaultSets: ['weapon-master'],
        cards: [{count: 2, card: hydraHunter}],
        setAsideCards: [
            setAsideHireling({
                name: 'Caballero Luna',
                subtitle: 'Marc Spector',
                image: '04097',
                attack: 2,
                thwart: 2,
                resource: RESOURCE_WILD,
                effect: {
                    type: EFFECT_DRAW_CARD,
                    params: {
                        target: TARGET_YOU,
                        count: 2,
                    },
                },
            }),
            setAsideHireling({
                name: 'Shang-Chi',
                image: '04098',
                attack: 2,
                thwart: 2,
                resource: RESOURCE_ENERGY,
                effect: {
                    type: EFFECT_STUN,
                    params: {
                        target: TARGET_ENEMY,
                    },
                },
            }),
            setAsideHireling({
                name: 'Tigre Blanco',
                subtitle: 'Angela Del Toro',
                image: '04099',
                attack: 1,
                thwart: 3,
                resource: RESOURCE_MENTAL,
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        threat: 3,
                    },
                },
            }),
            setAsideHireling({
                name: 'Elektra',
                image: '04100',
                attack: 3,
                thwart: 1,
                resource: RESOURCE_PHYSICAL,
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        damage: 3,
                    },
                },
            }),
        ],
    },
};
