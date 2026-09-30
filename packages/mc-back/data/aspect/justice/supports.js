import {ABILITY_ACTION,ABILITY_RESPONSE} from '../../../src/constants/abilities.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL} from '../../../src/constants/resources.js';
import { TARGET_SCHEME, TARGET_THIS,
} from '../../../src/constants/targets.js';
import {TRAIT_LOCATION, TRAIT_SHIELD} from '../../../src/constants/traits.js';
import {TRIGGER_YOU_DEFEAT_MINION} from '../../../src/constants/triggers.js';
import {EFFECT_CHAINED, EFFECT_EXHAUST, EFFECT_REMOVE_USE, EFFECT_REMOVE_THREAT} from '../../../src/constants/effects.js';
import {CARD_TYPE_SUPPORT} from '../../../src/model/printed/support-card.js';
import {ASPECT_JUSTICE} from '../aspects.js';

const set = ASPECT_JUSTICE;
export const interrogationRoom = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Interrogation Room',
        set,
        image: 'aspect/justice/supports/j63-copy-2.webp',
        traits: [TRAIT_LOCATION],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: set,
        maximum: {
            count: 1,
        },
        abilities: [{
            type: ABILITY_RESPONSE,
            params: {
                trigger: TRIGGER_YOU_DEFEAT_MINION,
                arrow: {
                    type: EFFECT_EXHAUST,
                    params: {
                        target: TARGET_THIS,
                    }
                },
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        threat: 1,
                    }
                }
            }
        }],
    }
};
export const surveillanceTeam = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Surveillance Team',
        set,
        image: 'aspect/justice/supports/j64-copy.webp',
        traits: [TRAIT_SHIELD],
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: set,
        keywords: {uses: 3},
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                arrow: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_THIS,
                        matchAll: true,
                        effects: [{
                            type: EFFECT_EXHAUST,
                            params: {
                                target: TARGET_THIS,
                            }
                        }, {
                            type: EFFECT_REMOVE_USE,
                            params: {
                                target: TARGET_THIS,
                                count: 1
                            }
                        }]
                    }
                },
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        threat: 1,
                    }
                }
            }
        }],
    }
};
