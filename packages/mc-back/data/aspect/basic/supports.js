import {ABILITY_ACTION} from '../../../src/constants/abilities.js';
import {RESOURCE_MENTAL, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {
    TARGET_ANY_PLAYER,
    TARGET_CARD, TARGET_EFFECT,
    TARGET_PLAYER,
} from '../../../src/constants/targets.js';
import {TRAIT_AVENGER, TRAIT_LOCATION, TRAIT_SHIELD} from '../../../src/constants/traits.js';
import {TRIGGER_END_PLAY_CARD, TRIGGER_PHASE_ENDS, TRIGGER_PLAY_CARD} from '../../../src/constants/triggers.js';
import {EFFECT_DRAW_CARD, EFFECT_EXHAUST, EFFECT_LASTING, EFFECT_MODIFY_COST} from '../../../src/constants/effects.js';
import {CARD_TYPE_ANY} from '../../../src/model/printed/card.js';
import {CARD_TYPE_SUPPORT} from '../../../src/model/printed/support-card.js';
import {ASPECT_BASIC} from '../aspects.js';

const set = ASPECT_BASIC;
export const avengersMansion = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Avengers Mansion',
        set,
        image: 'aspect/basic/supports/b91-copy-2.webp',
        traits: [TRAIT_AVENGER, TRAIT_LOCATION],
        cost: 4,
        resources: [RESOURCE_MENTAL],
        classification: set,
        maximum: {
            count: 1,
        },
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                arrow: {
                    type: EFFECT_EXHAUST,
                    params: {
                        target: TARGET_CARD,
                    }
                },
                effect: {
                    type: EFFECT_DRAW_CARD,
                    params: {
                        target: TARGET_ANY_PLAYER,
                    }
                }
            }
        }],
    }
};
export const helicarrier = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Helicarrier',
        set,
        image: 'aspect/basic/supports/b92-copy-2.webp',
        traits: [TRAIT_SHIELD, TRAIT_LOCATION],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        maximum: {
            count: 1,
        },
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                arrow: {
                    type: EFFECT_EXHAUST,
                    params: {
                        target: TARGET_CARD,
                    }
                },
                effect: {
                    type: EFFECT_LASTING,
                    params: {
                        target: TARGET_PLAYER,
                        until: [TRIGGER_END_PLAY_CARD, TRIGGER_PHASE_ENDS],
                        triggerType: TRIGGER_PLAY_CARD,
                        hideDialog: true,
                        effect: {
                            type: EFFECT_MODIFY_COST,
                            params: {
                                target: TARGET_EFFECT,
                                cardType: CARD_TYPE_ANY,
                                count: -1,
                            }
                        }
                    }
                }
            }
        }],
    }
};
