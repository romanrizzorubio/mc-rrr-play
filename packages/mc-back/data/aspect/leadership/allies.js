import {ABILITY_ACTION,ABILITY_CONSTANT,ABILITY_OPTION,ABILITY_RESPONSE} from '../../../src/constants/abilities.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {TARGET_ALL_PLAYERS, TARGET_CHARACTER, TARGET_THIS} from '../../../src/constants/targets.js';
import {TIME_PHASE, TIME_ROUND} from '../../../src/constants/times.js';
import {TRAIT_DROID, TRAIT_AVENGER, TRAIT_SHIELD} from '../../../src/constants/traits.js';
import {TRIGGER_ENGAGE_HERO, TRIGGER_THIS_ENTER_PLAY} from '../../../src/constants/triggers.js';
import {
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SPEND
} from '../../../src/constants/effects.js';
import {CARD_TYPE_ALLY} from '../../../src/model/printed/ally-card.js';
import {ASPECT_LEADERSHIP} from '../aspects.js';

const set = ASPECT_LEADERSHIP;

export const mariaHill = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Maria Hill',
        set,
        image: 'aspect/leadership/allies/01067.png',
        traits: [TRAIT_SHIELD],
        unique: true,
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: set,
        thwart: 2,
        attack: 1,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 2,
        abilities: [
            {
                type: ABILITY_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_ENTER_PLAY,
                    effect: {
                        type: EFFECT_DRAW_CARD,
                        params: {
                            count: 1,
                            target: TARGET_ALL_PLAYERS,
                        }
                    }
                }
            }
        ]
    }
};

export const vision = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Visión',
        set,
        image: 'aspect/leadership/allies/01068.png',
        traits: [TRAIT_DROID, TRAIT_AVENGER],
        unique: true,
        cost: 4,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        thwart: 1,
        attack: 2,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [
            {
                type: ABILITY_ACTION,
                params: {
                    limit: {count: 1, time: TIME_ROUND},
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [RESOURCE_ENERGY],
                        }
                    },
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Recibe +2 de INT',
                                        effect: {
                                            type: EFFECT_MODIFY_THWART_VALUE,
                                            params: {
                                                target: TARGET_THIS,
                                                count: 2,
                                                until: TIME_PHASE,
                                            }
                                        }
                                    }
                                },
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Recibe +2 de ATQ',
                                        effect: {
                                            type: EFFECT_MODIFY_ATTACK_VALUE,
                                            params: {
                                                target: TARGET_THIS,
                                                count: 2,
                                                until: TIME_PHASE,
                                            }
                                        }
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

export const hawkeye = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Ojo de Halcón',
        subtitle: 'Clint Barton',
        set,
        image: 'aspect/leadership/allies/01066.png',
        traits: [TRAIT_AVENGER],
        unique: true,
        cost: 3,
        resources: [RESOURCE_ENERGY],
        classification: set,
        thwart: 1,
        attack: 1,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_ENTER_PLAY,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            counters: 4,
                            target: TARGET_THIS,
                        }
                    }
                }
            },
            {
                type: ABILITY_RESPONSE,
                params: {
                    trigger: TRIGGER_ENGAGE_HERO,
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            damage: 2,
                            target: TARGET_CHARACTER,
                            cost: {
                                type: EFFECT_REMOVE_COUNTER,
                                params: {
                                    count: 1,
                                }
                            }
                        }
                    }
                }
            }
        ]
    }
};

export const allies = [
    mariaHill,
    vision,
    hawkeye,
];
