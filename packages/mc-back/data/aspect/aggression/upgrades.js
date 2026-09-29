import {ASPECT_JUSTICE} from "../aspects.js";
import {TRAIT_SKILL} from "../../../src/constants/traits.js";
import {RESOURCE_PHYSICAL} from "../../../src/constants/resources.js";
import {
    TARGET_EFFECT,
} from "../../../src/constants/targets.js";
import {CARD_TYPE_UPGRADE} from "../../../src/model/printed/upgrade-card.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {EFFECT_MODIFY_ATTACK_VALUE} from "../../../src/effects/modify-attack-value-effect.js";
import {TRIGGER_YOUR_HERO_GET_ATTACK} from "../../../src/triggers/your-hero-get-attack-trigger.js";

const set = ASPECT_JUSTICE;
export const combatTraining = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Entrenamiento de combate',
        set,
        image: 'aspect/aggression/upgrades/a57-copy-2.webp',
        traits: [TRAIT_SKILL],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        maximum: {
            count: 1,
        },
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
                effect: {
                    type: EFFECT_MODIFY_ATTACK_VALUE,
                    params: {
                        target: TARGET_EFFECT,
                        count: 1,
                    }
                },
            }
        }],
    }
};
