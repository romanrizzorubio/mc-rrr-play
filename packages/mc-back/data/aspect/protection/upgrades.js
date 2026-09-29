import {ASPECT_PROTECTION} from "../aspects.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL} from "../../../src/constants/resources.js";
import {TRAIT_ARMOR, TRAIT_CONDITION} from "../../../src/constants/traits.js";
import {TARGET_HERO, TARGET_THIS} from "../../../src/constants/targets.js";
import {CARD_TYPE_UPGRADE} from "../../../src/model/printed/upgrade-card.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {ABILITY_RESPONSE} from "../../../src/abilities/response/response-ability.js";
import {EFFECT_MODIFY_DEFENSE_VALUE} from "../../../src/effects/modify-defense-value-effect.js";
import {EFFECT_READY} from "../../../src/effects/ready-effect.js";
import {EFFECT_DISCARD} from "../../../src/effects/discard-effect.js";
import {TRIGGER_VILLAIN_ATTACKS_YOU} from "../../../src/triggers/villain-attacks-you-trigger.js";

const set = ASPECT_PROTECTION;

export const armoredVest = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Chaleco blindado',
        set,
        image: 'aspect/protection/upgrades/01081.png',
        traits: [TRAIT_ARMOR],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: set,
        maximum: {
            count: 1,
            perPlayer: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Chaleco blindado',
                    effect: {
                        type: EFFECT_MODIFY_DEFENSE_VALUE,
                        params: {
                            target: TARGET_HERO,
                            count: 1,
                        }
                    }
                }
            }
        ]
    }
};

export const indomitable = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Indómito',
        set,
        image: 'aspect/protection/upgrades/01082.png',
        traits: [TRAIT_CONDITION],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [
            {
                type: ABILITY_RESPONSE,
                params: {
                    name: 'Indómito',
                    trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
                    condition: {
                        'activation.isDefended': true,
                        'activation.defender.isHero': true,
                    },
                    arrow: {
                        type: EFFECT_DISCARD,
                        params: {
                            target: TARGET_THIS,
                        }
                    },
                    effect: {
                        type: EFFECT_READY,
                        params: {
                            target: TARGET_HERO,
                        }
                    }
                }
            }
        ]
    }
};

export const upgrades = [
    armoredVest,
    indomitable,
];
