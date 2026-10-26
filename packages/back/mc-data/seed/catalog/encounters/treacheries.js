import {
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_TREACHERY,
    CHARACTER_ALL_ENGAGED_MINIONS,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENGAGE,
    EFFECT_FOR_EACH,
    EFFECT_SEARCH_CARDS,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SURGE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_ALL_ENEMIES,
    TARGET_ALL_PLAYERS,
    TARGET_ENGAGED_HERO,
    TARGET_YOU,
    TRAIT_HYDRA,
} from 'mc-shared';

export const gangUp = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Todos a una',
        image: 'sets/standard/standard6.webp',
        boost: 1,
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
                                        enemyType: CHARACTER_VILLAIN,
                                        target: TARGET_YOU,
                                    },
                                },
                                {
                                    type: EFFECT_SEVERAL_ATTACKS,
                                    params: {
                                        enemiesType: [CHARACTER_ALL_ENGAGED_MINIONS],
                                        target: TARGET_YOU,
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

export const hailHydra = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: '¡Hail, Hydra!',
        image: 'heroes/captain-america/03030.png',
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
                                    type: EFFECT_SEVERAL_ATTACKS,
                                    params: {
                                        enemiesType: TARGET_ALL_ENEMIES,
                                        enemiesCondition: {
                                            isMinion: true,
                                            traits: TRAIT_HYDRA,
                                        },
                                        attackTarget: TARGET_ENGAGED_HERO,
                                    },
                                },
                                {
                                    type: EFFECT_FOR_EACH,
                                    params: {
                                        target: TARGET_ALL_PLAYERS,
                                        condition: {
                                            exclude: [
                                                'effects.0.attacks.*.selectedTarget',
                                                'effects.0.attacks.*.defender.owner',
                                            ],
                                        },
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_SEARCH_CARDS,
                                                        params: {
                                                            locations: [
                                                                PLACE_ENCOUNTER_DECK_CARDS,
                                                                PLACE_ENCOUNTER_DISCARD,
                                                            ],
                                                            filter: {
                                                                type: CARD_TYPE_MINION,
                                                                traits: TRAIT_HYDRA,
                                                            },
                                                            title: 'Busca un Esbirro Hydra',
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_ENGAGE,
                                                        params: {
                                                            target: TARGET_YOU,
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
