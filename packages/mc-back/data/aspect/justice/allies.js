import {ASPECT_JUSTICE} from "../aspects.js";
import {TRAIT_DEFENDER} from "../../../src/constants/traits.js";
import {RESOURCE_ENERGY, RESOURCE_PHYSICAL} from "../../../src/constants/resources.js";
import {
    TARGET_EFFECT,
    TARGET_ENEMY,
} from "../../../src/constants/targets.js";
import {CALC_COUNT} from "../../../src/constants/calc.js";
import {CARD_TYPE_ALLY} from "../../../src/model/printed/ally-card.js";
import {EFFECT_MODIFY_THWART_VALUE} from "../../../src/effects/modify-thwart-value-effect.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {ABILITY_RESPONSE} from "../../../src/abilities/response/response-ability.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {TRIGGER_THIS_GET_THWART} from "../../../src/triggers/this-get-thwart-trigger.js";
import {TRIGGER_THIS_THWARTS} from "../../../src/triggers/this-thwarts-trigger.js";

const set = ASPECT_JUSTICE;
export const daredevil = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Daredevil',
        set,
        image: 'aspect/justice/allies/j58.webp',
        traits: [TRAIT_DEFENDER],
        unique: true,
        cost: 4,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        subtitle: 'Matt Murdock',
        thwart: 2,
        attack: 2,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [{
            type: ABILITY_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_THWARTS,
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        damage: 1,
                    }
                }
            }
        }],
    }
};
export const jessicaJones = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Jessica Jones',
        set,
        image: 'aspect/justice/allies/j59.webp',
        traits: [TRAIT_DEFENDER],
        unique: true,
        cost: 3,
        resources: [RESOURCE_ENERGY],
        classification: set,
        thwart: 1,
        attack: 2,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_THIS_GET_THWART,
                effect: {
                    type: EFFECT_MODIFY_THWART_VALUE,
                    params: {
                        target: TARGET_EFFECT,
                        paramsCalc: {
                            target: 'player.match.sideSchemes',
                            formula: CALC_COUNT,
                        },
                    }
                }
            }
        }],
    }
};
