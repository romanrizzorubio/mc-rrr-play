import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_LEADERSHIP,
    DECK_POSITION_TOP,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DEFEAT,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_READY,
    EFFECT_SURGE,
    EFFECT_SWAP_CARDS,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
    PHASE_VILLAIN,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_CARD,
    TARGET_ENGAGED,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_MINION,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_CRIMINAL,
    TRAIT_ELITE,
    TRAIT_GUARDIAN,
    TRAIT_ITEM,
    TRAIT_NOVA_CORPS,
    TRAIT_OUTLAW,
    TRAIT_TECH,
    TRAIT_TITLE,
    TRAIT_VEHICLE,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_GET_THWART,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_GET_HAND_SIZE,
    TRIGGER_INSTANT,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_YOU_PLAY_CARD_COST,
} from 'mc-shared';

const set = 'Starlord';
const heroName = 'Starlord';
const alterEgoName = 'Peter Quill';

const starlordAlterego = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: alterEgoName,
        set,
        image: 'heroes/starlord/17001b.png',
        traits: [TRAIT_OUTLAW],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 3,
        handSize: 6,
        hitPoints: 10,
        abilities: [
            {
                type: ABILITY_SETUP,
                params: {
                    name: 'Preparación',
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [
                                            PLACE_DECK,
                                            PLACE_DISCARD_PILE,
                                        ],
                                        filter: {
                                            name: 'Pistola elemental',
                                        },
                                        requireMatch: true,
                                        title: 'Busca una Pistola elemental',
                                    },
                                },
                                {
                                    type: EFFECT_MOVE_TO_HAND,
                                    params: {
                                        target: TARGET_SOURCE,
                                        source: 'selectedCards',
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    name: 'Labia',
                    limit: {
                        count: 1,
                        target: TARGET_ROUND,
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SWAP_CARDS,
                                    params: {
                                        locations: [
                                            {
                                                type: PLACE_HAND,
                                                path: 'player.hand',
                                            },
                                            {
                                                type: PLACE_DECK,
                                                path: 'player.deck',
                                                position: DECK_POSITION_TOP,
                                            },
                                        ],
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

const starlordHero = {
    type: CARD_TYPE_HERO,
    params: {
        name: heroName,
        set,
        image: 'heroes/starlord/17001a.png',
        traits: [TRAIT_GUARDIAN],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 2,
        attack: 2,
        defense: 1,
        handSize: 5,
        hitPoints: 10,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Líder de los Guardianes',
                    trigger: TRIGGER_CONDITION_GET_TRAITS,
                    triggerParams: {
                        target: TARGET_ALL_ALLIES_YOU_CONTROL,
                    },
                    effect: {
                        type: EFFECT_MODIFY_TRAITS,
                        params: {
                            target: TARGET_EFFECT,
                            traits: [TRAIT_GUARDIAN],
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    name: '¿Qué podría salir mal?',
                    trigger: TRIGGER_YOU_PLAY_CARD_COST,
                    condition: {
                        'effect.playedFromHand': true,
                    },
                    limit: {
                        count: 1,
                        target: TARGET_ROUND,
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DEAL_ENCOUNTER,
                                    params: {
                                        target: TARGET_YOU,
                                    },
                                },
                                {
                                    type: EFFECT_MODIFY_COST,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: -3,
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

const novaPrime = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Nova Prime',
        subtitle: 'Richard Rider',
        set,
        image: 'heroes/starlord/17002.png',
        traits: [TRAIT_AERIAL, TRAIT_NOVA_CORPS],
        unique: true,
        cost: 5,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        attack: 3,
        thwart: 2,
        attackConsequential: 1,
        thwartConsequential: 1,
        hitPoints: 3,
        abilities: [
            {
                type: ABILITY_RESPONSE,
                params: {
                    name: 'Nova Prime',
                    trigger: TRIGGER_YOU_END_PLAY_CARD,
                    condition: {
                        'effect.card.name': 'Nova Prime',
                        'effect.playedFromHand': true,
                    },
                    effect: {
                        type: EFFECT_DEFEAT,
                        params: {
                            target: TARGET_MINION,
                            condition: {
                                not: {
                                    traits: TRAIT_ELITE,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const recklessEscape = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Huida temeraria',
        set,
        image: 'heroes/starlord/17003.png',
        cost: 0,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DEAL_ENCOUNTER,
                                    params: {
                                        target: TARGET_YOU,
                                    },
                                },
                                {
                                    type: EFFECT_READY,
                                    params: {
                                        target: TARGET_YOUR_HERO,
                                    },
                                },
                                {
                                    type: EFFECT_DRAW_CARD,
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
        ],
    },
};

const boldManeuver = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Maniobra audaz',
        set,
        image: 'heroes/starlord/17004.png',
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_THWART],
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            target: TARGET_SCHEME,
                            threat: 2,
                            additionalThreatCalc: {
                                target: 'player.gameZone.encounters',
                                formula: CALC_COUNT,
                                multiply: 2,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const shootingSlide = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Deslizarse disparando',
        set,
        image: 'heroes/starlord/17005.png',
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        paramsToPlay: {
            'upgrades.*.name': 'Pistola elemental',
        },
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 5,
                            additionalDamageCalc: {
                                target: 'player.gameZone.encounters',
                                formula: CALC_COUNT,
                                multiply: 2,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const badBoy = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Chico Malo',
        set,
        image: 'heroes/starlord/17006.png',
        traits: [TRAIT_VEHICLE],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    name: 'Chico Malo',
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_YOUR_SUPERHERO,
                    },
                    condition: {
                        'effect.isAttack': true,
                        'effect.character.isVillain': true,
                    },
                    arrow: {
                        type: EFFECT_REMOVE_CARD,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_PREVENT_DAMAGE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        preventAll: true,
                                    },
                                },
                                {
                                    type: EFFECT_FLIP,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        formTarget: TARGET_ALTEREGO_SIDE,
                                    },
                                },
                                {
                                    type: EFFECT_DRAW_CARD,
                                    params: {
                                        target: TARGET_YOU,
                                        count: 2,
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

const elementalPistol = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Pistola elemental',
        set,
        image: 'heroes/starlord/17007.png',
        traits: [TRAIT_TECH, TRAIT_WEAPON],
        cost: 3,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        keywords: {
            restricted: true,
        },
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        resources: [RESOURCE_ANY],
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 3,
                            keywords: {
                                piercing: true,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const flightBoots = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Botas de vuelo',
        set,
        image: 'heroes/starlord/17008.png',
        traits: [TRAIT_ITEM, TRAIT_TECH],
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CONDITION_GET_TRAITS,
                    triggerParams: {
                        conditionTrigger: {
                            name: heroName,
                            isHero: true,
                        },
                        conditionSource: 'effect.selectedTarget',
                    },
                    effect: {
                        type: EFFECT_MODIFY_TRAITS,
                        params: {
                            target: TARGET_EFFECT,
                            traits: [TRAIT_AERIAL],
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    name: 'Botas de vuelo',
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_YOUR_SUPERHERO,
                    },
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                    effect: {
                        type: EFFECT_PREVENT_DAMAGE,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'player.gameZone.encounters',
                                formula: CALC_COUNT,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const guardianLeader = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Líder de los Guardianes',
        set,
        image: 'heroes/starlord/17009.png',
        traits: [TRAIT_TITLE],
        unique: true,
        cost: 3,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_THWART,
                    triggerParams: {
                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                        traits: [TRAIT_GUARDIAN],
                    },
                    effect: {
                        type: EFFECT_MODIFY_THWART_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

const starlordHelmet = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Casco de Starlord',
        set,
        image: 'heroes/starlord/17010.png',
        traits: [TRAIT_ARMOR, TRAIT_TECH],
        unique: true,
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_GET_HAND_SIZE,
                    triggerParams: {
                        target: TARGET_YOUR_HERO,
                    },
                    condition: {
                        'player.superhero.currentSide.name': heroName,
                        'player.superhero.currentSide.isHero': true,
                    },
                    effect: {
                        type: EFFECT_MODIFY_HAND_SIZE,
                        params: {
                            target: TARGET_YOUR_HERO,
                            paramsCalc: {
                                target: 'player.gameZone.encounters',
                                formula: CALC_COUNT,
                                max: 3,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const exileObligation = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Destierro',
        set,
        image: 'heroes/starlord/17024.png',
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_INSTANT,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_MAY,
                                    params: {
                                        effect: {
                                            type: EFFECT_FLIP,
                                            params: {
                                                target: TARGET_YOUR_SUPERHERO,
                                                formTarget: TARGET_ALTEREGO_SIDE,
                                            },
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_CHOOSE_ABILITY,
                                    params: {
                                        options: [
                                            {
                                                type: ABILITY_OPTION,
                                                params: {
                                                    name: 'Agota a Peter Quill para retirar Destierro del juego',
                                                    arrow: {
                                                        type: EFFECT_EXHAUST,
                                                        params: {
                                                            target: TARGET_ALTEREGO,
                                                        },
                                                    },
                                                    effect: {
                                                        type: EFFECT_REMOVE_CARD,
                                                        params: {
                                                            target: TARGET_CARD,
                                                        },
                                                    },
                                                },
                                            },
                                            {
                                                type: ABILITY_OPTION,
                                                params: {
                                                    name: 'Descarta una Pistola elemental; si no puedes, coloca 3 de Amenaza sobre el Plan principal',
                                                    effect: {
                                                        type: EFFECT_CHAINED,
                                                        params: {
                                                            effects: [
                                                                {
                                                                    type: EFFECT_DO_IF,
                                                                    params: {
                                                                        condition: {
                                                                            'player.upgrades.*.name': 'Pistola elemental',
                                                                        },
                                                                        effect: {
                                                                            type: EFFECT_DISCARD_GAME,
                                                                            params: {
                                                                                target: TARGET_UPGRADE_YOU_CONTROL,
                                                                                condition: {
                                                                                    name: 'Pistola elemental',
                                                                                },
                                                                                selectCount: 1,
                                                                            },
                                                                        },
                                                                        effectNot: {
                                                                            type: EFFECT_PLACE_THREAT,
                                                                            params: {
                                                                                target: TARGET_MAIN_SCHEME,
                                                                                count: 3,
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                {
                                                                    type: EFFECT_DISCARD_GAME,
                                                                    params: {
                                                                        target: TARGET_CARD,
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
                            ],
                        },
                    },
                },
            },
        ],
    },
};

const earlyCrimeSyndicate = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Sindicato del crimen en ciernes',
        set,
        image: 'heroes/starlord/17025.png',
        startingThreat: 2,
        keywords: {
            hinder: [2, true],
        },
        icons: {
            hazard: 1,
        },
        boost: 3,
    },
};

const lordKnife = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Señor Cuchillo',
        set,
        image: 'heroes/starlord/17026.png',
        unique: true,
        nemesis: true,
        traits: [TRAIT_CRIMINAL, TRAIT_ELITE],
        attack: 2,
        scheme: 2,
        hitPoints: 6,
        retaliate: 1,
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Astucia de Señor Cuchillo',
                    trigger: TRIGGER_TREACHERY_REVEAL,
                    triggerParams: {
                        target: TARGET_ENGAGED,
                    },
                    condition: {
                        'match.phase': PHASE_VILLAIN,
                        'effect.isFirstTreacheryReveal': true,
                    },
                    effect: {
                        type: EFFECT_SURGE,
                        params: {},
                    },
                },
            },
        ],
    },
};

const spartoiCunning = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Astucia spartoi',
        set,
        image: 'heroes/starlord/17027.png',
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
                                    type: EFFECT_DISCARD_RANDOM,
                                    params: {
                                        target: TARGET_YOU,
                                        count: 1,
                                    },
                                },
                                {
                                    type: EFFECT_TAKE_DAMAGE,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        damage: 1,
                                    },
                                },
                                {
                                    type: EFFECT_PLACE_THREAT,
                                    params: {
                                        target: TARGET_MAIN_SCHEME,
                                        count: 1,
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
    _id: 'starlord',
    order: 19,
    name: heroName,
    folder: 'starlord',
    config: {
        sides: [starlordAlterego, starlordHero],
        cards: [
            {count: 1, card: novaPrime},
            {count: 3, card: recklessEscape},
            {count: 2, card: boldManeuver},
            {count: 3, card: shootingSlide},
            {count: 1, card: badBoy},
            {count: 2, card: elementalPistol},
            {count: 1, card: flightBoots},
            {count: 1, card: guardianLeader},
            {count: 1, card: starlordHelmet},
        ],
        precon: [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-cosmo', count: 1},
                    {id: 'basic-ngii', count: 1},
                    {id: 'basic-sapiencial', count: 1},
                    {id: 'basic-granada-de-pulsos', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_LEADERSHIP,
                cardRefs: [
                    {id: 'leadership-adam-warlock', count: 1},
                    {id: 'leadership-bill-rayos-beta', count: 1},
                    {id: 'leadership-yondu', count: 1},
                    {id: 'leadership-supremacia-aerea', count: 3},
                    {id: 'leadership-heroismo-suicida', count: 3},
                    {id: 'leadership-practicas-de-tiro', count: 3},
                    {id: 'leadership-pistola-laser', count: 3},
                    {id: 'leadership-preparacion', count: 2},
                    {id: 'leadership-el-poder-del-liderazgo', count: 2},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: exileObligation,
        },
        nemesis: [
            {count: 1, card: earlyCrimeSyndicate},
            {count: 1, card: lordKnife},
            {count: 3, card: spartoiCunning},
        ],
    },
};
