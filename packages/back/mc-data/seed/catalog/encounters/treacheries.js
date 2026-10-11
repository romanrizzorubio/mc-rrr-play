import {
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_TREACHERY,
    CHARACTER_ALL_ENGAGED_MINIONS,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_ENEMY_ATTACK,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SURGE,
    TARGET_YOU,
} from 'mc-shared';

export const gangUp = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Todos a una',
        set: 'standard',
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
