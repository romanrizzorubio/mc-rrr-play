import {ASPECT_JUSTICE} from "../aspects.js";
import {TRAIT_SKILL} from "../../../src/constants/traits.js";
import {RESOURCE_ENERGY} from "../../../src/constants/resources.js";
import {
    TARGET_EFFECT,
} from "../../../src/constants/targets.js";
import {CARD_TYPE_UPGRADE} from "../../../src/model/printed/upgrade-card.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {EFFECT_MODIFY_THWART_VALUE} from "../../../src/effects/modify-thwart-value-effect.js";
import {TRIGGER_YOUR_HERO_GET_THWART} from "../../../src/triggers/your-hero-get-thwart-trigger.js";

const set = ASPECT_JUSTICE;
export const heroicIntuition = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Intuición heróica',
        set,
        image: 'aspect/justice/upgrades/j65-copy.webp',
        traits: [TRAIT_SKILL],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: set,
        maximum: {
            count: 1,
        },
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_YOUR_HERO_GET_THWART,
                effect: {
                    type: EFFECT_MODIFY_THWART_VALUE,
                    params: {
                        target: TARGET_EFFECT,
                        count: 1,
                    }
                },
            }
        }],
    }
};
