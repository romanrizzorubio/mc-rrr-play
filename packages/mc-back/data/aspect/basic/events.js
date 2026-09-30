import {ABILITY_ACTION,ABILITY_HERO_ACTION,ABILITY_INTERRUPT} from '../../../src/constants/abilities.js';
import {LABEL_ATTACK, LABEL_THWART} from '../../../src/constants/labels.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL} from '../../../src/constants/resources.js';
import {TARGET_CHARACTER, TARGET_EFFECT, TARGET_ENEMY} from '../../../src/constants/targets.js';
import {TRAIT_ATTACK, TRAIT_THWART} from '../../../src/constants/traits.js';
import {TRIGGER_VILLAIN_SCHEMES} from '../../../src/constants/triggers.js';
import {EFFECT_DEAL_DAMAGE, EFFECT_HEAL, EFFECT_PREVENT_PLACE_THREAT} from '../../../src/constants/effects.js';
import {CARD_TYPE_EVENT} from '../../../src/model/printed/event-card.js';
import {ASPECT_BASIC} from '../aspects.js';

const set = ASPECT_BASIC;
export const emergency = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Emergency',
        set,
        image: 'aspect/basic/events/b85-copy-2.webp',
        traits: [TRAIT_THWART],
        cost: 0,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [{
            type: ABILITY_INTERRUPT,
            params: {
                labels: [LABEL_THWART],
                trigger: TRIGGER_VILLAIN_SCHEMES,
                effect: {
                    type: EFFECT_PREVENT_PLACE_THREAT,
                    params: {
                        threat: 1,
                        target: TARGET_EFFECT,
                    }
                }
            }
        }],
    }
};
export const firstAid = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'First Aid',
        set,
        image: 'aspect/basic/events/b86-copy-2.webp',
        traits: [],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: set,
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                effect: {
                    type: EFFECT_HEAL,
                    params: {
                        damage: 2,
                        target: TARGET_CHARACTER,
                    }
                }
            }
        }],
    }
};
export const haymaker = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Haymaker',
        set,
        image: 'aspect/basic/events/b87-1.webp',
        traits: [TRAIT_ATTACK],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        damage: 3,
                        target: TARGET_ENEMY,
                    }
                }
            }
        }],
    }
};
