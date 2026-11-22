import {
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CHARACTER_VILLAIN,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CALC_ATTACK,
    CALC_COUNTERS,
    CALC_MULTIPLY_2,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_PROTECTION,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_ENEMY_ATTACK,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_HEAL,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_RETALIATE_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_PREVENT_DEFEAT,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_COUNTER,
    EFFECT_REMOVE_THREAT,
    EFFECT_SET_LIFE,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_SURGE,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    OPERATOR_MAX,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ALL_ENEMIES,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_BRUTE,
    TRAIT_ATTACK,
    TRAIT_CONDITION,
    TRAIT_DEFENSE,
    TRAIT_GUARDIAN,
    TRAIT_OUTLAW,
    TRAIT_SKILL,
    TRAIT_THWART,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_INSTANT,
    TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_THIS_FLIP,
    TRIGGER_THIS_PLAY_CARD,
    TRIGGER_YOU_DEAL_DAMAGE,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_RETALIATE,
} from 'mc-shared';

const draxSet = 'Drax';

const draxAlterEgo = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: 'Drax',
        set: draxSet,
        image: 'heroes/drax/19001b.png',
        traits: [TRAIT_OUTLAW],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 4,
        handSize: 6,
        hitPoints: 14,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_FLIP,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        paramsCalc: {
                                            target: 'player.superhero',
                                            formula: CALC_COUNTERS,
                                        },
                                    },
                                },
                                {
                                    type: EFFECT_HEAL,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        paramsCalc: {
                                            target: 'effects.0.removedCounters',
                                            formula: CALC_MULTIPLY_2,
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

const draxHero = {
    type: CARD_TYPE_HERO,
    params: {
        name: 'Drax',
        set: draxSet,
        image: 'heroes/drax/19001a.png',
        traits: [TRAIT_GUARDIAN],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 1,
        attack: 1,
        defense: 2,
        handSize: 4,
        hitPoints: 14,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'player.superhero',
                                formula: CALC_COUNTERS,
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_RESPONSE,
                params: {
                    trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                not: {
                                    'player.superhero.counters': '>2',
                                },
                            },
                            effect: {
                                type: EFFECT_PLACE_COUNTERS,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    counters: 1,
                                    maxCounters: 3,
                                },
                            },
                            effectNot: {
                                type: EFFECT_DRAW_CARD,
                                params: {
                                    target: TARGET_YOU,
                                    count: 1,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const mantisAlly = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Mantis',
        set: draxSet,
        image: 'heroes/drax/19002.png',
        traits: [TRAIT_GUARDIAN],
        unique: true,
        cost: 2,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        hitPoints: 3,
        attack: 1,
        attackConsequential: 2,
        thwart: 2,
        thwartConsequential: 1,
        abilities: [
            {
                type: ABILITY_ACTION,
                params: {
                    name: 'Cura 3 de Daño a un Superhéroe',
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
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_THIS,
                                        damage: 1,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_HEAL,
                        params: {
                            target: TARGET_FRIENDLY_CHARACTER,
                            condition: {
                                isSuperhero: true,
                            },
                            damage: 3,
                        },
                    },
                },
            },
        ],
    },
};

const faceMeCoward = {
    type: CARD_TYPE_EVENT,
    params: {
        name: '¡Enfréntate a mí, cobarde!',
        set: draxSet,
        image: 'heroes/drax/19003.png',
        cost: 0,
        resources: [RESOURCE_PHYSICAL],
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
                                    type: EFFECT_SIMULTANEOUS,
                                    params: {
                                        effects: [
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
                                {
                                    type: EFFECT_ENEMY_ATTACK,
                                    params: {
                                        target: TARGET_YOU,
                                        enemyType: CHARACTER_VILLAIN,
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

const intimidation = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Intimidación',
        set: draxSet,
        image: 'heroes/drax/19004.png',
        traits: [TRAIT_THWART],
        cost: 1,
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
                            paramsCalc: {
                                target: 'player.superhero',
                                formula: CALC_ATTACK,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const jumpAndStab = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Salto y apuñalamiento',
        set: draxSet,
        image: 'heroes/drax/19005.png',
        traits: [TRAIT_SKILL],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_PLAY_CARD,
                    effect: {
                        type: EFFECT_MODIFY_COST,
                        params: {
                            target: TARGET_EFFECT,
                            paramsCalc: {
                                target: 'player.superhero',
                                formula: CALC_COUNTERS,
                                multiply: -1,
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_YOU_BASIC_ATTACK,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        target: TARGET_EFFECT,
                                        count: 5,
                                    },
                                },
                                {
                                    type: EFFECT_MODIFY_ATTACK,
                                    params: {
                                        target: TARGET_EFFECT,
                                        modify: {
                                            keywords: {
                                                overkill: true,
                                                piercing: true,
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

const parry = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Parada',
        set: draxSet,
        image: 'heroes/drax/19006.png',
        traits: [TRAIT_DEFENSE],
        cost: 0,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    labels: [LABEL_DEFENSE],
                    trigger: TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
                    triggerParams: {
                        target: TARGET_YOUR_HERO,
                    },
                    effect: {
                        type: EFFECT_PREVENT_DAMAGE,
                        params: {
                            target: TARGET_YOUR_HERO,
                            paramsCalc: {
                                target: 'player.superhero',
                                formula: CALC_ATTACK,
                                multiply: 2,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const avengeTheInsult = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Vengar afrenta',
        set: draxSet,
        image: 'heroes/drax/19007.png',
        traits: [TRAIT_ATTACK],
        cost: 0,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    labels: [LABEL_ATTACK],
                    trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_VILLAIN,
                            paramsCalc: {
                                target: 'player.superhero',
                                formula: CALC_ATTACK,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const draxDagger = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'El puñal de Drax',
        set: draxSet,
        image: 'heroes/drax/19008.png',
        traits: [TRAIT_WEAPON],
        unique: true,
        cost: 1,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        keywords: {
            restricted: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
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
    },
};

const otherDraxDagger = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'El otro puñal de Drax',
        set: draxSet,
        image: 'heroes/drax/19009.png',
        traits: [TRAIT_WEAPON],
        unique: true,
        cost: 1,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        keywords: {
            restricted: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_RETALIATE,
                    effect: {
                        type: EFFECT_MODIFY_RETALIATE_VALUE,
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

const masterOfDwiTheet = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Maestro de dwi theet',
        set: draxSet,
        image: 'heroes/drax/19010.png',
        traits: [TRAIT_SKILL],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_YOU_BASIC_ATTACK,
                    effect: {
                        type: EFFECT_DRAW_CARD,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

const tooStubbornToDie = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Demasiado terco para morir',
        set: draxSet,
        image: 'heroes/drax/19011.png',
        traits: [TRAIT_CONDITION],
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_INTERRUPT,
                params: {
                    trigger: TRIGGER_CHARACTER_WOULD_BE_DEFEATED,
                    triggerParams: {
                        target: TARGET_YOUR_HERO,
                    },
                    condition: {
                        'effect.selectedTarget.name': 'Drax',
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_PREVENT_DEFEAT,
                                    params: {
                                        target: TARGET_EFFECT,
                                    },
                                },
                                {
                                    type: EFFECT_SET_LIFE,
                                    params: {
                                        target: TARGET_YOUR_SUPERHERO,
                                        life: 4,
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

const memoriesFromAnotherLife = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Recuerdos de otra vida',
        set: draxSet,
        image: 'heroes/drax/19025.png',
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Adoptar la identidad de tu Alter ego',
                    trigger: TRIGGER_INSTANT,
                    effect: {
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
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Resolver la Obligación',
                    trigger: TRIGGER_INSTANT,
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Agota tu Alter ego → retira del juego Recuerdos de otra vida',
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
                                        name: 'Quedas aturdido. Si ya estabas aturdido, esta carta gana Oleada. Descarta esta Obligación.',
                                        effect: {
                                            type: EFFECT_DO_IF,
                                            params: {
                                                condition: {
                                                    'player.isStunned': true,
                                                },
                                                effect: {
                                                    type: EFFECT_CHAINED,
                                                    params: {
                                                        effects: [
                                                            {
                                                                type: EFFECT_SURGE,
                                                                params: {},
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
                                                effectNot: {
                                                    type: EFFECT_CHAINED,
                                                    params: {
                                                        effects: [
                                                            {
                                                                type: EFFECT_STUN,
                                                                params: {
                                                                    target: TARGET_YOU,
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

const sacrificeTheWeak = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Sacrifica a los débiles',
        set: draxSet,
        image: 'heroes/drax/19026.png',
        startingThreat: [2, true],
        boost: 2,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_ATTACK,
                    triggerParams: {
                        target: TARGET_ALL_ENEMIES,
                    },
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 2,
                        },
                    },
                },
            },
        ],
    },
};

const yotatTheDestroyer = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Yotat el Destructor',
        set: draxSet,
        image: 'heroes/drax/19027.png',
        unique: true,
        nemesis: true,
        traits: [TRAIT_BRUTE],
        attack: 3,
        scheme: 1,
        hitPoints: 5,
        keywords: {
            guard: true,
            retaliate: 1,
        },
        boost: 3,
    },
};

const acceptedChallenge = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Reto aceptado',
        set: draxSet,
        image: 'heroes/drax/19028.png',
        attach: {
            target: TARGET_CONDITION_CARD,
            condition: {
                attack: {
                    operator: OPERATOR_MAX,
                },
            },
        },
        keywords: {
            surge: true,
        },
        boost: 1,
        attack: 2,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_YOU_DEAL_DAMAGE,
                    triggerParams: {
                        target: TARGET_ATTACHED,
                    },
                    condition: {
                        'effect.isAttack': true,
                        'effect.character.name': 'Drax',
                        'effect.takenDamage': '>3',
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

const illDestroyYou = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: '¡Te destruiré!',
        set: draxSet,
        image: 'heroes/drax/19029.png',
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {
                        type: EFFECT_SURGE,
                        params: {},
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
                                        enemyType: TARGET_CONDITION_CARD,
                                        condition: {
                                            name: 'Yotat el Destructor',
                                        },
                                        attackModifier: 1,
                                        target: TARGET_YOU,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'effects.0.resolved': false,
                                        },
                                        effect: {
                                            type: EFFECT_ENEMY_ATTACK,
                                            params: {
                                                enemyType: CHARACTER_VILLAIN,
                                                target: TARGET_YOU,
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

export default {
    _id: 'drax',
    order: 20,
    name: 'Drax',
    folder: 'drax',
    config: {
        sides: [draxAlterEgo, draxHero],
        cards: [
            {count: 1, card: mantisAlly},
            {count: 2, card: faceMeCoward},
            {count: 2, card: intimidation},
            {count: 2, card: jumpAndStab},
            {count: 2, card: parry},
            {count: 2, card: avengeTheInsult},
            {count: 1, card: draxDagger},
            {count: 1, card: otherDraxDagger},
            {count: 1, card: masterOfDwiTheet},
            {count: 1, card: tooStubbornToDie},
        ],
        precon: [
            {
                aspect: CLASSIFICATION_PROTECTION,
                cardRefs: [
                    {id: 'protection-contragolpe', count: 2},
                    {id: 'protection-indomito', count: 2},
                    {id: 'protection-martir', count: 1},
                    {id: 'protection-dragon-lunar', count: 1},
                    {id: 'protection-desvio', count: 3},
                    {id: 'protection-una-dura-leccion', count: 3},
                    {id: 'protection-golpe-de-tanteo', count: 3},
                    {id: 'protection-sometimiento', count: 3},
                ],
            },
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-preparacion-fisica', count: 3},
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-gamora', count: 1},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: memoriesFromAnotherLife,
        },
        nemesis: [
            {count: 1, card: sacrificeTheWeak},
            {count: 1, card: yotatTheDestroyer},
            {count: 1, card: acceptedChallenge},
            {count: 2, card: illDestroyYou},
        ],
    },
};
