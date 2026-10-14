import {
    ABILITY_BOOST,
    ABILITY_WHEN_REVEALED,
    CALC_MULTIPLY_2,
    CARD_TYPE_TREACHERY,
    EFFECT_CHOOSE,
    EFFECT_DEAL_BOOST,
    EFFECT_HEAL,
    EFFECT_SPEND,
    EFFECT_STORE_BOOST,
    EFFECT_SURGE,
    RESOURCE_ANY,
    TARGET_VILLAIN,
} from 'mc-shared';
import {
    goblinGlider,
    pumpkinBombs,
} from '../encounters/attachments.js';
import {withCardSet} from '../with-card-set.js';

export default {
    _id: 'goblin-gimmicks',
    config: {
        name: 'Trucos de duende',
        standard: false,
        cards: [
            {
                count: 2,
                card: withCardSet(goblinGlider, 'goblin-gimmicks'),
            },
            {
                count: 2,
                card: withCardSet(pumpkinBombs, 'goblin-gimmicks'),
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
