import {
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_DEFEATED,
    CARD_TYPE_MINION,
    EFFECT_CHOOSE,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_PLACE_THREAT,
    EFFECT_TAKE_DAMAGE,
    TARGET_MAIN_SCHEME,
    TARGET_ENGAGED,
    TARGET_YOU,
    TRAIT_HYDRA,
} from 'mc-shared';

export const hydraTerrorist = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Terrorista de Hydra',
        image: 'sets/bomb-scare/bomb2.webp',
        traits: [TRAIT_HYDRA],
        boost: 1,
        scheme: 1,
        attack: 1,
        hitPoints: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHOOSE,
                        params: {
                            options: [
                                {
                                    type: EFFECT_TAKE_DAMAGE,
                                    params: {
                                        damage: 2,
                                        target: TARGET_YOU,
                                    },
                                },
                                {
                                    type: EFFECT_PLACE_THREAT,
                                    params: {
                                        threat: 1,
                                        target: TARGET_MAIN_SCHEME,
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

export const hydraTroop = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Tropa de Hydra',
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
};

export const hydraSoldier = {
    'type': CARD_TYPE_MINION,
    'params': {
        'name': 'Soldado de Hydra',
        'image': 'sets/legions-of-hydra/01182.png',
        'traits': [
            TRAIT_HYDRA
        ],
        'boost': 1,
        'attack': 2,
        'scheme': 1,
        'hitPoints': 4,
        'keywords': {
            'guard': true
        },
        'abilities': [
            {
                'type': ABILITY_WHEN_DEFEATED,
                'params': {
                    'effect': {
                        'type': EFFECT_DEAL_ENCOUNTER,
                        'params': {
                            'target': TARGET_ENGAGED
                        }
                    }
                }
            }
        ]
    }
};

export const hydraMercenary = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Mercenario de Hydra',
        image: 'scenarios/rhino/01101.png',
        traits: [
            TRAIT_HYDRA
        ],
        boost: 1,
        scheme: 0,
        attack: 1,
        hitPoints: 3,
        keywords: {
            guard: true
        }
    }
};
