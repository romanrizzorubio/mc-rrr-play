import {ASPECT_LEADERSHIP} from "../aspects.js";
import {RESOURCE_MENTAL, RESOURCE_ENERGY, RESOURCE_PHYSICAL} from "../../../src/constants/resources.js";
import {TRAIT_TACTIC} from "../../../src/constants/traits.js";
import {TARGET_ALLY, TARGET_ANY_PLAYER, TARGET_ALL_PLAYERS} from "../../../src/constants/targets.js";
import {CARD_TYPE_ALLY, CARD_TYPE_EVENT} from "../../../src/model/printed/event-card.js";
import {EFFECT_READY} from "../../../src/effects/ready-effect.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {EFFECT_SEARCH_CARDS} from "../../../src/effects/search-cards-effect.js";
import {EFFECT_PAY_PRINTED_COST} from "../../../src/effects/pay-printed-cost-effect.js";
import {EFFECT_PUT_PLAY} from "../../../src/effects/put-play-effect.js";
import {EFFECT_MODIFY_THWART_VALUE} from "../../../src/effects/modify-thwart-value-effect.js";
import {EFFECT_MODIFY_ATTACK_VALUE} from "../../../src/effects/modify-attack-value-effect.js";
import {ABILITY_ACTION} from "../../../src/abilities/actions/action-ability.js";
import {ABILITY_HERO_ACTION} from "../../../src/abilities/actions/hero-action-ability.js";
import {TIME_PHASE} from "../../../src/constants/times.js";
import {PLACE_DISCARD_PILE} from "../../../src/constants/places.js";

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
