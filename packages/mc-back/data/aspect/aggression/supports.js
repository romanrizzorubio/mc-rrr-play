import {ASPECT_AGGRESSION} from "../aspects.js";
import {TRAIT_SHIELD} from "../../../src/constants/traits.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL} from "../../../src/constants/resources.js";
import {
    TARGET_ENEMY, TARGET_THIS,
} from "../../../src/constants/targets.js";
import {CARD_TYPE_SUPPORT} from "../../../src/model/printed/support-card.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {ABILITY_ACTION} from "../../../src/abilities/actions/action-ability.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {EFFECT_EXHAUST} from "../../../src/effects/exhaust-effect.js";
import {EFFECT_REMOVE_USE} from "../../../src/effects/remove-counters-effect.js";

const set = ASPECT_AGGRESSION;
export const tacTeam = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Tac Team',
        set,
        image: 'aspect/aggression/supports/a56-copy-2.webp',
        traits: [TRAIT_SHIELD],
        cost: 3,
        resources: [RESOURCE_ENERGY],
        classification: set,
        keywords: {uses: 3},
        abilities: [{
            type: ABILITY_ACTION,
            params: {
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
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        threat: 2,
                    }
                }
            }
        }],
    }
};
