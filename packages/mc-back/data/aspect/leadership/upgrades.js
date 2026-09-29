import {ASPECT_LEADERSHIP} from "../aspects.js";
import {RESOURCE_MENTAL, RESOURCE_ENERGY, RESOURCE_PHYSICAL} from "../../../src/constants/resources.js";
import {TRAIT_CONDITION} from "../../../src/constants/traits.js";
import {TARGET_ALLY, TARGET_ATTACHED} from "../../../src/constants/targets.js";
import {CARD_TYPE_UPGRADE} from "../../../src/model/printed/upgrade-card.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {EFFECT_MODIFY_ATTACK_VALUE} from "../../../src/effects/modify-attack-value-effect.js";
import {EFFECT_MODIFY_THWART_VALUE} from "../../../src/effects/modify-thwart-value-effect.js";

const set = ASPECT_LEADERSHIP;

export const inspiration = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Inspiración',
        set,
        image: 'aspect/leadership/upgrades/01074.png',
        traits: [TRAIT_CONDITION],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        attach: TARGET_ALLY,
        maxAttach: 1,
        maximum: {
            count: 3,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Inspiración',
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_ATTACHED,
                            effects: [
                                {
                                    type: EFFECT_MODIFY_THWART_VALUE,
                                    params: {
                                        count: 1,
                                    }
                                },
                                {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        count: 1,
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }
};

export const upgrades = [
    inspiration
];
