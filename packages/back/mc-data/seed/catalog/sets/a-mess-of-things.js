import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CHAINED,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_FOR_EACH,
    EFFECT_PLACE_THREAT,
    EFFECT_STUN,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ATTACKED,
    TARGET_CONDITION_CARD,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

import {gangUp} from '../encounters/treacheries.js';
import {withCardSet} from '../with-card-set.js';

export default {
    _id: 'a-mess-of-things',
    config: {
        name: 'Un auténtico estropicio',
        standard: false,
        cards: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                    params: {
                        name: 'Un auténtico estropicio',
                        set: 'a-mess-of-things',
                        image: 'sets/a-mess-of-things/02037.png',
                        startingThreat: 2,
                        icons: {hazard: 1},
                        boost: 2,
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
                                params: {
                                    effect: {
                                        type: EFFECT_FOR_EACH,
                                        params: {
                                            target: TARGET_ALL_FRIENDLY_CHARACTERS,
                                            condition: {isStunned: true},
                                            effect: {
                                                type: EFFECT_PLACE_THREAT,
                                                params: {
                                                    target: TARGET_THIS,
                                                    threat: 2,
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
            {
                count: 1,
                card: {
                    type: CARD_TYPE_MINION,
                    params: {
                        name: 'Escorpión',
                        set: 'a-mess-of-things',
                        image: 'sets/a-mess-of-things/02038.png',
                        unique: true,
                        keywords: {
                            quickStrike: true,
                        },
                        boost: 2,
                        attack: 3,
                        scheme: 3,
                        hitPoints: 7,
                        abilities: [
                            {
                                type: ABILITY_FORCED_RESPONSE,
                                params: {
                                    trigger: TRIGGER_THIS_ATTACK,
                                    condition: {'effect.takenDamage': '>0'},
                                    effect: {
                                        type: EFFECT_STUN,
                                        params: {
                                            target: TARGET_ATTACKED,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            {
                count: 1,
                card: withCardSet(gangUp, 'a-mess-of-things'),
            },
            {
                count: 2,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Barrido de cola',
                        set: 'a-mess-of-things',
                        image: 'sets/a-mess-of-things/02040.png',
                        boost: 0,
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED,
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
                                                            isMinion: true,
                                                            isInPlay: true,
                                                            name: 'Escorpión',
                                                        },
                                                        target: TARGET_YOUR_HERO,
                                                    },
                                                },
                                                {
                                                    type: EFFECT_DO_IF,
                                                    params: {
                                                        condition: {
                                                            'effects.0.resolved': false,
                                                        },
                                                        effect: {
                                                            type: EFFECT_STUN,
                                                            params: {
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
                        boostAbility: {
                            type: ABILITY_BOOST,
                            params: {
                                effect: {
                                    type: EFFECT_STUN,
                                    params: {target: TARGET_YOU},
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};
