import {
    ABILITY_BOOST,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_SETUP,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_COMPLETED,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    ABILITY_CONSTANT,
    CALC_MULTIPLY_2,
    CALC_STAGE,
    CALC_TRAITS_COUNT,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CHARACTER_VILLAIN,
    DECK_POSITION_SHUFFLE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DEAL_BOOST,
    EFFECT_DELAYED,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_ENGAGE,
    EFFECT_FOR_EACH,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_PLACE_THREAT,
    EFFECT_MOVE_TO_DECK,
    EFFECT_PUT_PLAY,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    PLACE_ENCOUNTER_DECK_CARDS,
    RESOURCE_MENTAL,
    TARGET_ACTIVATION,
    TARGET_ALL_PLAYERS,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_ENGAGED,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_ELITE,
    TRAIT_CONDITION,
    TRAIT_GOBLIN,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_THIS_ATTACK,
    TRIGGER_VILLAIN_ACTIVATES,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';

import {
    goblinGlider,
    pumpkinBombs,
} from '../encounters/attachments.js';

const encounterCard = (type, {
    name,
    image,
    boost = 0,
    ...params
}) => ({
    type,
    params: {
        name,
        set: 'mutagen-formula',
        image: `scenarios/mutagen-formula/${image}.png`,
        boost,
        ...params,
    },
});

const placeMainSchemeThreat = threat => ({
    type: EFFECT_PLACE_THREAT,
    params: {
        target: TARGET_MAIN_SCHEME,
        threat,
    },
});

const goblinDamageResponse = threat => ({
    type: ABILITY_FORCED_RESPONSE,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
        condition: {
            'effect.activation.takenDamage': '>0',
        },
        effect: {
            type: EFFECT_DO_IF,
            params: {
                condition: {
                    'effect.attackedCharacters.*.isSuperhero': true,
                },
                effect: placeMainSchemeThreat(threat),
            },
        },
    },
});

const dealEncountersToEachPlayer = count => ({
    type: ABILITY_WHEN_REVEALED,
    params: {
        effect: {
            type: EFFECT_FOR_EACH,
            params: {
                target: TARGET_ALL_PLAYERS,
                effect: {
                    type: EFFECT_DEAL_ENCOUNTER,
                    params: {count},
                },
            },
        },
    },
});

const villainStage = ({
    stage,
    attack,
    scheme,
    hitPoints,
    threat,
    encounterCards,
}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Duende Verde',
        set: 'mutagen-formula',
        image: `scenarios/mutagen-formula/020${13 + stage}.png`,
        traits: [TRAIT_GOBLIN],
        unique: true,
        stage,
        attack,
        scheme,
        hitPoints: [hitPoints, true],
        abilities: [
            ...(encounterCards ? [dealEncountersToEachPlayer(encounterCards)] : []),
            goblinDamageResponse(threat),
        ],
    },
});

const returnBoostAfterActivation = {
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
};

const stageOneSetup = {
    type: ABILITY_SETUP,
    params: {
        effect: {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_CHAINED,
                                params: {
                                    effects: [
                                        {
                                            type: EFFECT_SEARCH_CARDS,
                                            params: {
                                                locations: [PLACE_ENCOUNTER_DECK_CARDS],
                                                filter: {
                                                    isMinion: true,
                                                    name: 'Esclavo duende',
                                                },
                                                firstMatch: true,
                                                requireMatch: true,
                                            },
                                        },
                                        {
                                            type: EFFECT_ENGAGE,
                                            params: {
                                                target: TARGET_YOU,
                                                cardSource: 'selectedCards',
                                            },
                                        },
                                    ],
                                },
                            },
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

const firstSchemeCompleted = {
    type: ABILITY_WHEN_COMPLETED,
    params: {
        effect: {
            type: EFFECT_FOR_EACH,
            params: {
                target: TARGET_SOURCE,
                source: 'match.orderedPlayers',
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {
                            'player.minions.*.traits': TRAIT_GOBLIN,
                        },
                        effectNot: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_DISCARD_FROM_DECK,
                                        params: {
                                            target: TARGET_ENCOUNTER_DECK,
                                            count: 3,
                                        },
                                    },
                                    {
                                        type: EFFECT_ENGAGE,
                                        params: {
                                            target: TARGET_YOU,
                                            cardSource: 'effects.0.cards',
                                            cardCondition: {
                                                isMinion: true,
                                                traits: TRAIT_GOBLIN,
                                            },
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
};

const goblinCountAcceleration = {
    target: 'match.enemies',
    formula: CALC_TRAITS_COUNT,
    trait: TRAIT_GOBLIN,
};

const mainSchemeCard = ({
    name,
    stage,
    images,
    startingThreat,
    acceleration,
    value,
    accelerationCalc,
    final = false,
    abilitiesA = [],
    abilitiesB = [],
    content,
}) => [
    {
        type: CARD_TYPE_MAIN_SCHEME_A_CARD,
        params: {
            name,
            set: 'mutagen-formula',
            image: `scenarios/mutagen-formula/${images.a}.png`,
            stage,
            ...(content ? {content} : {}),
            ...(abilitiesA.length ? {abilities: abilitiesA} : {}),
        },
    },
    {
        type: CARD_TYPE_MAIN_SCHEME_B_CARD,
        params: {
            name,
            set: 'mutagen-formula',
            image: `scenarios/mutagen-formula/${images.b}.png`,
            stage,
            startingThreat,
            acceleration,
            value,
            ...(accelerationCalc ? {accelerationCalc} : {}),
            ...(final ? {final: true} : {}),
            ...(abilitiesB.length ? {abilities: abilitiesB} : {}),
        },
    },
];

const hysteriaDiscard = {
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
};

const hysteria = encounterCard(CARD_TYPE_ATTACHMENT, {
    name: 'Histeria',
    image: '02020',
    traits: [TRAIT_CONDITION],
    boost: 1,
    attach: TARGET_VILLAIN,
    abilities: [
        {
            type: ABILITY_FORCED_INTERRUPT,
            params: {
                trigger: TRIGGER_VILLAIN_ACTIVATES,
                effect: {
                    type: EFFECT_DEAL_BOOST,
                    params: {},
                },
            },
        },
        {
            type: ABILITY_HERO_ACTION,
            params: {
                arrow: {
                    type: EFFECT_SPEND,
                    params: {
                        resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
                    },
                },
                effect: hysteriaDiscard,
            },
        },
    ],
});

const goblinKnight = encounterCard(CARD_TYPE_MINION, {
    name: 'Caballero Duende',
    image: '02022',
    unique: true,
    traits: [TRAIT_ELITE, TRAIT_GOBLIN],
    attack: 2,
    scheme: 2,
    hitPoints: 7,
    boost: 2,
    abilities: [
        {
            type: ABILITY_FORCED_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_ATTACK,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_DISCARD_FROM_DECK,
                                params: {
                                    target: TARGET_ENCOUNTER_DECK,
                                    count: 1,
                                },
                            },
                            {
                                type: EFFECT_ENGAGE,
                                params: {
                                    target: TARGET_YOU,
                                    cardSource: 'effects.0.cards',
                                    cardCondition: {
                                        isMinion: true,
                                        traits: TRAIT_GOBLIN,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
    ],
    boostAbility: returnBoostAfterActivation,
});

const goblinSoldier = encounterCard(CARD_TYPE_MINION, {
    name: 'Soldado duende',
    image: '02023',
    traits: [TRAIT_GOBLIN],
    attack: 1,
    scheme: 1,
    hitPoints: 5,
    boostAbility: {
        type: ABILITY_BOOST,
        params: {
            effect: {
                type: EFFECT_ENGAGE,
                params: {
                    target: TARGET_YOU,
                },
            },
        },
    },
    abilities: [
        {
            type: ABILITY_WHEN_DEFEATED,
            params: {
                effect: {
                    type: EFFECT_TAKE_DAMAGE,
                    params: {
                        target: TARGET_ENGAGED,
                        damage: 1,
                    },
                },
            },
        },
    ],
});

const goblinThrall = encounterCard(CARD_TYPE_MINION, {
    name: 'Esclavo duende',
    image: '02024',
    traits: [TRAIT_GOBLIN],
    attack: 1,
    scheme: 1,
    hitPoints: 3,
    boostAbility: {
        type: ABILITY_BOOST,
        params: {
            effect: {
                type: EFFECT_ENGAGE,
                params: {
                    target: TARGET_YOU,
                },
            },
        },
    },
    keywords: {guard: true},
});

const monster = encounterCard(CARD_TYPE_MINION, {
    name: 'Monstruo',
    image: '02025',
    unique: true,
    traits: [TRAIT_ELITE, TRAIT_GOBLIN],
    attack: 3,
    scheme: 1,
    hitPoints: 6,
    boost: 2,
    abilities: [
        {
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        condition: {'player.isStunned': true},
                        effect: {
                            type: EFFECT_TAKE_DAMAGE,
                            params: {
                                target: TARGET_YOU,
                                damage: 2,
                            },
                        },
                        effectNot: {
                            type: EFFECT_STUN,
                            params: {
                                target: TARGET_YOU,
                            },
                        },
                    },
                },
            },
        },
    ],
    boostAbility: returnBoostAfterActivation,
});

const goblinReinforcements = encounterCard(CARD_TYPE_SIDE_SCHEME_SCENARIO, {
    name: 'Duendes de refuerzo',
    image: '02026',
    startingThreat: 2,
    boost: 2,
    abilities: [
        {
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_PLACE_THREAT,
                    params: {
                        target: TARGET_THIS,
                        paramsCalc: {
                            target: 'player.match.minions',
                            formula: CALC_TRAITS_COUNT,
                            trait: TRAIT_GOBLIN,
                        },
                    },
                },
            },
        },
    ],
});

const goblinNation = encounterCard(CARD_TYPE_SIDE_SCHEME_SCENARIO, {
    name: 'Nación duende',
    image: '02027',
    startingThreat: [2, true],
    abilities: [
        {
            type: ABILITY_CONSTANT,
            params: {
                trigger: TRIGGER_CHARACTER_GET_ATTACK,
                condition: {
                    'effect.selectedTarget.isEnemy': true,
                    'effect.selectedTarget.traits': TRAIT_GOBLIN,
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
    ],
    boostAbility: {
        type: ABILITY_BOOST,
        params: {
            effect: {
                type: EFFECT_PUT_PLAY,
                params: {
                    target: TARGET_SCENARIO,
                    controller: 'player.match.scenario',
                    cardSource: 'card',
                },
            },
        },
    },
});

const unstoppableHorde = encounterCard(CARD_TYPE_SIDE_SCHEME_SCENARIO, {
    name: 'Horda imparable',
    image: '02028',
    startingThreat: [1, true],
    boost: 1,
    abilities: [
        {
            type: ABILITY_WHEN_DEFEATED,
            params: {
                effect: {
                    type: EFFECT_FOR_EACH,
                    params: {
                        target: TARGET_SOURCE,
                        source: 'match.orderedPlayers',
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_DISCARD_FROM_DECK,
                                        params: {
                                            target: TARGET_ENCOUNTER_DECK,
                                            count: 2,
                                        },
                                    },
                                    {
                                        type: EFFECT_FOR_EACH,
                                        params: {
                                            target: TARGET_SOURCE,
                                            source: 'effects.0.cards',
                                            condition: {
                                                isMinion: true,
                                                traits: TRAIT_GOBLIN,
                                            },
                                            effect: {
                                                type: EFFECT_ENGAGE,
                                                params: {
                                                    target: TARGET_YOU,
                                                    cardSource: 'forEachTarget',
                                                },
                                            },
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
});

const deathFromAbove = encounterCard(CARD_TYPE_TREACHERY, {
    name: 'Muerte desde el cielo',
    image: '02029',
    boost: 1,
    abilities: [
        {
            type: ABILITY_WHEN_REVEALED_ALTEREGO,
            params: {
                effect: {
                    type: EFFECT_ENEMY_SCHEME,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        schemeModifierCalc: {
                            formula: CALC_STAGE,
                            target: TARGET_VILLAIN,
                        },
                    },
                },
            },
        },
        {
            type: ABILITY_WHEN_REVEALED_HERO,
            params: {
                effect: {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_YOU,
                        attackModifierCalc: {
                            formula: CALC_STAGE,
                            target: TARGET_VILLAIN,
                        },
                    },
                },
            },
        },
    ],
});

const seeYou = encounterCard(CARD_TYPE_TREACHERY, {
    name: 'Te veo',
    image: '02030',
    boost: 1,
    abilities: [
        {
            type: ABILITY_WHEN_REVEALED_HERO,
            params: {
                effect: {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_YOU,
                    },
                },
            },
        },
        {
            type: ABILITY_WHEN_REVEALED_ALTEREGO,
            params: {
                effect: {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_YOU,
                        giveBoost: false,
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
                        'player.minions.*.traits': TRAIT_GOBLIN,
                    },
                    effect: {
                        type: EFFECT_MODIFY_BOOST_ICONS,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
        },
    },
});

const overconfidence = encounterCard(CARD_TYPE_TREACHERY, {
    name: 'Exceso de confianza',
    image: '02031',
    boost: 1,
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
                                },
                            },
                            {
                                type: EFFECT_DO_IF,
                                params: {
                                    condition: {'effects.0.threatPlaced': '>2'},
                                    effect: {
                                        type: EFFECT_SURGE,
                                        params: {},
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
                                type: EFFECT_DO_IF,
                                params: {
                                    condition: {
                                        'effects.0.activation.takenDamage': '>2',
                                    },
                                    effect: {
                                        type: EFFECT_SURGE,
                                        params: {},
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
    ],
});

const cruelAmbition = encounterCard(CARD_TYPE_TREACHERY, {
    name: 'Ambición cruel',
    image: '02032',
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
                                type: EFFECT_DISCARD_FROM_DECK,
                                params: {
                                    target: TARGET_ENCOUNTER_DECK,
                                    paramsCalc: {
                                        target: 'effect.match.villain.stage',
                                        formula: CALC_MULTIPLY_2,
                                    },
                                },
                            },
                            {
                                type: EFFECT_FOR_EACH,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'effects.0.cards',
                                    condition: {
                                        isMinion: true,
                                        traits: TRAIT_GOBLIN,
                                    },
                                    effect: {
                                        type: EFFECT_CHOOSE,
                                        params: {
                                            options: [
                                                {
                                                    type: EFFECT_TAKE_DAMAGE,
                                                    params: {
                                                        title: 'Sufre 3 de Daño',
                                                        target: TARGET_YOU,
                                                        damage: 3,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_ENGAGE,
                                                    params: {
                                                        title: 'Pon en juego enfrentado a ti ese Esbirro',
                                                        target: TARGET_YOU,
                                                        cardSource: 'forEachTarget',
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
});

export default {
    _id: 'mutagen-formula',
    order: 4,
    name: 'La fórmula mutagénica',
    folder: 'mutagen-formula',
    config: {
        name: 'mutagen-formula',
        villains: [
            villainStage({
                stage: 1,
                attack: 2,
                scheme: 1,
                hitPoints: 16,
                threat: 1,
            }),
            villainStage({
                stage: 2,
                attack: 2,
                scheme: 2,
                hitPoints: 18,
                threat: 1,
                encounterCards: 2,
            }),
            villainStage({
                stage: 3,
                attack: 3,
                scheme: 2,
                hitPoints: 20,
                threat: 2,
                encounterCards: 3,
            }),
        ],
        mainSchemes: [
            mainSchemeCard({
                name: 'Liberar el mutágeno',
                stage: 1,
                images: {a: '02017a', b: '02017b'},
                startingThreat: [2, true],
                acceleration: [1, true],
                value: [7, true],
                abilitiesA: [stageOneSetup],
                abilitiesB: [firstSchemeCompleted],
                content: {
                    villains: [1, 2],
                    villainsExpert: [2, 3],
                },
            }),
            mainSchemeCard({
                name: 'Nube de mutágeno',
                stage: 2,
                images: {a: '02018a', b: '02018b'},
                startingThreat: [4, true],
                acceleration: 0,
                accelerationCalc: goblinCountAcceleration,
                value: [11, true],
                final: true,
            }),
        ],
        sets: ['standard'],
        defaultSets: ['goblin-gimmicks'],
        cards: [
            {count: 1, card: goblinGlider},
            {count: 1, card: hysteria},
            {count: 1, card: pumpkinBombs},
            {count: 1, card: goblinKnight},
            {count: 4, card: goblinSoldier},
            {count: 6, card: goblinThrall},
            {count: 1, card: monster},
            {count: 2, card: goblinReinforcements},
            {count: 1, card: goblinNation},
            {count: 2, card: unstoppableHorde},
            {count: 2, card: deathFromAbove},
            {count: 1, card: seeYou},
            {count: 1, card: overconfidence},
            {count: 2, card: cruelAmbition},
        ],
    },
};
