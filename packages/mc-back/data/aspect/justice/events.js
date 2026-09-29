import {ASPECT_JUSTICE} from "../aspects.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL} from "../../../src/constants/resources.js";
import {
    TARGET_EFFECT,
    TARGET_SCHEME, TARGET_YOU
} from "../../../src/constants/targets.js";
import {LABEL_THWART} from "../../../src/constants/labels.js";
import {TRAIT_THWART} from "../../../src/constants/traits.js";
import {CARD_TYPE_EVENT} from "../../../src/model/printed/event-card.js";
import {EFFECT_TAKE_DAMAGE} from "../../../src/effects/take-damage-effect.js";
import {EFFECT_PREVENT_PLACE_THREAT} from "../../../src/effects/prevent-place-threat-effect.js";
import {ABILITY_HERO_ACTION} from "../../../src/abilities/actions/hero-action-ability.js";
import {EFFECT_DO_IF_HAS_PAID} from "../../../src/effects/do-if-has-paid-effect.js";
import {EFFECT_REMOVE_THREAT} from "../../../src/effects/remove-threat-effect.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {ABILITY_HERO_INTERRUPT} from "../../../src/abilities/interrupt/hero-interrupt-ability.js";
import {TRIGGER_PLACE_THREAT} from "../../../src/triggers/place-threat-trigger.js";

const set = ASPECT_JUSTICE;
export const forJustice = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'For Justice',
        set,
        image: 'aspect/justice/events/j60-copy-2.webp',
        traits: [TRAIT_THWART],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_THWART],
                effect: {
                    type: EFFECT_DO_IF_HAS_PAID,
                    params: {
                        resources: [RESOURCE_MENTAL],
                        effect: {
                            type: EFFECT_REMOVE_THREAT,
                            params: {
                                target: TARGET_SCHEME,
                                threat: 4,
                            }
                        },
                        effectNot: {
                            type: EFFECT_REMOVE_THREAT,
                            params: {
                                target: TARGET_SCHEME,
                                threat: 3,
                            }
                        }
                    }
                }
            }
        }],
    }
};
export const greatResponsability = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Great Responsability',
        set,
        image: 'aspect/justice/events/j61-copy-2.webp',
        cost: 0,
        resources: [RESOURCE_MENTAL],
        classification: set,
        abilities: [{
            type: ABILITY_HERO_INTERRUPT,
            params: {
                trigger: TRIGGER_PLACE_THREAT,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_PREVENT_PLACE_THREAT,
                            params: {
                                target: TARGET_EFFECT,
                            }
                        }, {
                            type: EFFECT_TAKE_DAMAGE,
                            params: {
                                target: TARGET_YOU,
                                paramsCalc: {
                                    target: 'effects.0.preventThreat',
                                }
                            }
                        }],
                    }
                }
            }
        }],
    }
};

