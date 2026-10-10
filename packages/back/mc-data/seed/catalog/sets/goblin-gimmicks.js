import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED,
    CALC_MULTIPLY_2,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_TREACHERY,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHOOSE,
    EFFECT_DEAL_BOOST,
    EFFECT_DISCARD_GAME,
    EFFECT_HEAL,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_STORE_BOOST,
    EFFECT_SURGE,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ENEMY_HIGHEST_PRINTED_HP,
    TARGET_THIS,
    TARGET_VILLAIN,
    TRAIT_VEHICLE,
    TRAIT_WEAPON,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';

const discardThis = {
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
};

const spendAndDiscard = resources => ({
    arrow: {
        type: EFFECT_SPEND,
        params: {resources},
    },
    effect: discardThis,
});

export default {
    _id: 'goblin-gimmicks',
    config: {
        name: 'Trucos de duende',
        standard: false,
        cards: [
            {
                count: 2,
                card: {
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Planeador duende',
                        set: 'goblin-gimmicks',
                        image: 'sets/goblin-gimmicks/02033.png',
                        traits: [TRAIT_VEHICLE],
                        boost: 3,
                        attack: 1,
                        maxAttach: 1,
                        attach: {
                            target: TARGET_ENEMY_HIGHEST_PRINTED_HP,
                            ifNot: {
                                type: EFFECT_SURGE,
                            },
                        },
                        abilities: [
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard([
                                    RESOURCE_ENERGY,
                                    RESOURCE_ENERGY,
                                ]),
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
                        name: 'Bombas calabaza',
                        set: 'goblin-gimmicks',
                        image: 'sets/goblin-gimmicks/02034.png',
                        traits: [TRAIT_WEAPON],
                        boost: 2,
                        attach: TARGET_VILLAIN,
                        abilities: [
                            {
                                type: ABILITY_FORCED_RESPONSE,
                                params: {
                                    trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
                                    effect: {
                                        type: EFFECT_SIMULTANEOUS,
                                        params: {
                                            effects: [
                                                discardThis,
                                                {
                                                    type: EFFECT_ASSIGN_DAMAGE,
                                                    params: {
                                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                                        damage: 2,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard([
                                    RESOURCE_PHYSICAL,
                                    RESOURCE_PHYSICAL,
                                ]),
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
                        name: 'Intimidación',
                        set: 'goblin-gimmicks',
                        image: 'sets/goblin-gimmicks/02035.png',
                        boost: 1,
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: {
                                        type: EFFECT_CHOOSE,
                                        params: {
                                            options: [
                                                {
                                                    type: EFFECT_SPEND,
                                                    params: {
                                                        title: 'Gasta 2 recursos de cualquier tipo',
                                                        resources: [
                                                            RESOURCE_ANY,
                                                            RESOURCE_ANY,
                                                        ],
                                                    },
                                                },
                                                {
                                                    type: EFFECT_STORE_BOOST,
                                                    params: {
                                                        title: 'Dale al Villano 1 carta de aumento boca abajo',
                                                        target: TARGET_VILLAIN,
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
                                    type: EFFECT_DEAL_BOOST,
                                    params: {
                                        target: TARGET_VILLAIN,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Curación regenerativa',
                        set: 'goblin-gimmicks',
                        image: 'sets/goblin-gimmicks/02036.png',
                        boost: 1,
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: {
                                        type: EFFECT_HEAL,
                                        params: {
                                            target: TARGET_VILLAIN,
                                            damage: 0,
                                            paramsCalc: {
                                                formula: CALC_MULTIPLY_2,
                                                target: 'effect.match.villain.stage',
                                            },
                                        },
                                    },
                                    ifNot: {
                                        type: EFFECT_SURGE,
                                    },
                                },
                            },
                        ],
                        boostAbility: {
                            type: ABILITY_BOOST,
                            params: {
                                effect: {
                                    type: EFFECT_HEAL,
                                    params: {
                                        target: TARGET_VILLAIN,
                                        damage: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};
