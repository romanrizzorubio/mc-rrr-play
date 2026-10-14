import {
    ABILITY_WHEN_DEFEATED,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    EFFECT_CHAINED,
    EFFECT_ENGAGE,
    EFFECT_FOR_EACH,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_ALL_PLAYERS,
    TARGET_SCENARIO,
    TARGET_YOU,
    TRAIT_HYDRA,
} from 'mc-shared';

import {hydraSoldier} from '../encounters/minions.js';
import {withCardSet} from '../with-card-set.js';

export default {
    _id: 'hydra-patrol',
    config: {
        name: 'Patrulla de Hydra',
        standard: false,
        cards: [
            {
                count: 2,
                card: {
                    type: CARD_TYPE_MINION,
                    params: {
                        name: 'Tropa de Hydra',
                        set: 'hydra-patrol',
                        image: 'sets/hydra-patrol/04152.png',
                        traits: [TRAIT_HYDRA],
                        boost: 2,
                        attack: 2,
                        scheme: 1,
                        hitPoints: 2,
                        keywords: {
                            incite: 1,
                        },
                    },
                },
            },
            {
                count: 3,
                card: withCardSet(hydraSoldier, 'hydra-patrol'),
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'Patrulla de Hydra',
                        set: 'hydra-patrol',
                        image: 'sets/hydra-patrol/04154.png',
                        boost: 2,
                        startingThreat: [2, true],
                        icons: {
                            crisis: true,
                        },
                        abilities: [
                            {
                                type: ABILITY_WHEN_DEFEATED,
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
                                                                            locations: [
                                                                                PLACE_ENCOUNTER_DECK_CARDS,
                                                                                PLACE_ENCOUNTER_DISCARD,
                                                                            ],
                                                                            filter: {
                                                                                type: CARD_TYPE_MINION,
                                                                                traits: TRAIT_HYDRA,
                                                                            },
                                                                            count: 1,
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
                            },
                        ],
                    },
                },
            },
        ],
    },
};
