import {ABILITY_ACTION,ABILITY_HERO_ACTION} from '../../../src/constants/abilities.js';
import {PLACE_DISCARD_PILE} from '../../../src/constants/places.js';
import {RESOURCE_MENTAL, RESOURCE_ENERGY, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {TARGET_ALLY, TARGET_ANY_PLAYER, TARGET_ALL_PLAYERS} from '../../../src/constants/targets.js';
import {TIME_PHASE} from '../../../src/constants/times.js';
import {TRAIT_TACTIC} from '../../../src/constants/traits.js';
import {
    EFFECT_CHAINED,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PAY_PRINTED_COST,
    EFFECT_PUT_PLAY,
    EFFECT_READY,
    EFFECT_SEARCH_CARDS
} from '../../../src/constants/effects.js';
import {CARD_TYPE_ALLY, CARD_TYPE_EVENT} from '../../../src/model/printed/event-card.js';
import {ASPECT_LEADERSHIP} from '../aspects.js';

const set = ASPECT_LEADERSHIP;

export const makeTheCall = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Hacer la llamada',
        set,
        image: 'aspect/leadership/events/01071.png',
        cost: 0,
        resources: [RESOURCE_MENTAL],
        classification: set,
        abilities: [
            {
                type: ABILITY_ACTION,
                params: {
                    effect: {
                        type: EFFECT_PUT_PLAY,
                    },
                    arrow: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_DISCARD_PILE],
                                        players: TARGET_ALL_PLAYERS,
                                        filter: {
                                            type: CARD_TYPE_ALLY,
                                        },
                                        title: 'Elige un Aliado de una pila de descartes',
                                    }
                                },
                                {
                                    type: EFFECT_PAY_PRINTED_COST,
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }
};

export const leadFromTheFront = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Liderar en vanguardia',
        set,
        image: 'aspect/leadership/events/01070.png',
        traits: [TRAIT_TACTIC],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_ANY_PLAYER,
                            effects: [
                                {
                                    type: EFFECT_MODIFY_THWART_VALUE,
                                    params: {
                                        count: 1,
                                        until: TIME_PHASE,
                                    }
                                },
                                {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        count: 1,
                                        until: TIME_PHASE,
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }
};

export const getReady = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Prepárate',
        set,
        image: 'aspect/leadership/events/01069.png',
        cost: 0,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_READY,
                        params: {
                            target: TARGET_ALLY,
                        }
                    }
                }
            }
        ]
    }
};

export const events = [
    makeTheCall,
    leadFromTheFront,
    getReady
];
