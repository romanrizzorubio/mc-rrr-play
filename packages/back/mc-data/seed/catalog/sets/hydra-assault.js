import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    CARD_TYPE_MINION,
    EFFECT_DELAYED,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    TARGET_ACTIVATION,
    TARGET_SOURCE,
    TARGET_YOU,
    TRAIT_HYDRA,
    TRIGGER_THIS_ATTACK,
    CHARACTER_VILLAIN,
} from 'mc-shared';

import {hydraSoldier} from '../encounters/minions.js';
import {hailHydra} from '../encounters/treacheries.js';
import {withCardSet} from '../with-card-set.js';

const discardSupport = source => ({
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_SOURCE,
        source,
    },
});

export default {
    _id: 'hydra-assault',
    config: {
        name: 'Asalto de Hydra',
        standard: false,
        cards: [
            {
                count: 3,
                card: {
                    type: CARD_TYPE_MINION,
                    params: {
                        name: 'Soldado de Hydra con lanzallamas',
                        set: 'hydra-assault',
                        image: 'sets/hydra-assault/04145.png',
                        traits: [TRAIT_HYDRA],
                        boost: 0,
                        attack: 1,
                        scheme: 1,
                        hitPoints: 4,
                        abilities: [
                            {
                                type: ABILITY_FORCED_RESPONSE,
                                params: {
                                    trigger: TRIGGER_THIS_ATTACK,
                                    condition: {
                                        'attack.effect.isDefended': false,
                                    },
                                    effect: discardSupport('attack.selectedTarget.supports'),
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
                                            'activation.effect.isAttack': true,
                                            'activation.effect.isDefended': false,
                                        },
                                        effect: discardSupport('activation.selectedTarget.supports'),
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
                    type: CARD_TYPE_MINION,
                    params: {
                        name: 'Soldado volador de Hydra',
                        set: 'hydra-assault',
                        image: 'sets/hydra-assault/04146.png',
                        traits: [TRAIT_HYDRA],
                        boost: 0,
                        attack: 2,
                        scheme: 0,
                        hitPoints: 3,
                        keywords: {
                            quickStrike: true,
                        },
                        boostAbility: {
                            type: ABILITY_BOOST,
                            params: {
                                effect: {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'activation.effect.selectedTarget.isHero': true,
                                        },
                                        effect: {
                                            type: EFFECT_DELAYED,
                                            params: {
                                                target: TARGET_ACTIVATION,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                count: 1,
                card: withCardSet(hailHydra, 'hydra-assault'),
            },
            {
                count: 2,
                card: withCardSet(hydraSoldier, 'hydra-assault'),
            },
        ],
    },
};
