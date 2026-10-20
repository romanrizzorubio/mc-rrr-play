import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_BOOST_ICONS,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FACEDOWN,
    EFFECT_FOR_EACH,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_RANDOM_CARD,
    EFFECT_REMOVE_CARD,
    EFFECT_REPLACE_EFFECT,
    EFFECT_REMOVE_THREAT,
    EFFECT_RETURN_FACEDOWN,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SIMULTANEOUS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TOUGH,
    PLACE_ENCOUNTER_DECK_CARDS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_CARDS,
    TARGET_ATTACHED,
    TARGET_ENEMY,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_YOU,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ARMOR,
    TRAIT_CAPTIVE,
    TRAIT_HEROFORHIRE,
    TRAIT_HYDRA,
    TRAIT_MERCENARY,
    TRAIT_ATTACK,
    TRAIT_THWART,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';

const SET = 'taskmaster';

const discardThis = {
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
};

const supervisorHeroAction = () => ({
    type: ABILITY_HERO_ACTION,
    params: {
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
                            resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
                        },
                    },
                ],
            },
        },
        effect: discardThis,
    },
});

const villainAttackGainsKeyword = keyword => ({
    type: ABILITY_CONSTANT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS,
        effect: {
            type: EFFECT_MODIFY_ATTACK,
            params: {
                target: TARGET_EFFECT,
                modify: {
                    keywords: {
                        [keyword]: true,
                    },
                },
            },
        },
    },
});

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

const supervisorSword = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Espada del Supervisor',
        set: SET,
        image: 'scenarios/taskmaster/04102.png',
        traits: [TRAIT_WEAPON],
        unique: true,
        attack: 1,
        boost: 3,
        attach: TARGET_VILLAIN,
        abilities: [
            villainAttackGainsKeyword('piercing'),
            supervisorHeroAction(),
        ],
    },
};

const supervisorShield = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Escudo del Supervisor',
        set: SET,
        image: 'scenarios/taskmaster/04103.png',
        traits: [TRAIT_ARMOR, TRAIT_WEAPON],
        unique: true,
        boost: 3,
        attach: TARGET_VILLAIN,
        keywords: {
            retaliate: 1,
        },
        abilities: [supervisorHeroAction()],
    },
};

const photographicReflexes = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Reflejos fotográficos',
        set: SET,
        image: 'scenarios/taskmaster/04104.png',
        boost: 2,
        attach: TARGET_VILLAIN,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_ATTACHED,
                    },
                    condition: {
                        'effect.isAttack': true,
                    },
                    effect: {
                        type: EFFECT_REPLACE_EFFECT,
                        params: {
                            replacement: {
                                type: EFFECT_TAKE_DAMAGE,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    damage: 0,
                                    paramsCalc: {
                                        target: 'triggeredTargetDamage',
                                    },
                                    thenEffect: discardThis,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const imitationAbility = ({abilityType, trait, effect}) => ({
    type: abilityType,
    params: {
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_DISCARD_FROM_DECK,
                        params: {
                            target: TARGET_YOU,
                            count: 5,
                        },
                    },
                    {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'effects.0.cards.*.traits': trait,
                            },
                            effect,
                        },
                    },
                ],
            },
        },
    },
});

const imitation = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Imitación',
        set: SET,
        image: 'scenarios/taskmaster/04105.png',
        boost: 1,
        abilities: [
            imitationAbility({
                abilityType: ABILITY_WHEN_REVEALED_ALTEREGO,
                trait: TRAIT_THWART,
                effect: {
                    type: EFFECT_ENEMY_SCHEME,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_MAIN_SCHEME,
                    },
                },
            }),
            imitationAbility({
                abilityType: ABILITY_WHEN_REVEALED_HERO,
                trait: TRAIT_ATTACK,
                effect: {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_YOU,
                    },
                },
            }),
        ],
    },
};

const pursuedByHydra = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Perseguidos por Hydra',
        set: SET,
        image: 'scenarios/taskmaster/04106.png',
        boost: 1,
        keywords: {incite: 1},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            condition: {isHero: true},
                            effect: {
                                type: EFFECT_SIMULTANEOUS,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_TAKE_DAMAGE,
                                            params: {
                                                target: TARGET_YOU,
                                                damage: 1,
                                            },
                                        },
                                        {
                                            type: EFFECT_DISCARD_RANDOM,
                                            params: {
                                                target: TARGET_YOU,
                                                count: 1,
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

const capturedByHydra = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Capturado por Hydra',
        set: SET,
        image: 'scenarios/taskmaster/04107.png',
        startingThreat: 5,
        boost: 2,
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
                                    type: EFFECT_RANDOM_CARD,
                                    params: {
                                        target: TARGET_SOURCE,
                                        source: 'card.owner.apart',
                                        condition: {
                                            isAlly: true,
                                            traits: TRAIT_CAPTIVE,
                                        },
                                        multipleTarget: true,
                                        removeFromSource: true,
                                        showDialog: false,
                                    },
                                },
                                {
                                    type: EFFECT_FACEDOWN,
                                    params: {
                                        target: TARGET_THIS,
                                        cardsTarget: TARGET_SOURCE,
                                        source: 'effects.0.cards',
                                    },
                                },
                                {
                                    type: EFFECT_LASTING,
                                    params: {
                                        target: TARGET_THIS,
                                        until: TRIGGER_THIS_DEFEAT,
                                        useTriggerPlayer: true,
                                        endEffect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                target: TARGET_THIS,
                                                effects: [
                                                    {
                                                        type: EFFECT_RETURN_FACEDOWN,
                                                        params: {
                                                            target: TARGET_THIS,
                                                            faceDownTarget: TARGET_ALL_CARDS,
                                                            destination: {
                                                                target: TARGET_YOU,
                                                            },
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
                    },
                },
            },
        ],
    },
};

const trainingCamp = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Campamento de instrucción del Supervisor',
        set: SET,
        image: 'scenarios/taskmaster/04108.png',
        startingThreat: [2, true],
        icons: {hazard: 1},
        boost: 3,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    triggerParams: {
                        cardCondition: {
                            isMinion: true,
                        },
                    },
                    effect: {
                        type: EFFECT_TOUGH,
                        params: {
                            target: TARGET_TRIGGERED_CARD,
                        },
                    },
                },
            },
        ],
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
        cards: [
            {count: 2, card: hydraHunter},
            {count: 1, card: supervisorSword},
            {count: 1, card: supervisorShield},
            {count: 2, card: photographicReflexes},
            {count: 2, card: imitation},
            {count: 2, card: pursuedByHydra},
            {count: 4, card: capturedByHydra},
            {count: 1, card: trainingCamp},
        ],
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
