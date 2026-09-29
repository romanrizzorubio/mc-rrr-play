import {ASPECT_LEADERSHIP} from "../aspects.js";
import {TRAIT_DROID, TRAIT_AVENGER, TRAIT_SHIELD} from "../../../src/constants/traits.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL} from "../../../src/constants/resources.js";
import {CARD_TYPE_ALLY} from "../../../src/model/printed/ally-card.js";
import {EFFECT_DRAW_CARD} from "../../../src/effects/draw-effect.js";
import {EFFECT_MODIFY_ATTACK_VALUE} from "../../../src/effects/modify-attack-value-effect.js";
import {EFFECT_MODIFY_THWART_VALUE} from "../../../src/effects/modify-thwart-value-effect.js";
import {EFFECT_SPEND} from "../../../src/effects/spend-effect.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {EFFECT_REMOVE_COUNTER, EFFECT_REMOVE_USE} from "../../../src/effects/remove-counters-effect.js";
import {EFFECT_PLACE_COUNTERS} from "../../../src/effects/place-counters-effect.js";
import {EFFECT_CHOOSE_ABILITY} from "../../../src/effects/choose-ability-effect.js";
import {TARGET_ALL_PLAYERS, TARGET_CHARACTER, TARGET_THIS} from "../../../src/constants/targets.js";
import {TRIGGER_THIS_ENTER_PLAY} from "../../../src/triggers/this-enter-play-trigger.js";
import {TRIGGER_ENGAGE_HERO} from "../../../src/triggers/engage-hero-trigger.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {ABILITY_RESPONSE} from "../../../src/abilities/response/response-ability.js";
import {ABILITY_ACTION} from "../../../src/abilities/actions/action-ability.js";
import {ABILITY_OPTION} from "../../../src/abilities/misc/option-ability.js";
import {TIME_PHASE, TIME_ROUND} from "../../../src/constants/times.js";

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
