import {ASPECT_PROTECTION} from "../aspects.js";
import {TRAIT_SHIELD} from "../../../src/constants/traits.js";
import {RESOURCE_ENERGY} from "../../../src/constants/resources.js";
import {TARGET_FRIENDLY_CHARACTER, TARGET_THIS} from "../../../src/constants/targets.js";
import {CARD_TYPE_SUPPORT} from "../../../src/model/printed/support-card.js";
import {ABILITY_ACTION} from "../../../src/abilities/actions/action-ability.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {EFFECT_EXHAUST} from "../../../src/effects/exhaust-effect.js";
import {EFFECT_REMOVE_USE} from "../../../src/effects/remove-counters-effect.js";
import {EFFECT_HEAL} from "../../../src/effects/heal-effect.js";

const set = ASPECT_PROTECTION;

export const medicalTeam = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Equipo médico',
        set,
        image: 'aspect/protection/supports/01080.png',
        traits: [TRAIT_SHIELD],
        cost: 3,
        resources: [RESOURCE_ENERGY],
        classification: set,
        keywords: {uses: 3},
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                name: 'Equipo médico',
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
                    type: EFFECT_HEAL,
                    params: {
                        target: TARGET_FRIENDLY_CHARACTER,
                        damage: 2,
                    }
                }
            }
        }],
    }
};

export const supports = [
    medicalTeam,
];
