import {ABILITY_HERO_ACTION,ABILITY_HERO_INTERRUPT} from '../../../src/constants/abilities.js';
import {LABEL_THWART} from '../../../src/constants/labels.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL} from '../../../src/constants/resources.js';
import {
    TARGET_EFFECT,
    TARGET_SCHEME, TARGET_YOU
} from '../../../src/constants/targets.js';
import {TRAIT_THWART} from '../../../src/constants/traits.js';
import {TRIGGER_WOULD_PLACE_THREAT} from '../../../src/constants/triggers.js';
import {EFFECT_CHAINED, EFFECT_DO_IF_HAS_PAID, EFFECT_PREVENT_PLACE_THREAT, EFFECT_REMOVE_THREAT, EFFECT_TAKE_DAMAGE} from '../../../src/constants/effects.js';
import {CARD_TYPE_EVENT} from '../../../src/model/printed/event-card.js';
import {ASPECT_JUSTICE} from '../aspects.js';

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
                trigger: TRIGGER_WOULD_PLACE_THREAT,
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
