import {ABILITY_HERO_ACTION,ABILITY_RESPONSE} from '../../../src/constants/abilities.js';
import {LABEL_ATTACK, LABEL_THWART} from '../../../src/constants/labels.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {TARGET_ENEMY, TARGET_MINION, TARGET_SCHEME} from '../../../src/constants/targets.js';
import {TRAIT_ATTACK, TRAIT_THWART} from '../../../src/constants/traits.js';
import {TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY} from '../../../src/constants/triggers.js';
import {EFFECT_DEAL_DAMAGE, EFFECT_DO_IF_HAS_PAID, EFFECT_REMOVE_THREAT} from '../../../src/constants/effects.js';
import {CARD_TYPE_EVENT} from '../../../src/model/printed/event-card.js';
import {ASPECT_AGGRESSION} from '../aspects.js';

const set = ASPECT_AGGRESSION;
export const chaseThemDown = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'A por ellos',
        set,
        image: 'aspect/aggression/events/a52-copy-2.webp',
        traits: [TRAIT_THWART],
        cost: 0,
        resources: [RESOURCE_MENTAL],
        classification: set,
        abilities: [{
            type: ABILITY_RESPONSE,
            params: {
                labels: [LABEL_THWART],
                trigger: TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        threat: 2,
                        target: TARGET_SCHEME,
                    }
                }
            }
        }],
    }
};
export const relentlessAssault = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Asalto implacable',
        set,
        image: 'aspect/aggression/events/a53-copy-2.webp',
        traits: [TRAIT_ATTACK],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DO_IF_HAS_PAID,
                    params: {
                        resources: [RESOURCE_PHYSICAL],
                        target: TARGET_MINION,
                        effect: {
                            type: EFFECT_DEAL_DAMAGE,
                            params: {
                                target: TARGET_MINION,
                                damage: 5,
                                keywords: {
                                    overkill: true,
                                }
                            }
                        },
                        effectNot: {
                            type: EFFECT_DEAL_DAMAGE,
                            params: {
                                target: TARGET_MINION,
                                damage: 5,
                            }
                        }
                    }
                }
            }
        }],
    }
};
export const uppercut = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Gancho',
        set,
        image: 'aspect/aggression/events/a54-copy-2.webp',
        traits: [TRAIT_ATTACK],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        damage: 5,
                    }
                }
            }
        }],
    }
};
