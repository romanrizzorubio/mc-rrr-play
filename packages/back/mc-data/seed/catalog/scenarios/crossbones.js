import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_SETUP,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_ATTACK,
    CALC_BOOST_ICONS,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    EFFECT_ACTIVATE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_CREATE_EXTRA_DECK,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_HEAL,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_DAMAGE,
    EFFECT_PLACE_THREAT,
    EFFECT_REPLACE_EFFECT,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SURGE,
    EFFECT_TOUGH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_SCENARIO_EXTRA_DECK,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_VILLAIN,
    TRAIT_ARMOR,
    TRAIT_HYDRA,
    TRAIT_MERCENARY,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';

import {hydraTerrorist} from '../encounters/minions.js';
import {revealEncounterFrom} from '../utils/reveal-encounter.js';
import {withCardSet} from '../with-card-set.js';

const SET = 'crossbones';
const EXPERIMENTAL_WEAPONS_DECK = 'experimental-weapons';

const chain = effects => ({
    type: EFFECT_CHAINED,
    params: {effects},
});

const revealExperimentalWeapon = () => revealEncounterFrom({
    from: PLACE_SCENARIO_EXTRA_DECK,
    deckId: EXPERIMENTAL_WEAPONS_DECK,
});

const createExperimentalWeaponsDeck = {
    type: ABILITY_SETUP,
    params: {
        effect: {
            type: EFFECT_CREATE_EXTRA_DECK,
            params: {
                deckId: EXPERIMENTAL_WEAPONS_DECK,
            },
        },
    },
};

const crossbonesPiercing = () => ({
    type: ABILITY_CONSTANT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS,
        condition: {
            'match.villain.attached.*.traits': TRAIT_WEAPON,
        },
        effect: {
            type: EFFECT_MODIFY_ATTACK,
            params: {
                target: TARGET_EFFECT,
                modify: {
                    keywords: {
                        piercing: true,
                    },
                },
            },
        },
    },
});

const villain = ({stage, attack, scheme, hitPoints, image, abilities = []}) => ({
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Calavera',
        set: SET,
        image: `scenarios/crossbones/${image}.png`,
        traits: [TRAIT_HYDRA, TRAIT_MERCENARY],
        unique: true,
        stage,
        attack,
        scheme,
        hitPoints: [hitPoints, true],
        abilities: [
            crossbonesPiercing(),
            ...abilities,
        ],
    },
});

const revealAndSearchMachinegun = {
    type: ABILITY_WHEN_REVEALED,
    params: {
        effect: chain([
            {
                type: EFFECT_SEARCH_CARD_REVEAL,
                params: {
                    condition: {name: 'Ametralladora de Calavera'},
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
        ]),
    },
};

const weaponAttachment = ({name, image, boost, traits, attack, scheme, keywords, abilities}) => ({
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name,
        set: SET,
        image: `scenarios/crossbones/${image}.png`,
        traits,
        boost,
        ...(attack !== undefined ? {attack} : {}),
        ...(scheme !== undefined ? {scheme} : {}),
        ...(keywords ? {keywords} : {}),
        attach: TARGET_VILLAIN,
        abilities,
    },
});

const machinegun = weaponAttachment({
    name: 'Ametralladora de Calavera',
    image: '04064',
    boost: 3,
    traits: [TRAIT_WEAPON],
    keywords: {uses: [2, true]},
    abilities: [
        {
            type: ABILITY_FORCED_INTERRUPT,
            params: {
                trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
                effect: chain([
                    {
                        type: EFFECT_REMOVE_COUNTER,
                        params: {
                            target: TARGET_THIS,
                            count: 1,
                        },
                    },
                    {
                        type: EFFECT_DISCARD_FROM_DECK,
                        params: {
                            target: TARGET_ENCOUNTER_DECK,
                            count: 1,
                        },
                    },
                    {
                        type: EFFECT_ASSIGN_DAMAGE,
                        params: {
                            target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                            damage: 0,
                            paramsCalc: {
                                target: 'effects.1.cards',
                                formula: CALC_BOOST_ICONS,
                            },
                        },
                    },
                ]),
            },
        },
    ],
});

const armor = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Armadura de Calavera',
        set: SET,
        image: 'scenarios/crossbones/04065.png',
        traits: [TRAIT_ARMOR],
        attack: 1,
        scheme: 1,
        boost: 3,
        attach: TARGET_VILLAIN,
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_VILLAIN,
                    },
                    effect: {
                        type: EFFECT_REPLACE_EFFECT,
                        params: {
                            replacement: chain([
                                {
                                    type: EFFECT_PLACE_DAMAGE,
                                    params: {
                                        target: TARGET_THIS,
                                        damage: 0,
                                        paramsCalc: {
                                            target: 'triggeredTargetDamage',
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.selectedTarget.damage': '>4',
                                        },
                                        effect: {
                                            type: EFFECT_DISCARD_GAME,
                                            params: {
                                                target: TARGET_THIS,
                                            },
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

const automaticFire = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Fuego automático',
        set: SET,
        image: 'scenarios/crossbones/04067.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {type: EFFECT_SURGE},
                },
            },
            {
                type: ABILITY_WHEN_REVEALED_HERO,
                params: {
                    effect: chain([
                        {
                            type: EFFECT_DISCARD_FROM_DECK,
                            params: {
                                target: TARGET_ENCOUNTER_DECK,
                                count: 0,
                                paramsCalc: {
                                    target: 'match.scenario.villain',
                                    formula: CALC_ATTACK,
                                },
                            },
                        },
                        {
                            type: EFFECT_ASSIGN_DAMAGE,
                            params: {
                                target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                damage: 0,
                                paramsCalc: {
                                    target: 'effects.0.cards',
                                    formula: CALC_BOOST_ICONS,
                                },
                            },
                        },
                    ]),
                },
            },
        ],
    },
};

const toughOrHeal = () => ({
    type: EFFECT_DO_IF,
    params: {
        condition: {
            'effect.match.villain.isTough': true,
        },
        effect: {
            type: EFFECT_HEAL,
            params: {
                target: TARGET_VILLAIN,
                damage: 3,
            },
        },
        effectNot: {
            type: EFFECT_TOUGH,
            params: {
                target: TARGET_VILLAIN,
            },
        },
    },
});

const toughToCrack = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Duro de pelar',
        set: SET,
        image: 'scenarios/crossbones/04068.png',
        boost: 0,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: toughOrHeal(),
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: toughOrHeal(),
            },
        },
    },
};

const lootTheArsenal = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Saquear el arsenal',
        set: SET,
        image: 'scenarios/crossbones/04069.png',
        boost: 1,
        keywords: {incite: 1},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: chain([
                        {
                            type: EFFECT_DISCARD_UNTIL,
                            params: {
                                target: TARGET_ENCOUNTER_DECK,
                                condition: {
                                    traits: TRAIT_WEAPON,
                                },
                            },
                        },
                        revealEncounterFrom({
                            from: PLACE_ENCOUNTER_DISCARD,
                            cardSource: 'selectedCard',
                        }),
                    ]),
                },
            },
        ],
    },
};

const villainActivationAfterDefeat = {
    type: ABILITY_WHEN_DEFEATED,
    params: {
        effect: {
            type: EFFECT_ACTIVATE,
            params: {
                target: TARGET_VILLAIN,
            },
        },
    },
};

const crossbonesAttack = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'El ataque de Calavera',
        set: SET,
        image: 'scenarios/crossbones/04070.png',
        startingThreat: 2,
        icons: {acceleration: 1},
        boost: 2,
        abilities: [villainActivationAfterDefeat],
    },
};

const corneredStaff = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Personal acorralado',
        set: SET,
        image: 'scenarios/crossbones/04071.png',
        startingThreat: 3,
        icons: {crisis: true},
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: chain([
                        {
                            type: EFFECT_DISCARD_FROM_DECK,
                            params: {
                                target: TARGET_ENCOUNTER_DECK,
                                count: [1, true],
                            },
                        },
                        {
                            type: EFFECT_PLACE_THREAT,
                            params: {
                                target: TARGET_THIS,
                                threat: 0,
                                paramsCalc: {
                                    target: 'effects.0.cards',
                                    formula: CALC_BOOST_ICONS,
                                },
                            },
                        },
                    ]),
                },
            },
        ],
    },
};

const experimentalWeaponsRevealed = {
    type: ABILITY_WHEN_REVEALED,
    params: {
        effect: revealExperimentalWeapon(),
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
            image: `scenarios/crossbones/${imageA}.png`,
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
            image: `scenarios/crossbones/${imageB}.png`,
            stage,
            startingThreat,
            acceleration,
            value,
            ...(final ? {final: true} : {}),
            abilities: [experimentalWeaponsRevealed],
        },
    },
];

export default {
    _id: 'crossbones',
    order: 5,
    name: 'Calavera',
    folder: 'crossbones',
    config: {
        name: 'Calavera',
        villains: [
            villain({
                stage: 1,
                attack: 1,
                scheme: 1,
                hitPoints: 12,
                image: '04058',
            }),
            villain({
                stage: 2,
                attack: 2,
                scheme: 2,
                hitPoints: 14,
                image: '04059',
                abilities: [revealAndSearchMachinegun],
            }),
            villain({
                stage: 3,
                attack: 3,
                scheme: 2,
                hitPoints: 16,
                image: '04060',
                abilities: [{
                    type: ABILITY_WHEN_REVEALED,
                    params: {
                        effect: revealExperimentalWeapon(),
                    },
                }],
            }),
        ],
        mainSchemes: [
            mainScheme({
                name: 'Ataque al monte Atenea',
                stage: 1,
                imageA: '04061b',
                imageB: '04061',
                startingThreat: 0,
                acceleration: [1, true],
                value: [3, true],
                abilitiesA: [createExperimentalWeaponsDeck],
            }),
            mainScheme({
                name: 'La piedra del infinito',
                stage: 2,
                imageA: '04062b',
                imageB: '04062',
                startingThreat: [1, true],
                acceleration: [1, true],
                value: [6, true],
            }),
            mainScheme({
                name: 'La huida',
                stage: 3,
                imageA: '04063b',
                imageB: '04063',
                startingThreat: [1, true],
                acceleration: [1, true],
                value: [5, true],
                final: true,
            }),
        ],
        cards: [
            {count: 1, card: machinegun},
            {count: 1, card: armor},
            {count: 2, card: withCardSet(hydraTerrorist, SET)},
            {count: 2, card: automaticFire},
            {count: 2, card: toughToCrack},
            {count: 2, card: lootTheArsenal},
            {count: 2, card: crossbonesAttack},
            {count: 1, card: corneredStaff},
        ],
        sets: ['standard', EXPERIMENTAL_WEAPONS_DECK],
        defaultSets: ['hydra-assault', 'weapon-master', 'legions-of-hydra'],
    },
};
