import {
    ABILITY_WHEN_DEFEATED,
    CARD_TYPE_MINION,
    EFFECT_DEAL_ENCOUNTER,
    TARGET_ENGAGED,
    TRAIT_HYDRA,
} from 'mc-shared';

export const hydraSoldier = {
    'type': CARD_TYPE_MINION,
    'params': {
        'name': 'Soldado de Hydra',
        'set': 'legions-of-hydra',
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
