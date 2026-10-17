import {
    ABILITY_WHEN_REVEALED,
    CALC_THREAT,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CONFUSE,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_PLACE_THREAT,
    EFFECT_SURGE,
    TARGET_ALL_HEROES_ALLIES,
    TARGET_CARD,
    TARGET_YOU,
} from 'mc-shared';

import {hydraTerrorist} from '../encounters/minions.js';
import {withCardSet} from '../with-card-set.js';

export default {
    '_id': 'bomb-scare',
    'config': {
        'name': 'Amenaza de bomba',
        'standard': false,
        'cards': [
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    'params': {
                        'name': 'Amenaza de bomba',
                        'set': 'bomb-scare',
                        'image': 'sets/bomb-scare/bomb1.webp',
                        'boost': 2,
                        'icons': {
                            'acceleration': 1
                        },
                        'startingThreat': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_PLACE_THREAT,
                                        'params': {
                                            'threat': [
                                                1,
                                                true
                                            ],
                                            'target': TARGET_CARD
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                'count': 2,
                'card': withCardSet(hydraTerrorist, 'bomb-scare')
            },
            {
                'count': 1,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Explosión',
                        'set': 'bomb-scare',
                        'image': 'sets/bomb-scare/bomb4.webp',
                        'boost': 2,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_DO_IF_CARD_GAME,
                                        'params': {
                                            'condition': {
                                                'name': 'Bomb Scare'
                                            },
                                            'effect': {
                                                'type': EFFECT_ASSIGN_DAMAGE,
                                                'params': {
                                                    'target': TARGET_ALL_HEROES_ALLIES,
                                                    'paramsCalc': {
                                                        'target': 'cardCondition',
                                                        'formula': CALC_THREAT
                                                    }
                                                }
                                            },
                                            'effectNot': {
                                                'type': EFFECT_SURGE
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            {
                'count': 2,
                'card': {
                    'type': CARD_TYPE_TREACHERY,
                    'params': {
                        'name': 'Falsa Alarma',
                        'set': 'bomb-scare',
                        'image': 'sets/bomb-scare/bomb5.webp',
                        'boost': 1,
                        'abilities': [
                            {
                                'type': ABILITY_WHEN_REVEALED,
                                'params': {
                                    'effect': {
                                        'type': EFFECT_CONFUSE,
                                        'params': {
                                            'target': TARGET_YOU
                                        }
                                    },
                                    'ifNot': {
                                        'type': EFFECT_SURGE,
                                        'params': {}
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]
    }
};
