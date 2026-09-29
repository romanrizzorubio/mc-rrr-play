import {ASPECT_BASIC} from "../aspects.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL} from "../../../src/constants/resources.js";
import {TARGET_CHARACTER, TARGET_EFFECT, TARGET_ENEMY} from "../../../src/constants/targets.js";
import {LABEL_ATTACK, LABEL_THWART} from "../../../src/constants/labels.js";
import {TRAIT_ATTACK, TRAIT_THWART} from "../../../src/constants/traits.js";
import {CARD_TYPE_EVENT} from "../../../src/model/printed/event-card.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {ABILITY_HERO_ACTION} from "../../../src/abilities/actions/hero-action-ability.js";
import {ABILITY_INTERRUPT} from "../../../src/abilities/interrupt/interrupt-ability.js";
import {EFFECT_PREVENT_PLACE_THREAT} from "../../../src/effects/prevent-place-threat-effect.js";
import {EFFECT_HEAL} from "../../../src/effects/heal-effect.js";
import {ABILITY_ACTION} from "../../../src/abilities/actions/action-ability.js";
import {TRIGGER_VILLAIN_SCHEMES} from "../../../src/triggers/villain-schemes-trigger.js";

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
