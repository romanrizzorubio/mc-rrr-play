import {ASPECT_LEADERSHIP} from "../aspects.js";
import {RESOURCE_ENERGY} from "../../../src/constants/resources.js";
import {TRAIT_LOCATION, TRAIT_SHIELD} from "../../../src/constants/traits.js";
import {CARD_TYPE_SUPPORT} from "../../../src/model/printed/support-card.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {EFFECT_MODIFY_MAX_ALLIES} from "../../../src/effects/modify-max-allies-effect.js";

const set = ASPECT_LEADERSHIP;

export const theTriskelion = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'El Triskelion',
        set,
        image: 'aspect/leadership/supports/01073.png',
        traits: [TRAIT_LOCATION, TRAIT_SHIELD],
        unique: true,
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'El Triskelion',
                    effect: {
                        type: EFFECT_MODIFY_MAX_ALLIES,
                        params: {
                            count: 1,
                        }
                    }
                }
            }
        ]
    }
};

export const supports = [
    theTriskelion,
];
