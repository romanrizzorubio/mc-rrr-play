import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    DECK_POSITION_SHUFFLE,
    EFFECT_CHAINED,
    EFFECT_DEAL_BOOST,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_UNTIL,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MOVE_TO_DECK,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SIMULTANEOUS,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TOUGH,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_SOURCE,
    TARGET_YOU,
    TRAIT_ELITE,
    TRAIT_TEMPORAL,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

const SET = 'anachronauts';
const TEMPORAL_ELITE = [TRAIT_ELITE, TRAIT_TEMPORAL];

const apocrifus = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Apócrifus',
        set: SET,
        image: 'sets/anachronauts/11040.png',
        unique: true,
        traits: TEMPORAL_ELITE,
        boost: 0,
        attack: 3,
        scheme: 1,
        hitPoints: 4,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {
                            target: TARGET_SOURCE,
                            source: 'player.gameZone.cards',
                            condition: [
                                {isAlly: true},
                                {isSupport: true},
                            ],
                            selectCount: 1,
                            title: 'Descarta un Aliado o Apoyo que controles',
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_EXHAUST,
                                params: {
                                    target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                    selectCount: 1,
                                },
                            },
                            {
                                type: EFFECT_DEAL_BOOST,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'enemyActivation.enemy',
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
};

const deadlyPursuit9000 = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Caza Mortal 9000',
        set: SET,
        image: 'sets/anachronauts/11041.png',
        unique: true,
        traits: TEMPORAL_ELITE,
        boost: 0,
        attack: 1,
        scheme: 1,
        hitPoints: 6,
        keywords: {
            toughness: true,
            villainous: true,
        },
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_SIMULTANEOUS,
                    params: {
                        effects: [
                            {
                                type: EFFECT_TOUGH,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'enemyActivation.enemy',
                                },
                            },
                            {
                                type: EFFECT_DEAL_BOOST,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'enemyActivation.enemy',
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
};

const sirRaston = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Sir Raston',
        set: SET,
        image: 'sets/anachronauts/11042.png',
        unique: true,
        traits: TEMPORAL_ELITE,
        boost: 0,
        attack: 2,
        scheme: 1,
        hitPoints: 6,
        keywords: {
            guard: true,
            retaliate: 1,
        },
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_TAKE_DAMAGE,
                                params: {
                                    target: TARGET_YOU,
                                    damage: 1,
                                },
                            },
                            {
                                type: EFFECT_DEAL_BOOST,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'enemyActivation.enemy',
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
};

const terminatrix = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Terminatrix',
        set: SET,
        image: 'sets/anachronauts/11043.png',
        unique: true,
        traits: TEMPORAL_ELITE,
        boost: 0,
        attack: 2,
        scheme: 2,
        hitPoints: 5,
        keywords: {
            quickStrike: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK,
                        params: {
                            target: TARGET_EFFECT,
                            modify: {
                                keywords: {
                                    piercing: true,
                                },
                            },
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
                        target: TARGET_SOURCE,
                        source: 'enemyActivation.enemy',
                        count: 2,
                    },
                },
            },
        },
    },
};

const wildrun = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Wildrun',
        set: SET,
        image: 'sets/anachronauts/11044.png',
        unique: true,
        traits: TEMPORAL_ELITE,
        boost: 0,
        attack: 2,
        scheme: 1,
        hitPoints: 5,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_DISCARD_RANDOM,
                        params: {
                            target: TARGET_YOU,
                            count: 1,
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_DISCARD_RANDOM,
                                params: {
                                    target: TARGET_YOU,
                                    count: 1,
                                },
                            },
                            {
                                type: EFFECT_DEAL_BOOST,
                                params: {
                                    target: TARGET_SOURCE,
                                    source: 'enemyActivation.enemy',
                                },
                            },
                        ],
                    },
                },
            },
        },
    },
};

const anachronauts = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Los Anacronautas',
        set: SET,
        image: 'sets/anachronauts/11045.png',
        boost: 3,
        startingThreat: [3, true],
        icons: {hazard: 1},
        abilities: [
            {
                type: ABILITY_WHEN_DEFEATED,
                params: {
                    effect: {
                        type: EFFECT_MOVE_TO_DECK,
                        params: {
                            target: TARGET_ENCOUNTER_DECK,
                            cards: 'match.scenario.deck.discardPile',
                            cardCondition: {
                                traits: TRAIT_TEMPORAL,
                            },
                            position: DECK_POSITION_SHUFFLE,
                        },
                    },
                },
            },
        ],
    },
};

const chosenOfKang = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Los elegidos de Kang',
        set: SET,
        image: 'sets/anachronauts/11046.png',
        boost: 2,
        keywords: {
            incite: 1,
        },
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_UNTIL,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        condition: {
                                            isMinion: true,
                                            traits: TRAIT_TEMPORAL,
                                        },
                                        removeFromDiscard: true,
                                    },
                                },
                                {
                                    type: EFFECT_REVEAL_ENCOUNTER,
                                    params: {
                                        card: 'selectedCard',
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

export default {
    _id: SET,
    config: {
        name: 'Anacronautas',
        standard: false,
        cards: [
            {count: 1, card: apocrifus},
            {count: 1, card: deadlyPursuit9000},
            {count: 1, card: sirRaston},
            {count: 1, card: terminatrix},
            {count: 1, card: wildrun},
            {count: 2, card: anachronauts},
            {count: 2, card: chosenOfKang},
        ],
    },
};
